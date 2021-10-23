/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/09/29
 */
'use strict'
const os = require('os'),
    fs = require('fs'),
    path = require('path'),
    {mapLimit} = require('async'),
    {readdir, copyFileSync, formattedDir} = require('./file_utils'),
    cwebp = require('./cwebp.lib'),
    seq = '.'

/**
 * 使用 imagemin 进行图片压缩
 * @param input
 * @param destination
 * @returns {Promise<*>}
 */
async function minify(input, destination) {
    const opts = {quality: 75}
    return cwebp(input, destination, opts)
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
 * @param minSize 最小文件大小，默认 1MB
 * @param logger 默认console
 * @returns [{data:'',sourcePath:'',destinationPath:''}]
 */
async function convert(input,
                       output = '',
                       iRegex = /\S+\.(jpe?g|png|webp)/i,
                       skipIfLarge = true,
                       minSize = 1024 * 1024,
                       limit = os.cpus().length - 1,
                       logger = console) {
    if (!fs.statSync(input).isDirectory()) {
        return logger.error(`${input} should be a dir`)
    }
    if (output !== '' && fs.statSync(input).isDirectory() && fs.existsSync(output) && fs.statSync(output).isFile()) {
        return logger.error(`${output} shouldn't be a file when ${input} is a dir`)
    }
    // 避免核心数过少的机器并发度为0
    limit = limit < 1 ? 1 : limit
    return spendTime(logger, `Readdir ${input}`, readdir, input, iRegex, minSize, logger)
        .then(res => {
            // copy files
            return spendTime(logger, `Total Skipped files ${res.skip.length}`, _ => {
                res.skip.map(_ => convertPath(input, _, output, true, false))
                    .forEach(sk => {
                        const prefix = `Copying Skipped file ${sk.input} to ${sk.output}`
                        return spendTime(logger, prefix, copyFileSync, sk.input, sk.output)
                    })
            })
                // convert path to abs input and output
                .then(ignore => res.files.map(_ => convertPath(input, _, output, true, true)))
        })
        // https://caolan.github.io/async/v3/docs.html#mapLimit
        .then(async f => await mapLimit(f, limit, async (item, cb) => {
            const {input, output} = item
            return await spendTime(logger, `Minify ${input} to ${output}`, minify, input, output)
                // skip if large
                .then(files => files.map(_ => _skipIfLarge(_, skipIfLarge)))
                .then(files => files.forEach(f => logger.info(`Minified file ${f.input} save to ${f.output}`)))
                .finally(cb)
        }))
        // 展开结果
        .then(_ => _.flat(Infinity))
}

/**
 * 文件路径转换
 * @param inputBase 输入基本目录
 * @param filePath 文件路径
 * @param outputBase 输出基本文件夹，如果为空默认为输入基本目录加上 suffix
 * @param keepFilename 是否保留输出文件路径的文件名
 * @param dir_suffix 输出文件目录的后缀
 * @param file_suffix 输出文件后缀名
 * @param replaceFileSuffix 替换文件名后缀名
 * @returns {{output: string, input: string}}
 */
function convertPath(inputBase, filePath, outputBase = '', keepFilename = true, replaceFileSuffix = false, dir_suffix = 'minify', file_suffix = 'webp') {
    let input = path.resolve(inputBase, filePath),
        output
    if (outputBase === '') {
        output = path.resolve(path.dirname(inputBase), `${path.basename(inputBase)}_${dir_suffix}`, filePath)
    } else {
        output = path.resolve(__dirname, outputBase, filePath)
    }
    if (keepFilename) {
        if (replaceFileSuffix) {
            if (path.basename(output).includes(seq)) {
                const arr = output.split(seq)
                arr.pop()
                arr.push(file_suffix)
                output = arr.join(seq)
            } else {
                output = `${output}.${file_suffix}`
            }
        }
    } else {
        output = path.dirname(output)
    }
    return {input, output}
}

function _skipIfLarge(file, skipIfLarge) {
    if (skipIfLarge) {
        const sourcePath = file.input
        const destinationPath = file.output
        if (fs.statSync(sourcePath).size < fs.statSync(destinationPath).size) {
            copyFileSync(sourcePath, destinationPath)
        }
    }
    return file
}

module.exports = {
    spendTime,
    convert,
    formattedDir,
}
