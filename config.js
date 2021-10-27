/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/10/24
 */
'use strict'
const os = require('os'),
    path = require('path')

let config = {
    // 输入的图片文件夹
    input: process.env.MINI_INPUT || './tmp',
    // 缓存文件夹，会自动创建和删除
    cacheDir: process.env.MINI_CACHE || __dirname,
    // 进行转换的最小文件大小
    minSize: 1024 * 1024,
    // 并发上限
    mapLimit: os.cpus().length - 1,
    // 转换后文件反而变大，则使用之前的文件
    skipIfLarge: true,
    // 每个文件最多处理次数
    maxDepth: process.env.MINI_MAX_DEPTH || 3,
    // 是否拷贝无关文件
    copyOtherFiles: true,
    // 图片正则
    iRegex: /\S+\.(jpe?g|png|webp)/i,
    // 拷贝无关文件时不拷贝的文件后缀名
    cleanFileSuffix: /\.(mp4|mkv|avi)/i,
    // pass to cwebp configure
    minifyOpts: {
        quality: 75,
    },
}

config.input = path.resolve(__dirname, config.input)
config.mapLimit = config.mapLimit > 0 ? config.mapLimit : 1
const maxDepth = parseInt(config.maxDepth)
config.maxDepth = maxDepth || maxDepth > 1 ? maxDepth : 1

module.exports = config
