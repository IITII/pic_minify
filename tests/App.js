/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/09/30
 */
'use strict'
const path = require('path'),
    {convert, spendTime} = require('../index')
const input = path.resolve(__dirname, '../tmp')

spendTime(console, `Convert`, convert, input)
    .then(f => console.log(`Total convert files: ${f.length}`))
    .catch(e => console.error(e))