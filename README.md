## pic_minify

> [https://github.com/IITII/pic_minify](https://github.com/IITII/pic_minify)

* 基于 cwebp 的本地化图片有损压缩工具
* 支持主流图片格式，PNG, JPEG, TIFF, WebP 和 raw Y'CbCr samples.
* 并发转换，默认使用 cpu 核数 -1 为并发上限，最低为1
* 支持文件夹递归读取和文件类型和大小筛选

> 有损压缩，压缩率更高  
> 暂时不考虑开放 cwebp 的配置，欢迎PR  
> 对于一些特殊文件名，如 ()[]{}, 需要先进行格式化

### API

#### `convert`

```
 * 转换目录
 * @param input 输入基本目录
 * @param iRegex 图片正则
 * @param output 输出基本文件夹，如果为空默认为输入基本目录加上 suffix
 * @param limit 转换并发上限
 * @param skipIfLarge 转换后文件如果变大使用源文件
 * @param minSize 最小文件大小，默认 1MB
 * @param logger 默认console
 * @returns [{data:'',sourcePath:'',destinationPath:''}]
```

### `spendTime`

```
 * Calc how much time spent on run function.
 * @param logger logger
 * @param prefix prefix
 * @param func {Function} Run function
 * @param args function's args
```

### 使用

* 简单使用

```js
'use strict'
const path = require('path'),
    {convert} = require('pic_minify')
const input = path.resolve(__dirname, './tmp/input'),
    regex = /\S+\.(jpe?g|png|webp)/i,
    output = path.resolve(__dirname, './tmp/output/sub_output')

convert(input)
    .then(f => console.log(f))
    .catch(e => console.error(e.message))

convert(input, regex, output)
    .then(f => console.log(f))
    .catch(e => console.error(e.message))
```

### 格式化

```js
'use strict'
const path = require('path'),
    {formattedDir} = require('pic_minify')
const input = path.resolve(__dirname, './tmp/input')

formattedDir(input)
```

* 输出耗时信息

```js
'use strict'
const path = require('path'),
    {spendTime, convert} = require('pic_minify')
const input = path.resolve(__dirname, './tmp/input'),
    regex = /\S+\.(jpe?g|png|webp|gif|svg)/i,
    output = path.resolve(__dirname, './tmp/output/sub_output')

spendTime(console, `Convert`, convert, input, regex, output)
    .then(f => console.log(f))
    .catch(e => console.error(e.message))
spendTime(console, `Convert`, convert, input)
    .then(f => console.log(f))
    .catch(e => console.error(e.message))
```
