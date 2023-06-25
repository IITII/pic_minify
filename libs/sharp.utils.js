/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2023/06/20
 */
'use strict'
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const logger = require('./logger.lib')
const {spendTime, arrLast} = require('./utils.lib.js')
const {copyFileSync, randomFileName} = require('./file_utils.lib.js')

async function readMeta(input) {
  return sharp(input).metadata()
    .then(meta => metaWrapper(input, meta))
}

function metaWrapper(input, meta) {
  const inputMeta = {format: meta.format, width: meta.width, height: meta.height, size: meta.size}
  inputMeta.size = inputMeta.size || fs.statSync(input).size
  return inputMeta
}
/*
export interface MetaData {
    format: string,
    width: number,
    height: number,
    size: number,
}
export interface SharpItem {
    input: string,
    output: string,
    cache: string[],
    timeCost: number[],
    inputMeta: MetaData,
    outputMeta: MetaData,
    compressRate: number,
}
 */
async function sharpImage(item, opts) {
  let input, output, img, metadata, resizePx, resizeMode, sharpOpts = {}, webpOpts = {}, startTime = Date.now()
  if (item.cache.length === 1) {
    if (!fs.existsSync(item.cache[0])) {
      input = item.input
      output = item.cache[0]
    } else {
      input = item.cache[0]
      output = arrLast(item.cache)
    }
  }
  // input = arrLast(item.cache),
  //   output = randomFileName(input, cacheDir, 'webp')
  // item.cache.push(output)
  // if (item.cache.length === 1 && !fs.existsSync(input)) {
  //   await spendTime(`Copy ${item.input} to cache ${path.basename(input)}`, copyFileSync, item.input, input)
  // }
  switch (opts.resizeMode) {
    case "long_long":
      let long, line
      if (item.inputMeta.width > item.inputMeta.height) {
        long = item.inputMeta.width
        line = 'width'
      } else {
        long = item.inputMeta.height
        line = 'height'
      }
      if (long > opts.resizePx) {
        sharpOpts[line] = opts.resizePx
      }
      break
    default:
      logger.error(`un-support resize mode: ${opts.resizeMode}`)
      break
  }
  webpOpts.quality = opts.quality
  return await sharp(input)
    .resize(sharpOpts)
    .webp(webpOpts)
    .toFile(output)
    .then(_ => {
      item.outputMeta = metaWrapper(output, _)
      item.timeCost.push(Date.now() - startTime)
      item.compressRate = parseFloat(((item.inputMeta.size - item.outputMeta.size) / item.inputMeta.size).toFixed(2))
      // item.compressRate = parseFloat((item.outputMeta.size / item.inputMeta.size).toFixed(2))
      return item
    })
    .catch(e => {
      logger.error(`input: ${input}, output: ${output}`, e)
    })
}

// let input = '/Users/iitii/github/pic_online/public/images/img0_2560x1600.jpg'
// let item = {input, timeCost: [], cache: ['/Users/iitii/github/pic_minify/tmp/1.webp'], output: '/Users/iitii/github/pic_minify/tmp/2.webp'}
// readMeta(input).then(m => {
//   item.inputMeta = m
//   return item
// }).then(i => sharpImage(i, {resizePx: 1000, resizeMode: 'long_long', quality: 80}))
//   .then(_ => logger.info(_))
//   .catch(e => logger.error(e))
//
// {
//   input: '/Users/iitii/github/pic_online/public/images/img0_2560x1600.jpg',
//   timeCost: [ 75 ],
//   cache: [ '/Users/iitii/github/pic_minify/tmp/1.webp' ],
//   output: '/Users/iitii/github/pic_minify/tmp/2.webp',
//   inputMeta: { format: 'jpeg', width: 2560, height: 1600, size: 341387 },
//   outputMeta: { format: 'webp', width: 1000, height: 625, size: 5540 },
//   compressRate: 0.98
// }

module.exports = {
  readMeta,
  sharpImage,
}
