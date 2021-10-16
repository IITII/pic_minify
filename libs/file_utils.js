'use strict'
const
    fs = require('fs'),
    path = require('path'),
    special = '[,],{,},(,)'.split(',')

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
    fs.renameSync(sourcePath, destinationPath)
    return destinationPath
}

function replaceBeforeCopySync(source, des) {
    des = replaceAll(des)
    return copyFileSync(source, des)
}

module.exports = {
    replaceAll,
    copyFileSync,
    replaceBeforeCopySync,
    replaceBeforeRenameFileSync,
}
