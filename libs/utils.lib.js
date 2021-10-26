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
            let cost = new Date() - start
            let logInfo = cost > 1000 ? cost / 1000 + 's' : cost + 'ms'
            logger.info(`${prefix} total spent ${logInfo}.`)
        }
    })
}

module.exports = {
    spendTime,
}