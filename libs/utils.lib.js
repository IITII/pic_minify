/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/10/25
 */
'use strict'
const logger = require('./logger.lib')

/**
 * Calc how much time spent on run function.
 * @param prefix prefix
 * @param func {Function} Run function
 * @param args function's args
 */
async function spendTime(prefix = '', func, ...args) {
    return await new Promise(async (resolve, reject) => {
        let start = new Date()
        try {
            let res = await func.apply(this, args)
            return resolve(res)
        } catch (e) {
            return reject(e)
        } finally {
            logger.info(`${prefix} total spent ${time_human(Date.now() - start)}.`)
        }
    })
}

function time_human(mills, frac = 2) {
    const seconds = 1000
    const units = [
        {unit: 'd', value: 24 * 60 * 60 * seconds},
        {unit: 'h', value: 60 * 60 * seconds},
        {unit: 'm', value: 60 * seconds},
    ]
    let res = ''
    let time = mills
    units.forEach(u => {
        if (time >= u.value) {
            res += `${Math.floor(time / u.value)}${u.unit}`
            time %= u.value
        }
    })
    res += `${(time / seconds).toFixed(frac)}s`
    return res
}

function size_human(bytes, frac = 2) {
    const kb = 1024
    const units = [
        {unit: 'KB', value: kb},
        {unit: 'MB', value: kb * kb},
        {unit: 'GB', value: kb * kb * kb},
        {unit: 'TB', value: kb * kb * kb * kb},
    ]
    let res = '', size = bytes, idx = -1
    idx = units.findIndex(u => u.value > size)
    idx = idx === -1 ? units.length : idx
    idx -= 1
    res = idx === -1 ? `${size}B` : `${(size / units[idx].value).toFixed(frac)}${units[idx].unit}`
    return res
}

console.log(size_human(1024 + 512))

module.exports = {
    spendTime,
    time_human,
    size_human,
}
