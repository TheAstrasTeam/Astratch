# AstraEditor-Next

> [!WARNING]
> 此项目仍为计划，具体动工时间未定。 

### [AstraEditor](https://github.com/AstraEditor)

## 介绍

`AstraEditor-Next` 是 `AstraEditor` 的 **重制版本**，它不再基于任何 `Scratch` 改版。

值得一提的是，`AstraEditor-Next` 可以兼容 `Scratch 3.0` 项目文件（`.sb3`），这意味着你可以在任何`Scratch`及其修改版平台上**无损运行**。

## 项目架构

`AstraEditor-Next` 基于 `React` + `Vite` 技术栈。

`AstraEditor-Next` 的项目结构如下:

> [!NOTE]
> 未来可能仍会变动。

```mermaid
graph LR
        A[AstraEditor-Next]

        A --> |源码|B[src/]

        B --> |渲染器|C[renderer/]
        B --> |虚拟机|D[vm/]
        B --> |用户界面|E[gui/]
        E --> |主界面|K[main/]
        E --> |编辑器|G[blockly/]
        E --> |画板|H[paint/]
        E --> |音频|I[audio/]
        G --> |组合| K
        H --> |组合| K
        I --> |组合| K
        B --> |公用函数|F[tools/]
        
```