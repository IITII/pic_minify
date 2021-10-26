/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/10/24
 */
'use strict'
const fs = require('fs'),
    path = require('path'),
    {mapLimit} = require('async')

const cwebp = require('./libs/cwebp.lib')
const {spendTime} = require('./libs/utils.lib')
const {copyFileSync} = require('./libs/file_utils.lib')
const {readdir, convertPath, randomFileName} = require('./libs/file_utils.lib')

const config = require('./config'),
    logger = require('./libs/logger.lib'),
    cacheDir = path.resolve(__dirname, './pic_minify_cache')

async function main(dir) {
    if (!fs.statSync(dir).isDirectory()) {
        return Promise.reject('Input must a input')
    }
    const output = `${dir}_minify`
    if (fs.existsSync(output) && fs.statSync(output).isFile()) {
        return logger.error(`${output} shouldn't be a file`)
    }
    const files = await spendTime(`Readdir ${dir}`, readdir, dir, config.iRegex, config.minSize, logger)
    // copy other files
    if (config.copyOtherFiles) {
        const allPromise = files.skip
            .filter(_ => {
                if (_.match(config.cleanFileSuffix) !== null) {
                    logger.debug(`Ignore clean file: ${_}`)
                    return false
                } else {
                    return true
                }
            })
            .map(_ => convertPath(dir, _, output, true, false))
            .map(fileObj => {
                const prefix = `Copying Skipped file ${fileObj.input} to ${fileObj.output}`
                return spendTime(prefix, copyFileSync, fileObj.input, fileObj.output)
            })
        await Promise.allSettled(allPromise)
            .then(r => logger.debug(r))
            .catch(e => e)
    }
    const copyFiles = files.files.map(_ => convertPath(dir, _, output, true, true))
    const cacheFiles = copyFiles.map(_ => {
        const {input, output} = _
        return {
            input, output,
            cache: [randomFileName(input, cacheDir)],
        }
    })
    return await convert(cacheFiles)
        .then(res => Promise.allSettled(res.map(r => {
            const from = arrLast(r.cache)
            const to = r.output
            return spendTime(`Copy converted file ${from} to ${to}`, copyFileSync, from, to)
        })))
        .then(r => logger.debug(r))
        .then(_ => logger.info(`Remove cache dir: ${cacheDir}`))
        .then(_ => fs.rmSync(cacheDir, {recursive: true}))
}

async function convert(cacheFiles) {
    if (cacheFiles.length === 0) return
    // copy image files to cache
    await Promise.allSettled(cacheFiles.map(_ => spendTime(`Copy ${_.input} to cache ${arrLast(_.cache)}`, copyFileSync, _.input, arrLast(_.cache))))
        .then(r => logger.debug(r))
        .catch(e => e)
    const res = []
    let items = [].concat(cacheFiles)
    while (items.length !== 0) {
        const more = []
        await mapLimit(items, config.mapLimit, async (item, cb) => {
            const input = arrLast(item.cache),
                output = randomFileName(input, cacheDir, 'webp')
            return await spendTime(`Minify ${input} to ${output}`, cwebp, input, output)
                .then(arr => arr.map(_ => {
                    const inputSize = fs.statSync(_.input).size,
                        outputSize = fs.statSync(_.output).size
                    // 是否大于限制大小
                    if (outputSize > config.minSize) {
                        // 是否大于输入文件
                        if (config.skipIfLarge && outputSize > inputSize) {
                            item.cache.push(input)
                            res.push(item)
                        } else {
                            item.cache.push(output)
                            more.push(item)
                        }
                    } else {
                        item.cache.push(input)
                        res.push(item)
                    }
                }))
                .catch(e => logger.error(e))
                .finally(cb)
        })
            // like this -> [[undefined],[undefined],[undefined]]
            .then(r => logger.debug(r))
            .then(_ => items = more)
            .catch(e => e)
    }
    return res
}

function arrLast(arr) {
    return arr[arr.length - 1]
}

spendTime(`pic_minify`, main, config.input)
    // .then(r => logger.debug(r))
    .catch(e => logger.error(e.stack))