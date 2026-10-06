/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * 由 AstrasTeam 修改于 2026/7/3:
 * - 加宽`categoryBubble`的边框宽度
 *
 * 由 AstrasTeam 修改于 2026/7/6:
 * - 减小`blocklyToolboxCategoryLabel`的字体大小
 * - 增加`blocklyToolboxCategory`的宽度设置（60px）
 *
 * 由 AstrasTeam 修改于 2026/7/25:
 * - 修改 CSS
 * - 注册 CollapsibleContinuousCategory
 * - 支持配置 Astratch Toolbox 按钮的翻译函数
 * - 将工具箱快捷键注册移到插件注册阶段，避免重复注册
 * - 将插件入口更名为 Astratch Toolbox
 *
 * 由 AstrasTeam 修改于 2026/8/14:
 * - 增加 .astratchContinuousFlyout 的 hover overflow 规则，悬停时显示完整积木
 * - 设置滚动条粗细为 8px，改为浅灰色、背景透明
 *
 * 由 AstrasTeam 修改于 2026/9/5:
 * - 将分类列表的滚动容器从 .blocklyToolbox 移到根 .blocklyToolboxCategoryGroup，
 *   滚动条归属分类列表本身，顶部操作按钮不再随之滚走
 */

/**
 * @fileoverview Continuous-scroll toolbox and flyout that is always open.
 * Astratch 内部将其扩展并命名为 Astratch Toolbox。
 */

import * as Blockly from 'blockly/core';

import { ContinuousCategory } from './ContinuousCategory';
import { ContinuousFlyout } from './ContinuousFlyout';
import type { LabelFlyoutItem } from './ContinuousFlyout';
import { ContinuousMetrics } from './ContinuousMetrics';
import { ContinuousToolbox } from './ContinuousToolbox';
import { RecyclableBlockFlyoutInflater } from './RecyclableBlockFlyoutInflater';
import { CollapsibleContinuousCategory } from './ContinuousCollapsibleToolboxCategory';

export {
    ContinuousCategory,
    ContinuousFlyout,
    ContinuousMetrics,
    ContinuousToolbox,
    RecyclableBlockFlyoutInflater,
};
export type { LabelFlyoutItem };

