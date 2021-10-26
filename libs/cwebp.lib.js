/**
 * @date 2021/10/18
 */
'use strict'
const {spawn} = require('child_process'),
    path = require('path'),
    cwebpBin = require('cwebp-bin'),
    opts = {'shell': true, 'windowsHide': true},
    {minifyOpts} = require('../config')

async function bin(webpArgs, ...addition) {
    return await new Promise((resolve, reject) => {
        let spawnObj = spawn(cwebpBin, webpArgs, opts)
        let buffer = []
        // spawnObj.stdout.on('data', chunk => {
        //     console.log(chunk.toString())
        // })
        spawnObj.stderr.on('data', chunk => {
            buffer = buffer.concat(chunk)
        })
        spawnObj.once('exit', exitCode => {
            // clear object
            spawnObj = undefined
            if (exitCode === 0) {
                return resolve(addition)
            } else {
                const msg = {
                    msg: buffer.toString(),
                    args: JSON.stringify([webpArgs, addition]),
                }
                return reject(msg)
            }
        })
    })
}

async function cwebp(input, output, options = minifyOpts || {}) {
    input = path.resolve(__dirname, input)
    output = path.resolve(__dirname, output)

    const args = [
        // '-quiet',
        '-mt',
    ]

    if (options.preset) {
        args.push('-preset', options.preset)
    }

    if (options.quality) {
        args.push('-q', options.quality)
    }

    if (options.alphaQuality) {
        args.push('-alpha_q', options.alphaQuality)
    }

    if (options.method) {
        args.push('-m', options.method)
    }

    if (options.size) {
        args.push('-size', options.size)
    }

    if (options.sns) {
        args.push('-sns', options.sns)
    }

    if (options.filter) {
        args.push('-f', options.filter)
    }

    if (options.autoFilter) {
        args.push('-af')
    }

    if (options.sharpness) {
        args.push('-sharpness', options.sharpness)
    }

    if (options.lossless) {
        args.push('-lossless')
    }

    if (options.nearLossless) {
        args.push('-near_lossless', options.nearLossless)
    }

    if (options.crop) {
        args.push('-crop', options.crop.x, options.crop.y, options.crop.width, options.crop.height)
    }

    if (options.resize) {
        args.push('-resize', options.resize.width, options.resize.height)
    }

    if (options.metadata) {
        args.push('-metadata', Array.isArray(options.metadata) ? options.metadata.join(',') : options.metadata)
    }

    args.push('-o', output, input)

    return bin(args, {input, output})
}

module.exports = cwebp