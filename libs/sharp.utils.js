/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2023/06/20
 */
'use strict'
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const {spendTime, arrLast} = require('./utils.lib.js')
const {copyFileSync, randomFileName} = require('./file_utils.lib.js')

async function readMeta(input) {
  return sharp(input).metadata()
    .then(meta => {
      const inputMeta = {format: meta.format, width: meta.width, height: meta.height, size: meta.size}
      inputMeta.size = inputMeta.size || fs.statSync(input).size
      return inputMeta
    })
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
async function sharpImage(item, shapeOpts) {
  let input, output, img, metadata, resizePx, resizeMode
  if (item.cache.length === 1) {
    if (!fs.existsSync(item.cache[0])) {
      input = item.input
      output = item.cache[0]
    } else {
      input = item.cache[0]
      output = item.output
    }
  }
  input = arrLast(item.cache),
    output = randomFileName(input, cacheDir, 'webp')
  if (item.cache.length === 1 && !fs.existsSync(input)) {
    await spendTime(`Copy ${item.input} to cache ${path.basename(input)}`, copyFileSync, item.input, input)
  }

}

module.exports = {
  readMeta,
  sharpImage,
}
