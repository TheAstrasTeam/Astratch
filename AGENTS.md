# Astratch

> 此文档使用简体中文编写，实际你需要根据使用者（用户）的实际语言回复
> This document is written in Simplified Chinese, and you need to reply according to the actual language of the user

Astratch 是一个基于 TypeScript 6 + React 19 + zustand 技术栈编写的“图形化编辑器”，它类似于Scratch，但更高级（引入了Scratch不具有的特性）。

## CODING

在编写时，需要在您编写的文件头写诸如：

```ts
多行：
/**
 * ...
 * @author AI
*/
单行：
/** @author AI */
```

需要注意，只有你（AI）编写的才需要加这句话，并且**只有大块且复杂的AI代码才需要标注**。小修补（例如一两行的修改）不需要标注，否则全是噪音，会让真正需要人警惕的代码淹没在标记里。

# Packages

```
packages/ :
    - core # 核心，存储其它库都有可能使用的东西（或许叫utils更好）
    - blockly # 加入ASH自己东西的blockly
    - gui # 它链接了其它库
    - vm # 虚拟机 - i18n #国际化
```
