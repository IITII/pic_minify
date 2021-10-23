/**
 * @date 2021/10/23
 */
'use strict'
const path = require('path'),
    {spendTime, formattedDir} = require('../index')
const input = path.resolve(__dirname, '../tmp')
formattedDir(input)
spendTime(console, 'Formatted', formattedDir, input)
    .then(f => console.log(`Total formatted files: ${f.flat(Infinity).length}`))
    .catch(e => console.error(e))