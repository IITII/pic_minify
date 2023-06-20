/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2023/06/20
 */
'use strict'
const fs = require('fs'),
  path = require('path')
const sharp = require('sharp')
let imgPaths, img
imgPaths = [
  '/Users/iitii/github/pic_online/public/images/img0_2560x1600.jpg',
  // '/Users/iitii/github/pic_online/public/images/img0_2560x1600.jpg1',
  '/Users/iitii/github/pic_online/public/images/1.webp',
]
imgPaths.forEach(async (imgPath) => {
  await sharp(imgPath)
    .metadata()
    .then((metadata) => {
      console.log(metadata)
    })
})
img = sharp(imgPaths[1])

img
  .metadata()
  .then(function(metadata) {
    return img
      .resize(Math.round(metadata.width / 2))
      .webp()
      .toBuffer();
  })
  .then(function(data) {
    sharp(data).metadata().then((metadata) => {
      console.log(metadata)
    })
  });
