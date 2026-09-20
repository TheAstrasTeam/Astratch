# Astratch Toolbox

Astratch Toolbox 是 Astratch 内部使用的 Blockly 工具箱实现。它基于
[`@blockly/continuous-toolbox`](https://github.com/RaspberryPiFoundation/blockly-samples/tree/master/plugins/continuous-toolbox)
进行扩展，不再只是一个连续滚动工具箱。

目前包含的 Astratch 扩展包括：

- 可折叠的嵌套分类和缩进导引线；
- 分类自动展开、滚动选择同步和工具箱自动跟随；
- 工具箱控制按钮与可配置快捷键；
- 固定在 flyout 顶部的积木搜索；
- 积木回收与连续 flyout 渲染。

## 在 Astratch 中注册

在创建 Blockly 工作区之前注册插件，并传入 Astratch 使用的 i18next 翻译函数：

```ts
import * as AstratchToolbox from '../../../plugins/astratch-toolbox/src';

AstratchToolbox.registerAstratchToolbox(i18next.t);
```

工作区仍使用描述具体实现的 Blockly registry 名称：

```ts
plugins: {
    flyoutsVerticalToolbox: 'ContinuousFlyout',
    metricsManager: 'ContinuousMetrics',
    toolbox: 'ContinuousToolbox',
}
```

`ContinuousFlyout`、`ContinuousMetrics` 和 `ContinuousToolbox` 是内部实现名，
不代表插件仍以 Continuous Toolbox 作为产品名称。

## 上游来源与许可证

本组件基于 Blockly Samples 的 `@blockly/continuous-toolbox` 修改，上游代码采用
Apache License 2.0。Google LLC 的原始版权与 SPDX 声明保留在对应源文件中，
AstrasTeam 的修改说明追加在原声明之后。

完整的上游版本历史保留在 [CHANGELOG.md](./CHANGELOG.md) 的
“Upstream history”部分。
