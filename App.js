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

async function main(input, output) {
  if (!fs.statSync(input).isDirectory()) {
    return Promise.reject('Input must a input')
  }
  if (fs.existsSync(output) && fs.statSync(output).isFile()) {
    return logger.error(`${output} shouldn't be a file`)
  }
  const files = await spendTime(`Readdir ${input}`, readdir, input, config.iRegex, config.minSize, logger)
  // copy other files
  if (config.copyOtherFiles) {
    const allPromise = files.skip
      .filter(_ => {
        if (_.match(config.cleanFileSuffix) !== null) {
          logger.debug(`Ignore clean file: ${_}`)
          return false
        } else {
          return true
        }
      })
      .map(_ => convertPath(input, _, output, true, false))
      .map(fileObj => {
        const prefix = `Copying Skipped file ${fileObj.input} to ${fileObj.output}`
        return spendTime(prefix, copyFileSync, fileObj.input, fileObj.output)
      })
    await Promise.allSettled(allPromise)
      .then(r => logger.debug(r))
      .catch(e => e)
  }
  const copyFiles = files.files.map(_ => convertPath(input, _, output, true, true))
  const cacheFiles = copyFiles.map(_ => {
    const {input, output} = _
    return {
      input, output,
      cache: [randomFileName(input, cacheDir)],
    }
  })
  return await spendTime(`Convert ${cacheFiles.length} files finish`, convert, cacheFiles)
    .then(res => Promise.allSettled(res.map(r => {
      const from = arrLast(r.cache)
      const to = r.output
      return spendTime(`Copy converted file ${from} to ${to}`, copyFileSync, from, to)
    })))
    .then(r => logger.debug(r))
    .then(_ => logger.info(`Remove cache dir: ${cacheDir}`))
    .then(_ => fs.rmSync(cacheDir, {recursive: true}))
}

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
  return await spendTime(`Convert ${cacheFiles.length} files finish`, convert, cacheFiles)
    .then(res => Promise.allSettled(res.map(r => {
      const {input, output, cache} = r
      const from = arrLast(cache)
      return Promise.resolve()
        .then(_ => spendTime(`Remove input file ${input}`, removePre, input, output))
        .then(_ => spendTime(`Copy converted file ${from} to ${output}`, copyFileSync, from, output))
    })))
    .then(r => logger.debug(r))
    .then(_ => logger.info(`Remove cache dir: ${cacheDir}`))
    .then(_ => fs.rmSync(cacheDir, {recursive: true}))
}

async function convert(cacheFiles) {
  if (cacheFiles.length === 0) return
  // copy image files to cache
  await Promise.allSettled(cacheFiles.map(_ => spendTime(`Copy ${_.input} to cache ${arrLast(_.cache)}`, copyFileSync, _.input, arrLast(_.cache))))
    .then(r => logger.debug(r))
    .catch(e => e)
  const res = []
  let handled = 1, round = 1, remaining, total = 0, starts = [Date.now()]
  let items = [].concat(cacheFiles)
  while (items.length !== 0) {
    const more = []
    await mapLimit(items, config.mapLimit, async (item, cb) => {
      const input = arrLast(item.cache),
        output = randomFileName(input, cacheDir, 'webp')
      return await spendTime(`Minify ${input} to ${output}`, cwebp, input, output)
        .then(arr => arr.map(_ => {
          const input1 = _.input,
            output1 = _.output
          const inputSize = fs.statSync(input1).size,
            outputSize = fs.statSync(output1).size
          let targetArr, target
          // 是否大于限制大小
          if (outputSize > config.minSize) {
            // continue
            const skipLarge = config.skipIfLarge && outputSize > inputSize
            // 每个文件最多处理次数: (0, maxDepth]
            if (item.cache.length >= config.maxDepth) {
              // final end
              // 达到处理限制，按规则选对应的文件
              target = skipLarge ? input1 : output1
              targetArr = res
            } else if (skipLarge) {
              // process end
              // 处理后文件变大，不继续处理，选处理前文件
              logger.debug(`Skip ${input1} because it's larger than original`)
              target = input1
              targetArr = res
            } else {
              // continue
              // 处理后文件过大，继续处理
              target = output1
              targetArr = more
            }
          } else {
            // end
            target = output1
            targetArr = res
          }
          item.cache.push(target)
          // res 在此处更新, 因为是一个浅拷贝
          targetArr.push(item)
          removePreTmpFiles(item.cache, target)
        }))
        .catch(e => {
          logger.info(e.message)
          logger.debug(e)
          // 可能是因为图片分辨率太大导致的, 这种情况下使用原图片即可
          // 存在重复复制的情况
          res.push(item)
        })
        .then(_ => {
          total += 1
          remaining = items.length + more.length - handled
          let totalTime = Date.now() - starts[0]
          let remainingTime = time_human(totalTime / total * remaining)
          let inSize = fs.statSync(input).size, outSize = fs.statSync(output).size
          logger.debug(`Minify: ${path.basename(input)} -> ${path.basename(output)}: ${inSize} -> ${outSize}, %: ${outSize / inSize * 100}%`)
          logger.info(`Round ${round}: files handled/round: ${handled}/${items.length}, remaining: ${remaining}, total: ${total} , total time: ${time_human(totalTime)}, remaining time: ${remainingTime}`)
          handled += 1
        })
        .catch(e => logger.error(e))
        .finally(cb)
    })
      // like this -> [[undefined],[undefined],[undefined]]
      // .then(r => logger.debug(r))
      .then(() => {
        let logInfo = time_human(Date.now() - arrLast(starts))
        logger.info(`Round ${round}: Minify ${handled} files, round spend ${logInfo}`)
        handled = 1
        round += 1
        starts.push(Date.now())
      })
      .then(_ => items = more)
      .catch(e => e)
  }
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

let func = config.mode === 'copy' ? main : replace_local
Promise.resolve()
  .then(_ => logger.info(`curr mode is: ${config.mode}`))
  .then(_ => spendTime(`pic_minify`, func, config.input, config.output))
  // .then(r => logger.debug(r))
  .catch(e => logger.error(e.stack))
