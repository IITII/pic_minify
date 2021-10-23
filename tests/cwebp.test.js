/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/10/23
 */
'use strict'
const path = require('path')
const cwebp = require('../libs/cwebp.lib')
const input = path.resolve(__dirname, '../tmp/68145953_p3.png'),
    output = path.resolve(__dirname, '../tmp/1.webp')
cwebp(path.resolve(__dirname, '../tmp/68145953_p3.png'), '.', undefined)
    .then(re => console.log(re))
    .catch(e => console.log(e))
cwebp(path.resolve(__dirname, '../tmp/68145953_p3.png'), '', undefined)
    .then(re => console.log(re))
    .catch(e => console.log(e))
cwebp(input, output, undefined)
    .then(re => console.log(re))
    .catch(e => console.log(e))
cwebp(input, '/tmp', undefined)
    .then(re => console.log(re))
    .catch(e => console.log(e))
