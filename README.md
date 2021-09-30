## pic_minify

* 基于 imagemin 的本地化图片有损压缩工具

> 有损压缩，压缩率更高  
> 暂时不考虑开放 imagemin 的配置，欢迎PR

### API

#### `convert`

```
 * 转换目录
 * @param input 输入基本目录
 * @param iRegex 图片正则
 * @param output 输出基本文件夹，如果为空默认为输入基本目录加上 suffix
 * @param limit 转换并发上限
 * @param skipIfLarge 转换后文件如果变大使用源文件
 * @param minSize 最小文件大小，默认 1.5MB
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
    {convert} = require('./libs/minify.lib')
const input = path.resolve(__dirname, './tmp/input'),
    regex = /\S+\.(jpe?g|png|webp|gif|svg)/i,
    output = path.resolve(__dirname, './tmp/output/sub_output')

convert(input, regex, output)
    .then(f => console.log(f))
    .catch(e => console.error(e.message))
```

* 输出耗时信息

```js
'use strict'
const path = require('path'),
    {spendTime, convert} = require('./libs/minify.lib')
const input = path.resolve(__dirname, './tmp/input'),
    regex = /\S+\.(jpe?g|png|webp|gif|svg)/i,
    output = path.resolve(__dirname, './tmp/output/sub_output')

spendTime(console, `Convert`, convert, input, regex, output)
    .then(f => console.log(f))
    .catch(e => console.error(e.message))
```