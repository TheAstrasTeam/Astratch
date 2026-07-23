<p align="center">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./src/assets/lightLogo.svg" alt="Astratch Light Logo">
      <img src="./src/assets/darkLogo.svg" alt="Astratch Dark Logo" width="50%">
    </picture><br />
    <img src="https://img.shields.io/github/stars/TheAstrasTeam/Astratch?style=social" alt="Stars" />
    <img src="https://img.shields.io/github/forks/TheAstrasTeam/Astratch?style=social" alt="Forks" />
    <img src="https://img.shields.io/github/issues/TheAstrasTeam/Astratch?color=0099ff" alt="Issues" />
    <img src="https://img.shields.io/github/actions/workflow/status/TheAstrasTeam/Astratch/ci.yml
    " alt="CI" /><br />
    <a href="./README.md" >English</a>
    <hr />
</p>

> *搭建起玩具和工具的桥梁。*

`Astratch` 是一个图形化IDE（集成开发环境），它希望可以让你以“搭积木”的方式搭出*任何东西*，就像Scratch一样。

# Astratch 做了什么？

简而言之，`Astratch`集百家之长，采用`JIT`（**即时编译**）技术来**编译**您的项目脚本为`JavaScript`并运行，这能让项目的运行速度*快如闪电*。同时，`Astratch`重新设计了**项目模型**，让项目变得更可维护、更为迅速，并增加了更多在**编程语言中常见的特性**。

`Astratch`依然使用与`Scratch`相同的编辑器——`Blockly`，并扩展加入了许多`Scratch`不曾有的功能，这使`Astratch`在`Scratch`的少儿语言和真正的游戏引擎/编程语言等搭建起了**缓冲桥**。

# 感谢

### Blockly

`Astratch` 克隆&修改&使用了 [blockly-examples](https://github.com/RaspberryPiFoundation/blockly-samples) 其中的部分插件：

- [Continuous Toolbox](./plugins/continuous-toolbox/)
- [field-angle](./plugins/field-angle/)
- [field-colour-hsv-sliders](./plugins/field-colour-hsv-sliders/)
- [field-colour](./plugins/field-colour/)
- [field-grid-dropdown](./plugins/field-grid-dropdown/)

我们对其中的插件进行了部分修改使其更加适配 `Astratch` 的*设想*，我们遵守`Apache License v2.0`，在每个更改的文件开头均有标注。

### ICONS

`Astratch` 使用了一下开源仓库的图标：

- [Material Symbols](https://github.com/google/material-design-icons)
- [Typicons](https://github.com/stephenhutchings/typicons.font)

再次表达我们的非常感谢！

# 开发

## 开源
`Astratch` 遵守 `Apache License v2.0`协议，简单来说，你可以**自由**地**使用、修改、复制**和**分发**`Astratch`（包括用于商业目的），但必须保留原始作者的版权声明（[NOTICE](./NOTICE)）和免责声明，并在修改的文件前加上**说明**确认你对此做了修改。

## 贡献

我们非常欢迎社区贡献！无论是**修复 Bug、改进文档、提交新功能**，还是**提出建议**，都可大胆地参与进来，畅所欲言。

如何进行`Pull Request`/`提交 Issue`可以自行搜索！

在您贡献前，请注意：
- 代码风格与项目保持一致；
- 已添加或更新相应的测试用例（若需要）；
- 所有测试通过；
- 提交信息清晰描述变更内容。

并且确保您`fork`的仓库的`CI`可以通过！

## 开发

如果想基于 `Astratch` 开发自己的版本，请确保您的电脑满足以下要求：
- 安装了`node`环境，且版本>=v24.16.0
- 安装了`pnpm`包管理器
- 安装了`git`
- 拥有可以访问`Github`的网络

### 克隆仓库
> 如果您`fork`了自己的仓库，就要`clone`对应的仓库

``` bash
git clone https://github.com/TheAstrasTeam/Astratch.git
```

### 安装依赖

``` bash
cd Astratch
pnpm install
```

### 启动开发服务器

``` bash
pnpm dev # 可运行`pnpm run`查看更多指令
```