# 标签页系统（Tabs）

本目录实现编辑器的多标签页系统。除了每个 Blockly 目标对应一个 `blockly` 标签外，还支持"内置页面"标签（欢迎页、创建项目页等），两者可以共存、统一使用 TabBar 切换、Ctrl+Tab 快速切换（MRU）。

### 核心概念

- `TTabType = 'blockly' | TSpecialTabType`
    - `blockly`：由目标（target）驱动的标签，`id` 为目标 id，`targetId`/`mode` 有意义。
    - 内置页面（`welcome` / `create_project`）：单例标签，`id` 为固定值，标题存 i18n key。
- `useTabsStore`（`src/stores/useTabsStore.ts`）负责标签列表、激活态、MRU、增删改。
  它只依赖 `tabTypes.ts` 的纯数据，不感知 UI。
- 内置页面标签的**标题 / 图标 / 渲染**都通过 `SPECIAL_TAB_META` + `specialTabs.tsx` 注册表
  驱动，因此新增页面类型只需注册，不需要改 store 或 TabBar。

## 新增一种页面标签
<small>以 图像预览 为例。</small>

1. **登记类型与元数据**：在 `tabTypes.ts`
    - 将类型名加入 `TSpecialTabType`（应用系统对 `TTabType` 做了保护，需在类型字面量中手动补充）。
    - 在 `SPECIAL_TAB_META` 中增加一项：`{ id, titleKey }`（`id` 为该标签的单例 id，`titleKey` 为 i18n key）。
    - 如果有多个标签共用一种类型枚举，请按需扩展 `TSpecialTabType`。
2. **注册 UI**：在 `specialTabs.tsx` 的 `specialTabDefinitions` 中增加一项：
    ```ts
    image_preview: {
        type: 'image_preview',
        icon: PreviewIcon,                 // 图标组件（建议直接用软件 logo）
        render: vm => <ImagePreview vm={vm} />,
    },
    ```
    `openSpecialTab('image_preview')` 打开/激活该单例标签。
3. **i18n**：在 `gui:tab.*` 下补充标题文案（en / zh-CN）。
4. 其他功能会在注册之后立即响应。

> 注意：`TTabType` 与 `TSpecialTabType` 是字面量联合类型，新增类型时需同时更新
> `tabTypes.ts` 中的类型与 `SPECIAL_TAB_META` 两处，二者保持一致。