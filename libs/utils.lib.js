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

module.exports = {
    spendTime,
    time_human,
}
