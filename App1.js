/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2021/10/24
 */
'use strict'
const fs = require('fs'),
  path = require('path'),
  {mapLimit} = require('async')

const cwebp = require('./libs/cwebp.lib')
const {spendTime, time_human} = require('./libs/utils.lib')
const {copyFileSync, removePre} = require('./libs/file_utils.lib')
const {readdir, convertPath, randomFileName} = require('./libs/file_utils.lib')

const config = require('./config'),
  logger = require('./libs/logger.lib'),
  cacheDir = path.resolve(config.cacheDir, './pic_minify_cache')
const {size_human} = require('./libs/utils.lib.js')
const sharp = require('sharp')

async function replace_local(input, output) {
  if (!fs.statSync(input).isDirectory()) {
    return Promise.reject('Input must a input')
  }
  const files = await spendTime(`Readdir ${input}`, readdir, input, config.iRegex, config.minSize, logger)
  const copyFiles = files.files.map(_ => convertPath(input, _, input, true, true))
  const cacheFiles = copyFiles.map(_ => {
    const {input, output} = _
    return {
      input, output,
      cache: [randomFileName(input, cacheDir)],
    }
  })
  // TODO: refactor
  return await spendTime(`Convert ${cacheFiles.length} files finish`, convertDfs, cacheFiles)
    .then(res => {
      return Promise.allSettled(res.map(r => {
        const {input, output, cache} = r
        const from = arrLast(cache)
        return Promise.resolve()
          .then(_ => spendTime(`Remove input file ${input}`, removePre, input, output))
          .then(_ => spendTime(`Copy converted file ${from} to ${output}`, copyFileSync, from, output))
      }))
    })
    // .then(r => logger.debug(r))
    .then(_ => logger.info(`Remove cache dir: ${cacheDir}`))
    .then(_ => fs.rmSync(cacheDir, {recursive: true}))
}

async function convertDfs(cacheFiles) {
  if (cacheFiles.length === 0) return
  let items = [].concat(cacheFiles), res = []
  let handled = 0, remaining, total = items.length, starts = [Date.now()], oriInSize = 0, outSize = 0

  /**
   * 处理单张图片转换逻辑
   */
  async function dfs(item) {
    if (item.cache.length > 3) {
      logger.info('cache length > 3')
      return Promise.resolve(item)
    }
    const input = arrLast(item.cache),
      output = randomFileName(input, cacheDir, 'webp')
    if (item.cache.length === 1 && !fs.existsSync(input)) {
      await spendTime(`Copy ${item.input} to cache ${path.basename(input)}`, copyFileSync, item.input, input)
    }
    return await spendTime(`Minify ${input} to ${path.basename(output)}`, cwebp, input, output)
      .then(r => {
        handled += 1
        remaining = total - handled
        let totalTime = Date.now() - starts[0]
        let remainingTime = time_human(totalTime / total * remaining)
        logger.info(`Files handled/total: ${handled}/${total}, remaining: ` +
          `${remaining}, total time: ${time_human(totalTime)}, remaining time: ${remainingTime}`)
        return r[0]
      })
      .then(async cwebpRes => {
        const input1 = cwebpRes.input,
          output1 = cwebpRes.output
        const inputSize = fs.statSync(input1).size,
          outputSize = fs.statSync(output1).size
        let target
        // 是否大于限制大小
        if (outputSize > config.minSize) {
          // continue
          const skipLarge = config.skipIfLarge && outputSize > inputSize
          // 每个文件最多处理次数: (0, maxDepth]
          if (item.cache.length >= config.maxDepth) {
            // final end
            // 达到处理限制，按规则选对应的文件
            target = skipLarge ? input1 : output1
          } else if (skipLarge) {
            // process end
            // 处理后文件变大，不继续处理，选处理前文件
            logger.debug(`Skip ${input1} because it's larger than original`)
            target = input1
          } else {
            // continue
            // 处理后文件过大，继续处理
            target = output1
            item.cache.push(target)

            total += 1
            return await dfs(item)
          }
        } else {
          // end
          target = output1
        }
        item.cache.push(target)
        removePreTmpFiles(item.cache, target)
        return Promise.resolve(item)
      })
      .catch(e => {
        logger.info(e.message)
        logger.debug(e)
        // 可能是因为图片分辨率太大导致的, 这种情况下使用原图片即可
        // 存在重复复制的情况
        return Promise.resolve(item)
      })
      .then(item => {
        if (item && typeof item === 'object' && item.output) {
          res.push(item)
        } else {
          logger.warn(`ignore unknown item: ${item}`)
        }
      })
  }

  await mapLimit(items, config.mapLimit, async (item, cb) => {
    return await Promise.resolve(item).then(async _ => {
      const input = _.input
      const meta = await sharp(input).metadata(),
        inputMeta = {format: meta.format, width: meta.width, height: meta.height, size: meta.size}
      inputMeta.size = inputMeta.size || fs.statSync(input).size
      inputMeta.compressRatio = 0
      return {..._, inputMeta}
    }).then(_ => dfs(_)).catch(e => logger.error(e)).finally(cb)
  })
  return res
}

function arrLast(arr) {
  return arr[arr.length - 1]
}

/**
 * 将数组里面 cur 之前的文件删除, 如果不存在 cur 则不删除
 */
function removePreTmpFiles(arr, cur) {
  let idx = arr.indexOf(cur)
  if (idx === -1) return
  arr.slice(0, idx).forEach(_ => {
    if (fs.existsSync(_)) {
      logger.info(`Remove tmp file: ${_}`)
      fs.unlinkSync(_)
    }
  })
}

let func = replace_local
Promise.resolve()
  .then(_ => logger.info(`curr mode is: ${config.mode}`))
  .then(_ => spendTime(`pic_minify`, func, config.input, config.output))
  // .then(r => logger.debug(r))
  .catch(e => logger.error(e.stack))
