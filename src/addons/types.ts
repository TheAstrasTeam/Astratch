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
 * 插件的 manifest.json（遵循 AstratchAddons 的包格式）
 */
export interface IAddonManifest {
    name: string;
    version?: string;
    description?: string;
    author?: string;
    license?: string;
    icon?: string;
    files?: string[];
    main?: string;
    /**
     * 默认是否启用（用户手动开关后以用户选择为准）
     */
    defaultEnabled?: boolean;
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
    /** 默认是否启用 */
    defaultEnabled: boolean;
    /**
     * 是否为用户上传文件夹安装的自定义插件。
     * 自定义插件在名称后会显示“自定义/Custom”Badge。
     */
    isCustom: boolean;
    /**
     * 插件内容（main.js）是否已下载。
     * 远端插件按需下载：刷新/初始化时只拉取列表，启用时才下载内容；
     * 自定义插件在导入时即加载，恒为 true。
     */
    downloaded: boolean;
    /**
     * 编译后的插件入口。启用时运行；若返回一个函数，则将其作为禁用时的清理函数。
     * 尚未下载内容的远端插件为 undefined。
     */
    run?: (ctx: IAddonContext) => (() => void) | undefined;
}
