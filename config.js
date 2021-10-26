/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/10/24
 */
'use strict'
const os = require('os'),
    path = require('path')

let config = {
    input: process.env.MINI_INPUT || './tmp',
    minSize: 1024 * 1024,
    mapLimit: os.cpus().length,
    skipIfLarge: true,
    copyOtherFiles: true,
    iRegex: /\S+\.(jpe?g|png|webp)/i,
    cleanFileSuffix: /\.(mp4|mkv|avi)/i,
    // pass to cwebp configure
    minifyOpts: {
        quality: 75,
    },
}

config.input = path.resolve(__dirname, config.input)
config.mapLimit = config.mapLimit > 0 ? config.mapLimit : 1

module.exports = config