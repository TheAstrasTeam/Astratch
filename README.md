<!-- Encoding: UTF-8 -->
<div style="display: flex; flex-direction: column; gap: 20px; align-items: center; justify-content: center; width: 100%;">
  <div style="width: 250px; height: auto;">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./src/assets/lightLogo.svg" alt="Astratch Light Logo">
      <img alt="Astratch Dark Logo" src="./src/assets/darkLogo.svg" style="width: 100%; height: auto; display: block;">
    </picture>
  </div>
</div>

> ### 也试试 [AstraEditor](https://github.com/AstraEditor) !

## 介绍

> 此项目的`我们`均指**AstrasTeam**，除非特有声明。

`Astratch` 是一个类似 `Scratch` 的开发平台，但它不基于任何 `Scratch` 改版。

值得一提的是，`Astratch` 可以兼容 `Scratch 3.0` 项目文件（`.sb3`），这意味着你可以在任何`Scratch`及其修改版平台上**无损运行**。

## 感谢

### Blockly

`Astratch` 克隆&修改&使用了 [blockly-example](https://github.com/RaspberryPiFoundation/blockly-samples) 其中的部分插件：

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

## 项目架构

`Astratch` 基于 `React` + `Vite` 技术栈。

`Astratch` 的项目结构如下:

> [!NOTE]
> 未来可能仍会变动。

```mermaid
graph LR
        A[Astratch]

        A --> |源代码| ROOT_SRC[src/]
        A --> |静态资源| ROOT_PUBLIC[public/]
        A --> |第三方插件| ROOT_PLUGINS[plugins/]
        A --> |构建产物| ROOT_DIST[dist/]

        ROOT_SRC --> |资源文件| ASSETS[assets/]
        ROOT_SRC --> |通用组件| COMPONENTS[components/]
        ROOT_SRC --> |图形界面| GUI[gui/]
        ROOT_SRC --> |国际化| I18N[i18n/]
        ROOT_SRC --> |基础库| LIB[lib/]
        ROOT_SRC --> |渲染器| RENDERER[renderer/]
        ROOT_SRC --> |状态管理| STORES[stores/]
        ROOT_SRC --> |类型定义| TYPES[types/]
        ROOT_SRC --> |工具函数| UTILS[utils/]
        ROOT_SRC --> |虚拟机| VM[vm/]

        GUI --> |积木编辑区| GUI_BLOCKS[blocks/]
        GUI --> |错误页| GUI_ERROR[error/]
        GUI --> |主界面| GUI_MAIN[main/]
        GUI --> |启动页| GUI_START[start/]
        GUI --> |全局样式| GUI_STYLES[styles/]

        I18N --> |语言包| LOCALES[locales/]

        LIB --> |主题系统| THEME[Theme/]

        VM --> |积木定义| VM_BLOCKS[blocks/]
        VM --> |项目管理| VM_PROJECT[project/]
        VM --> |运行时| VM_RUNTIME[runtime/]
        VM --> |项目设置| VM_SETTINGS[settings/]


```

### 国际化

`Astratch` 使用 `i18next`，您可以这样使用国际化：

```ts
import { t } from 'i18next';

t('id');
```

之后于`ASH\src\i18n\locales`配置语言

> 未来会支持线上添加新翻译

## 大饼

### Workspace

`Astratch` 暂会用最新的 `Blockly v13.0 `驱动工作区。在**未来**或将**重新**设计一个全新的`WebGPU`驱动的工作区，这个过程将会持续大约：

> # 很久很久

### 编译器

`Astratch` 会将积木编译为`WASM`或`JavaScript`，相比`TurboWarp`会有更加激进的优化和*更低的稳定性*。

### Todo

#### 现在

- [x] 基础项目目录、配置国际化
- [ ] 敲定项目文件格式
- [ ] 制作关于项目的 `API`
- [x] 制作基础积木编辑器
- [ ] 完善 `GUI`
- [ ] 制作 `VM` 、编译器（`ash` -> `JavaScript`/`WASM`）
- [ ] 完善积木编辑器

#### 未来

- [ ] `Electron` 桌面端
- [ ] `Tauri` 手机端+适配
