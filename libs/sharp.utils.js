/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2023/06/20
 */
'use strict'
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

async function readMeta(input) {
  return sharp(input).metadata()
    .then(meta => {
      const inputMeta = {format: meta.format, width: meta.width, height: meta.height, size: meta.size}
      inputMeta.size = inputMeta.size || fs.statSync(input).size
      return inputMeta
    })
}

async function sharpImage(items, shapeOpts) {
  let input, output, img, metadata, resizePx, resizeMode
  input = items.cache.length === 1 && !fs.existsSync(items.cache[0]) ? items.input : items.cache

}

module.exports = {
  readMeta,
  sharpImage,
}
