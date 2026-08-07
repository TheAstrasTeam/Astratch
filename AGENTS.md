# Astratch

> 此文档使用简体中文编写，实际你需要根据使用者（用户）的实际语言回复
> This document is written in Simplified Chinese, and you need to reply according to the actual language of the user

Astratch 是一个基于 TypeScript 6 + React 19 + zustand 技术栈编写的“图形化编辑器”，它类似于Scratch，但更高级（引入了Scratch不具有的特性）。

## CODING

在编写时，需要在您编写的文件头写诸如：
``` ts
// 此文件由AI生成
```
需要在您编写的方法头写诸如：
``` ts
// 此函数/方法/类由AI生成
```
> 其中的具体内容看实际编写的什么，以及使用的语言尽量使用统一的“简体中文”，当然也要看实际开发者使用的语言

需要注意，只有你（AI）编写的才需要加这句话。

---

在编写时需要注意，**VM不该过分知道UI**。

### 一些其它提醒

`src\components` 为可复用组件
`src\gui` 为界面UI，它会使用可复用组件