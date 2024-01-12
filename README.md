* Using https://github.com/IITII/caesium-clt for instead

## pic_minify

> [https://github.com/IITII/pic_minify](https://github.com/IITII/pic_minify)  
> https://developers.google.com/speed/webp?hl=zh-cn  

* 基于 cwebp 的本地化图片有损压缩工具
* 支持主流图片格式，PNG, JPEG, TIFF, WebP 和 raw Y'CbCr samples.
* 并发转换，默认使用 cpu 核数 -1 为并发上限，最低为1
* 支持文件夹递归读取和文件类型和大小筛选

> 有损压缩，压缩率更高  
> 暂时不考虑开放 cwebp 的配置，欢迎PR  
> 对于一些特殊文件名，如 ()[]{}, 需要先进行格式化

### Run

* git clone
* npm install
* vim config.js
* npm start
