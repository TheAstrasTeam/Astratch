/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import type { IVM } from '../types/vm';
import type * as Blockly from 'blockly';
import type { TFunction } from 'i18next';
import type { IToastManger } from '../types/lib';

/**
 * 提供给插件的命名空间存储
 * 每个插件拥有独立的前缀，互不干扰
 */
export interface IAddonStorage {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    remove: (key: string) => void;
}

/**
 * 插件运行时可用的上下文（userscript 风格 API）
 */
export interface IAddonContext {
    /** 虚拟机 */
    vm: IVM;
    /** Blockly 本体 */
    blockly: typeof Blockly;
    /** 通知 */
    toast: IToastManger;
    /** i18next 翻译函数 */
    t: TFunction;
    /** 该插件专属的本地存储 */
    storage: IAddonStorage;
}

/**
 * 插件的 manifest.json
 */
export interface IAddonManifest {
    name: string;
    description?: string;
    icon?: string;
    author?: string;
}

/**
 * 插件（Addon）
 */
export interface IAddon {
    /** 插件目录名 / 唯一标识 */
    id: string;
    /** 显示名称 */
    name: string;
    description: string;
    /** 图标 URL */
    icon: string;
    author: string;
    /** i18n 命名空间 addon_<id> */
    i18nNamespace: string;
    /**
     * 启用时运行；若返回一个函数，则将其作为禁用时的清理函数
     */
    run: (ctx: IAddonContext) => (() => void) | undefined;
}
