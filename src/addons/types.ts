/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import type { IVM } from '../types/vm/vm';
import type * as Blockly from 'blockly';
import type { TFunction } from 'i18next';
import type { IToastManger } from '../types/lib';
import type { IQuickOpenCommand } from '../types/gui';

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
 * info.yaml 中 settings 数组的单个设置项定义。
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
    /** 设置描述（可选，Settings 页渲染为 label 下方的灰色提示文本，通过 @settings/<id>.description 翻译） */
    description?: string;
}

/**
 * 提供给插件的设置 API，插件通过它读写自己在 info.yaml 中声明的设置。
 */
export interface IAddonSettingsApi {
    /** 读取当前设置值 */
    get: (id: string) => unknown;
    /** 设置值（Settings 页 UI 会同步刷新） */
    set: (id: string, value: unknown) => void;
    /** 本插件声明的全部设置定义（来自 info.yaml） */
    defs: IAddonSettingDefinition[];
}

/**
 * 提供给插件的 QuickOpen 命令注册 API。
 * 注册的命令出现在 QuickOpen 命令面板（输入 > 前缀）中，
 * ID 自动加上 `<插件ID>.` 前缀；插件禁用/卸载时自动注销全部命令。
 */
export interface IAddonQuickOpenApi {
    /**
     * 注册一条命令
     * @param command 命令定义，id 只需在插件内唯一（无需带插件前缀）
     * @returns 注销函数
     */
    registerCommand: (command: Omit<IQuickOpenCommand, 'id'> & { id: string }) => () => void;
}

/**
 * 提供给插件的侧边栏标签页注册 API。
 * 注册的标签页出现在编辑器左侧边栏，
 * ID 自动加上 `<插件ID>.` 前缀；插件禁用/卸载时自动注销全部标签页。
 */
export interface IAddonSidebarApi {
    /**
     * 注册一个侧边栏标签页
     * @param tab 标签页定义，id 只需在插件内唯一（无需带插件前缀）
     * @returns 注销函数
     */
    registerTab: (tab: {
        id: string;
        title: string;
        /** 图标：SVG 字符串，会作为 <img> 的 src（data URI） */
        icon: string;
        /** 内容：返回 DOM 元素的函数，每次选中标签页时调用 */
        content: () => HTMLElement;
    }) => () => void;
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
    /** QuickOpen 命令面板的命令注册 */
    quickOpen: IAddonQuickOpenApi;
    /** 侧边栏标签页注册 */
    sidebar: IAddonSidebarApi;
}

/**
 * 插件的 info.yaml（遵循 AstratchAddons 的包格式）
 */
export interface IAddonInfo {
    /** 插件 ID（应与文件夹名一致） */
    id?: string;
    name: string;
    version?: string;
    description?: string;
    author?: string;
    license?: string;
    /** 图标路径（相对插件文件夹） */
    icon?: string;
    /** 入口文件路径（必须声明，TS 插件为 .ts/.tsx，JS 插件为 .js） */
    main: string;
    /** 源文件是否为 TypeScript（需要编译） */
    typescript?: boolean;
    /** 额外的 JS 文件（纯 JS 插件多文件时使用，支持文件路径和目录路径） */
    files?: string[];
    /**
     * 默认是否启用（用户手动开关后以用户选择为准）
     */
    defaultEnabled?: boolean;
    /** Astratch 插件系统配置 */
    astratch?: {
        /** 兼容的 Astratch 版本范围（semver range，如 ">=1.0.0 <2.0.0"） */
        version?: string;
        /** 插件声明的设置项（Settings 页按此渲染） */
        settings?: IAddonSettingDefinition[];
    };
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
    /** 插件声明的设置项（来自 info.yaml，Settings 页按此渲染） */
    settings: IAddonSettingDefinition[];
    /** 兼容的 Astratch 版本范围（semver range） */
    astratchVersion?: string;
    /**
     * 是否为用户上传文件夹安装的自定义插件。
     * 自定义插件在名称后会显示“自定义/Custom”Badge。
     */
    isCustom: boolean;
    /**
     * 插件内容（addon.js）是否已下载。
     * 远端插件按需下载：刷新/初始化时只拉取列表，启用时才下载内容；
     * 自定义插件在导入时即加载，恒为 true。
     */
    downloaded: boolean;
    /**
     * 编译后的插件入口。启用时运行；若返回一个函数，则将其作为禁用时的清理函数。
     * 尚未下载内容的远端插件为 undefined。
     */
    run?: (ctx: IAddonContext) => (() => void) | undefined;
    /** 当前选择的版本（远端插件默认最新版本，自定义插件为 info.version ?? '1.0.0'） */
    version: string;
    /** 全部可用版本（远端插件来自 registry，自定义插件只有当前版本） */
    versions: string[];
    /** 有 README 的语言列表 */
    readme?: string[];
    /** 各版本的下载信息（远端插件由 registry 的 id + version 派生；自定义插件为空对象） */
    releases: Record<string, IRegistryVersion>;
}

/**
 * registry.json 中单个插件版本的信息
 */
export interface IRegistryVersion {
    /** 该版本入口文件名（一般为 addon.js） */
    main?: string;
    /** 该版本 addon.js 的下载地址（GitHub Raw） */
    url: string;
}

/**
 * registry.json 中单个插件的目录条目（统一商店入口）
 */
export interface IRegistryAddon {
    id: string;
    name: string;
    description: string;
    author: string;
    license?: string;
    /** 图标文件路径（相对于版本目录，如 assets/icon.svg） */
    icon?: string;
    defaultEnabled?: boolean;
    settings?: IAddonSettingDefinition[];
    /** 支持的语言列表（如 ["en", "zh-CN"]），客户端据此拼接 i18n/{locale}.json 路径 */
    i18n?: string[];
    /** 有 README 的语言列表（如 ["en", "zh-CN"]），客户端据此拼接 README/{locale}.md 路径 */
    readme?: string[];
    /** 兼容的 Astratch 最低版本 */
    astratch?: { version?: string };
    /** 当前（最新）版本 */
    version: string;
    /** 全部可用版本（旧到新） */
    versions: string[];
}

/**
 * AstratchAddons 仓库根目录的 registry.json（统一商店入口，单文件一次请求拿全目录）
 */
export interface IAddonRegistry {
    schemaVersion: number;
    generatedAt?: string;
    addons: IRegistryAddon[];
}
