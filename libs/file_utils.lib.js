'use strict'
const
    fs = require('fs'),
    path = require('path'),
    uuid = require('uuid')

const seq = '.'
const special = '[,],{,},(,)'.split(',')
const prefix = 'f_'
const fileNameMap = new Map()

async function readdir(input, regex, minSize, logger = console) {
    return await new Promise(async resolve => {
        if (typeof regex === 'string') {
            regex = new RegExp(regex)
        }
        let fileArr = [],
            skipped = [],
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
                    const relativePath = path.relative(input, filePath)
                    if (filePath.match(regex) !== null) {
                        fileCount++
                        if (fs.statSync(filePath).size > minSize) {
                            fileArr.push(relativePath)
                        } else {
                            logger.warn(`File size is too small, skipped. ${filePath}`)
                            skipped.push(relativePath)
                        }
                    } else {
                        logger.warn(`Skipped ${filePath}`)
                        skipped.push(relativePath)
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
        return resolve({files: fileArr, skip: skipped})
    })
}

function replaceAll(string, replacesArr = special, concat = '_') {
    replacesArr = [].concat(replacesArr)
    replacesArr = [...new Set(replacesArr.flat(Infinity))]
    replacesArr.forEach(r => string = string.split(r).join(concat))
    return string
}

function copyFileSync(sourcePath, destinationPath) {
    if (sourcePath === destinationPath) return destinationPath
    const desDir = path.dirname(destinationPath)
    if (!fs.existsSync(desDir)) {
        fs.mkdirSync(desDir, {recursive: true})
    }
    fs.copyFileSync(sourcePath, destinationPath)
    return destinationPath
}

function replaceBeforeRenameFileSync(sourcePath) {
    let destinationPath = replaceAll(sourcePath)
    if (sourcePath === destinationPath) return destinationPath
    const desDir = path.dirname(destinationPath)
    if (!fs.existsSync(desDir)) {
        fs.mkdirSync(desDir, {recursive: true})
    }
    console.log(`Renaming ${sourcePath} to ${destinationPath}`)
    fs.renameSync(sourcePath, destinationPath)
    return destinationPath
}

function replaceBeforeCopySync(source) {
    const des = replaceAll(source)
    return copyFileSync(source, des)
}

function formattedDir(dir) {
    dir = path.resolve(__dirname, dir)
    if (!fs.statSync(dir).isDirectory()) {
        throw new Error(`Input must be a dir: ${dir}`)
    }
    special.forEach(s => {
        if (dir.includes(s)) {
            throw new Error(`Dont contains char ${s} in output`)
        }
    })
    const fromBase = dir,
        suffix = 'formatted',
        toBase = path.resolve(path.dirname(dir), `${path.basename(dir)}_${suffix}`)

    return internal(dir)

    function internal(filePath) {
        if (fs.statSync(filePath).isDirectory()) {
            return fs
                .readdirSync(filePath)
                .map(f => internal(path.resolve(filePath, f)))
        } else if (fs.statSync(filePath).isFile()) {
            const relative = path.relative(fromBase, filePath)
            const des = replaceAll(path.resolve(toBase, relative))
            return copyFileSync(filePath, des)
        } else {
            new Error(`Un-known file: ${dir}`)
        }
    }
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

function randomFileName(originName, cacheDir, suffix = '') {
    // if (fs.existsSync(cacheDir))
    let basename
    if (suffix === '' && originName.includes('.')) {
        suffix = originName.split(seq).pop()
    }
    const randomUuid = uuid.v4().replace(/-/g, '')
    basename = `${prefix}${randomUuid}${seq}${suffix}`
    if (fileNameMap.has(randomUuid)) {
        return randomFileName(originName, suffix)
    } else {
        const value = path.resolve(cacheDir, basename)
        fileNameMap.set(randomUuid, value)
        return value
    }
}

module.exports = {
    readdir,
    convertPath,
    copyFileSync,
    randomFileName,
}
