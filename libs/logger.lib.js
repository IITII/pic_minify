/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/10/24
 */
'use strict'
const log4js = require('log4js')

// 配置log4.js
log4js.configure({
    appenders: {
        console: {type: 'console'},
    },
    categories: {
        default: {
            appenders: ['console'],
            level: process.env.DEBUG || 'info',
        },
    },
})

module.exports = log4js.getLogger('pic_minify')
