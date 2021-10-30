/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/10/30
 */
'use strict'
const dir1 = '/tmp'
const dir2 = '/tmp'

const fs = require('fs'),
    path = require('path'),
    logger = require('./libs/logger.lib')

valid(dir1)
valid(dir2)

async function readdir(input) {
    return await new Promise(async resolve => {
        let fileArr = [],
            fileCount = 0,
            dirCount = 0

        async function dfs(dirPath) {
            let filePath = ''
            for (const i of fs.readdirSync(dirPath)) {
                filePath = dirPath + path.sep + i
                if (i.startsWith('.')) {
                    logger.warn(`Skip dot file: ${filePath}`)
                    continue
                }
                if (fs.statSync(filePath).isFile()) {
                    const relativePath = path.relative(input, filePath)
                    fileCount++
                    fileArr.push(relativePath)
                } else if (fs.statSync(filePath).isDirectory()) {
                    dirCount++
                    await dfs(filePath)
                } else {
                    logger.error(`What a fuck thing it is: ${filePath}`)
                }
            }
        }

        await dfs(input)
        logger.info(`Readdir finished: total dir: ${dirCount}, total file: ${fileCount}`)
        return resolve(fileArr)
    })
}

function valid(dir) {
    if (dir === '' || !fs.existsSync(dir) || fs.statSync(dir).isFile()) {
        const msg = `Input must be a dir: ${dir}`
        logger.error(msg)
        process.exit(1)
    }
}

function file(f, dir) {
    const arr = f.split('.')
    arr.pop()
    const k = arr.join('.')
    const v = path.resolve(dir, f)
    return [k, v]
}

(async _ => {
    const file1 = await readdir(dir1)
    const file2 = await readdir(dir2)

    const map = new Map(file1.map(_ => file(_, dir1)))
    file2.forEach(f => {
        const k = file(f, dir2)[0]
        map.delete(k)
    })
    map.forEach((k, v) => {
        logger.info(`Remove ${k} of ${v}`)
        fs.unlinkSync(v)
    })

})()