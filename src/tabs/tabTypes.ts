/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/** @author AI */
/** @examine Cyberexplorer */

// 标签页类型定义与内置页面元数据（纯数据，不依赖 React/UI）。
// 新增内置页面类型时：在这里登记 meta（id + 标题 i18n key），
// 并在 specialTabs.tsx 中注册图标与渲染组件。

/** 内置页面标签类型：welcome（欢迎页）/ create_project（创建项目页） */
export type TSpecialTabType = 'welcome' | 'create_project';

/** 标签页类型：blockly 为工作区目标；其余为内置页面 */
export type TTabType = 'blockly' | TSpecialTabType;

/** 内置页面标签的固定 id（blockly 标签 id 为目标 id，不会与之冲突） */
export const WELCOME_TAB_ID = 'welcome';
export const CREATE_PROJECT_TAB_ID = 'create_project';

export interface ISpecialTabMeta {
    id: string;
    /** 标题 i18n key，渲染时经 t() 解析（避免语言切换后标题过期） */
    titleKey: string;
}

export const SPECIAL_TAB_META: Record<TSpecialTabType, ISpecialTabMeta> = {
    welcome: { id: WELCOME_TAB_ID, titleKey: 'gui:tab.welcome' },
    create_project: { id: CREATE_PROJECT_TAB_ID, titleKey: 'gui:tab.createProject' },
};
