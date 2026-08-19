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

export type TAddonSettingType = 'string' | 'number' | 'boolean';

/**
 * manifest.json 中 settings 数组的单个设置项定义。
 * 设置名称通过插件的 i18n 命名空间 addon_<id>:@settings/<id> 翻译。
 */
export interface IAddonSettingDefinition {
    /** 设置名（用于 Settings 页展示，通过 @settings/<id> 翻译） */
    name: string;
    /** 设置 id，作为插件内读写的 key */
    id: string;
    /** 设置类型 */
    type: TAddonSettingType;
    /** 默认值：string 默认 ''，number 默认 0（受 min/max 约束），boolean 默认 false */
    default?: string | number | boolean;
    /** number 类型的最小值，默认 -Infinity（不限制） */
    min?: number;
    /** number 类型的最大值，默认 Infinity（不限制） */
    max?: number;
    /** string 类型：是否允许多行输入（渲染为 textarea，高度约为单行的两倍），默认 false */
    allowLines?: boolean;
}

/**
 * 提供给插件的设置 API，插件通过它读写自己在 manifest 中声明的设置。
 */
export interface IAddonSettingsApi {
    /** 读取当前设置值 */
    get: (id: string) => unknown;
    /** 设置值（Settings 页 UI 会同步刷新） */
    set: (id: string, value: unknown) => void;
    /** 本插件声明的全部设置定义（来自 manifest） */
    defs: IAddonSettingDefinition[];
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
    /** 该插件在 Settings 页声明的设置 */
    settings: IAddonSettingsApi;
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
    /**
     * 插件声明的设置项（Settings 页按此渲染）
     */
    settings?: IAddonSettingDefinition[];
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
    /** 插件声明的设置项（来自 manifest，Settings 页按此渲染） */
    settings: IAddonSettingDefinition[];
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
