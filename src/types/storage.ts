/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

export const localStorageIDs = {
    /**
     * 当前使用的界面语言
     */
    Language: 'ash_language',
    /**
     * 当前的设置
     */
    Settings: 'ash_settings',
    /**
     * 快捷键配置
     */
    Shortcuts: 'ash_shortcuts',
    /**
     * 插件（Addon）配置
     */
    Addons: 'ash_addons',
} as const;

export type TLocalStorageIDs = (typeof localStorageIDs)[keyof typeof localStorageIDs];