export function registerAstratchToolbox(): void {
    // 更细的滚动条（默认约 11px，改为 8px），在 inject 创建滚动条前设置
    Blockly.Scrollbar.scrollbarThickness = 8;

    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.ToolboxCategory.registrationName,
        ContinuousCategory,
        true,
    );

    Blockly.registry.register(
        Blockly.registry.Type.METRICS_MANAGER,
        'ContinuousMetrics',
        ContinuousMetrics,
        true,
    );

    Blockly.registry.register(
        Blockly.registry.Type.FLYOUTS_VERTICAL_TOOLBOX,
        'ContinuousFlyout',
        ContinuousFlyout,
        true,
    );

    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX,
        'ContinuousToolbox',
        ContinuousToolbox,
        true,
    );

    Blockly.registry.register(
        Blockly.registry.Type.FLYOUT_INFLATER,
        'block',
        RecyclableBlockFlyoutInflater,
        true,
    );

    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.CollapsibleToolboxCategory.registrationName,
        CollapsibleContinuousCategory,
        true,
    );

    Blockly.Css.register(`
.blocklyToolbox {
    display: flex !important;
    flex-direction: column;
    overflow-y: visible;
    padding: 0
}
.blocklyToolbox > .blocklyToolboxCategoryGroup {
    flex: 1;
    flex-wrap: nowrap;
    min-height: 0;
    overflow-y: auto;
}
.blocklyToolboxCategory {
    height: initial;
    padding: 3px 0;
}
.blocklyTreeRowContentContainer {
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    width: 100%
}
.blocklyToolboxCategoryLabel {
    font-size: 0.65rem;
}
.blocklyToolboxCategory {
    border-width: 2px !important;
    margin-bottom: 0 !important
}
.continuousToolboxIndentGuide {
    position: relative;
}
.continuousToolboxIndentGuide::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-start: var(--continuous-toolbox-guide-offset);
    border-inline-start: 2px solid var(--ui-quaternary);
    pointer-events: none;
}
.continuousFlyoutSearchContainer {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
}
.continuousFlyoutSearchInput {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    border-radius: 0;
    background-color: var(--ui-tertiary);
    transition: border-radius 0.2s ease
}
.continuousFlyoutSearchInput:focus {
    border-radius: 5px
}
.astratchContinuousFlyout {
    overflow: hidden;
}
.astratchContinuousFlyout:hover {
    overflow: visible;
}
.injectionDiv:has(.blocklyFlyoutScrollbar:hover) .astratchContinuousFlyout {
    overflow: visible;
}
.astratchContinuousFlyout .blocklyScrollbarHandle {
    fill: #bcbcbc;
}
.astratchContinuousFlyout .blocklyScrollbarBackground {
    fill: transparent;
}

.blocklyFlyoutButton {
    display: flex;
    stroke: transparent;
    align-items: center;
    justify-content: center;
}
.blocklyFlyoutButton .blocklyText {
    font:
        normal 13pt 'Segoe UI',
        Tahoma,
        Geneva,
        Verdana,
        sans-serif !important;
}
.blocklyFlyoutButton .blocklyFlyoutButtonBackground {
    display: none;
}
.blocklyFlyoutButton .blocklyFlyoutButtonShadow {
    border: 0;
    background-color: var(--ui-tertiary);
    fill: var(--ui-tertiary);
    color: var(--ui-text);
    border-radius: 5px;
    margin: 5px;

    .blocklyFlyoutButton .blocklyFlyoutButtonShadow:hover {
        filter: brightness(0.5);
    }
}
.blocklyFlyoutButton:hover {
    border: var(--ui-transparent-dark) 1px solid;

    & .blocklyFlyoutButtonShadow {
        stroke: var(--ui-transparent-dark);
        stroke-width: 1px;
    }
}
.blocklyFlyoutButton:active {
    filter: 1.2;
}

.blocklyToolboxCategory {
    display: flex;
    align-items: center;
}

.blocklyToolboxCategory .blocklyTreeRowContentContainer {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
}

.ash-toolbox-tools {
    display: flex;
    margin: 3px 2px
}
.ash-toolbox-tools button {
    padding: 0;
    width: 16px;
    height: 16px;
    background: transparent;
    border: transparent 1px solid;
    border-radius: 5px;
}
.ash-toolbox-tools button:hover {
    border-color: var(--ui-transparent-dark);
}
.ash-toolbox-tools img {
    width: 12px;
    height: 12px;
    filter: var(--ui-svg-filter);
}
.ash-toolbox-tools .ash-toolbox-tools-collapseAll {
    display: flex;
    align-items: center;
    justify-content: center;
}

g.astratchFlyoutGroupLevel0 text {
    font-size: x-large !important;
    font-weight: bold !important;
}
g.astratchFlyoutGroupLevel1 text {
    font-size: larger !important;
}

/*  Blockly 下拉框、提示框、注释框、取色与缩放（HTML 浮层，不属于积木 SVG）  */
.blocklyDropDownDiv {
    background-color: var(--ui-secondary);
    border-color: var(--ui-tertiary);
}
.blocklyDropDownDiv span {
    color: var(--ui-text);
}
.blocklyDropDownDiv hr {
    border-top: 1px solid var(--ui-tertiary);
}

.fieldColourEyedropper {
    color: var(--ui-text);
}

/* Blockly 注释框内的文字颜色（不随主题变化） */
.blocklyComment .blocklyTextarea {
    color: #000 !important;
}

.fieldColourSlider {
    background-color: var(--ui-secondary);
}
.blocklyZoom.blocklyZoomReset {
    transform: translateY(10px);
}
.blocklyToolboxSelected .blocklyToolboxCategoryLabel {
    color: var(--ui-text)
}

.blocklyToolboxCategoryIcon {
    filter: var(--ui-svg-filter) invert(1);
}
  `);
}
