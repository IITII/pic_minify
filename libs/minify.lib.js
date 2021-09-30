/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/09/29
 */
'use strict'
const os = require('os'),
    fs = require('fs'),
    path = require('path'),
    {mapLimit} = require('async'),
    imageminWebp = require('imagemin-webp'),
    // imageminPngquant = require('imagemin-pngquant'),
    // imageminMozjpeg = require('imagemin-mozjpeg'),
    imageminGifsicle = require('imagemin-gifsicle')
let imagemin = null,
    imageminSvgo = null

/**
 * 使用 imagemin 进行图片压缩
 * @param input
 * @param destination
 * @returns {Promise<*>}
 */
async function minify(input, destination) {
    if (imagemin === null) {
        imagemin = (await import('imagemin')).default
    }
    if (imageminSvgo === null) {
        imageminSvgo = (await import('imagemin-svgo')).default
    }
    const plugins = [
        // imageminMozjpeg({
        //     // https://www.npmjs.com/package/imagemin-mozjpeg
        //     // Compression quality, in range 0 (worst) to 100 (perfect).
        //     quality: '75',
        //     // 网片加载时从模糊到清楚，而不是从上往下
        //     progressive: true,
        // }),
        // imageminPngquant({
        //     // https://www.npmjs.com/package/imagemin-pngquant
        //     // Speed 10 has 5% lower quality, but is about 8 times
        //     // faster than the default. Speed 11 disables dithering
        //     // and lowers compression level.
        //     speed: 10,
        //     // 颜色通道位深度
        //     // 图片质量范围，越大质量越高
        //     quality: [0.6, 0.8],
        // }),
        imageminSvgo({
            // https://www.npmjs.com/package/imagemin-svgo
            // https://github.com/svg/svgo#configuration
            // boolean. false by default
            multipass: true,
            // 'base64', 'enc' or 'unenc'. 'base64' by default
            datauri: 'enc',
            js2svg: {
                // string with spaces or number of spaces. 4 by default
                indent: 2,
                // boolean, false by default
                pretty: true,
            },
        }),
        imageminWebp({quality: 75}),
        imageminGifsicle(),
    ]
    return imagemin(input, {destination, plugins})
}

/**
 * Calc how much time spent on run function.
 * @param logger logger
 * @param prefix prefix
 * @param func {Function} Run function
 * @param args function's args
 */
async function spendTime(logger, prefix = '', func, ...args) {
    return await new Promise(async (resolve, reject) => {
        let start = new Date()
        try {
            let res = await func.apply(this, args)
            return resolve(res)
        } catch (e) {
            return reject(e)
        } finally {
            let cost = new Date() - start
            let logInfo = cost > 1000 ? cost / 1000 + 's' : cost + 'ms'
            logger.info(`${prefix} total spent ${logInfo}.`)
        }
    })
}


/**
 * 转换目录
 * @param input 输入基本目录
 * @param iRegex 图片正则
 * @param output 输出基本文件夹，如果为空默认为输入基本目录加上 suffix
 * @param limit 转换并发上限
 * @param skipIfLarge 转换后文件如果变大使用源文件
 * @param minSize 最小文件大小，默认 1.5MB
 * @param logger 默认console
 * @returns [{data:'',sourcePath:'',destinationPath:''}]
 */
async function convert(input, iRegex, output,
                       limit = os.cpus().length - 1,
                       skipIfLarge,
                       minSize = 1.5 * 1024 * 1024,
                       logger = console) {
    if (!fs.statSync(input).isDirectory()) {
        return logger.error(`${input} should be a dir`)
    }
    if (fs.statSync(input).isDirectory() && fs.existsSync(output) && fs.statSync(output).isFile()) {
        return logger.error(`${output} shouldn't be a file when ${input} is a dir`)
    }
    // 避免核心数过少的机器并发度为0
    limit = limit < 1 ? 1 : limit
    return spendTime(logger, `Readdir ${input}`, readdir, input, iRegex, minSize, logger)
        .then(f => f.map(_ => convertPath(input, _)))
        // https://caolan.github.io/async/v3/docs.html#mapLimit
        .then(async f => await mapLimit(f, limit, async (item, cb) => {
            const {input, output} = item
            return await spendTime(logger, `Minify ${input}`, minify, [input], output)
                // skip if large
                .then(files => _skipIfLarge(files, skipIfLarge))
                .finally(cb)
        }))
        // 展开结果
        .then(_ => _.flat(Infinity))
        .catch(e => logger.error(e.message))
}

/**
 * 文件路径转换
 * @param inputBase 输入基本目录
 * @param filePath 文件路径
 * @param outputBase 输出基本文件夹，如果为空默认为输入基本目录加上 suffix
 * @param suffix 输出文件目录的后缀
 * @returns {{output: string, input: string}}
 */
function convertPath(inputBase, filePath, outputBase = '', suffix = 'minify') {
    let input = path.resolve(inputBase, filePath),
        output
    if (outputBase === '') {
        output = path.resolve(path.dirname(inputBase), `${path.basename(inputBase)}_${suffix}`, filePath)
    } else {
        output = path.resolve(__dirname, outputBase, filePath)
    }
    return {input, output}
}

function _skipIfLarge(files, skipIfLarge) {
    if (skipIfLarge) {
        files.forEach(f => {
            const {sourcePath, destinationPath} = f
            if (fs.statSync(sourcePath).size < fs.statSync(destinationPath).size) {
                fs.copyFileSync(sourcePath, destinationPath)
            }
        })
    }
    return files
}

async function readdir(input, regex, minSize, logger = console) {
    return await new Promise(async resolve => {
        if (typeof regex === 'string') {
            regex = new RegExp(regex)
        }
        let fileArr = [],
            fileCount = 0,
            dirCount = 0

        async function dfs(dirPath) {
            let filePath = ''
            for (const i of fs.readdirSync(dirPath)) {
                filePath = dirPath + path.sep + i
                if (i.startsWith('.')) {
                    continue
                }
                if (fs.statSync(filePath).isFile()) {
                    if (filePath.match(regex) !== null) {
                        fileCount++
                        if (fs.statSync(filePath).size > minSize) {
                            fileArr.push(path.relative(input, filePath))
                        } else {
                            logger.warn(`File size is too small, skipped. ${filePath}`)
                        }
                    } else {
                        logger.warn(`Skipped ${filePath}`)
                    }
                } else if (fs.statSync(filePath).isDirectory()) {
                    dirCount++
                    await dfs(filePath)
                } else {
                    logger.error(`What a fuck thing it is: ${filePath}`)
                }
            }
        }

        await dfs(input)
        logger.info(`Readdir finished: total dir: ${dirCount}, total file: ${fileCount}, converting file: ${fileArr.length}`)
        return resolve(fileArr)
    })
}

module.exports = {
    spendTime,
    convert,
}