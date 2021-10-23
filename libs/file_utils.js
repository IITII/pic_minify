'use strict'
const
    fs = require('fs'),
    path = require('path'),
    special = '[,],{,},(,)'.split(',')

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

module.exports = {
    readdir,
    replaceAll,
    copyFileSync,
    replaceBeforeCopySync,
    replaceBeforeRenameFileSync,
    formattedDir,
}
