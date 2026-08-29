/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/** @author AI */
/** @examine Cyberexplorer */

// 标签页的通用渲染工具（纯函数，无组件导出）。
// blockly 标签显示目标名；内置页面标签显示注册表（tabTypes）里的 i18n 标题
// （标题存 i18n key，渲染时再解析，避免语言切换后 store 里的标题过期）。

import { t } from 'i18next';
import type { Tab } from '../stores/useTabsStore';
import { SPECIAL_TAB_META } from './tabTypes';

/** 按标签类型返回显示标题 */
export const getTabTitle = (tab: Tab): string => {
    if (tab.type === 'blockly') return tab.title;
    return t(SPECIAL_TAB_META[tab.type].titleKey);
};
