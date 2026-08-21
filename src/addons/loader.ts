/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import type { IAddon, IAddonRegistry, IRegistryAddon, IRegistryVersion } from './types';
import { cacheGet, cacheSet, clearFileCache, getRegistryHash, setRegistryHash } from './cache';
import { registerAddonI18n } from './i18n';

/**
 * 插件仓库：AstratchAddons 的 GitHub 发布地址（raw 形式）。
 * 插件在运行时从这里下载并缓存到 IndexedDB，离线也能用。
 * release 分支只包含编译后的产物（<id>@v<version>/ 目录 + registry.json），
 * 不含源码、脚本或工作流文件。
 */
const ADDONS_REPO_URL =
    'https://raw.githubusercontent.com/TheAstrasTeam/AstratchAddons/refs/heads/release';

/** registry.json —— 统一商店入口，单文件一次请求拿全目录 */
const REGISTRY_CACHE_KEY = 'registry.json';
const REGISTRY_URL = `${ADDONS_REPO_URL}/registry.json`;

/** 插件内容缓存 key：addon:<id>@<version> */
export const addonContentCacheKey = (id: string, version: string): string =>
    `addon:${id}@${version}`;

/**
 * 从 registry 的 download 路径派生某个版本 addon.js 的下载地址。
 * download 形如 example@v1.2.0/，提取 id 后拼接目标版本。
 * 例：download="example@v1.2.0/", version="2.0.0" → .../example@v2.0.0/addon.js
 */
export const addonFileUrl = (download: string, version: string): string => {
    const id = download.replace(/@v[^/]*\/$/, '');
    return `${ADDONS_REPO_URL}/${id}@v${version}/addon.js`;
};

const fetchText = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${String(response.status)} for ${url}`);
    return response.text();
};

/** 先从 IndexedDB 缓存读取，没有再从 GitHub 下载并写入缓存 */
const getFile = async (cacheKey: string, url: string): Promise<string> => {
    const cached = await cacheGet(cacheKey);
    if (cached !== null) return cached;
    const text = await fetchText(url);
    await cacheSet(cacheKey, text);
    return text;
};

/** 把 SVG 文本转成 data URL，供 <img> 使用 */
export const svgToDataUrl = (text: string): string =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;

/** 编译 addon 的 addon.js：通过 blob URL 动态 import，得到默认导出（run 函数） */
export const compileAddon = async (code: string): Promise<IAddon['run']> => {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    try {
        const module = (await import(/* @vite-ignore */ url)) as {
            default?: IAddon['run'];
        };
        const run = module.default;
        if (typeof run !== 'function') {
            throw new Error('addon.js must export a function as default export');
        }
        return run;
    } finally {
        URL.revokeObjectURL(url);
    }
};

const parseRegistry = (text: string): IAddonRegistry => {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid registry');
    const registry = parsed as Partial<IAddonRegistry>;
    if (!Array.isArray(registry.addons)) {
        throw new Error('registry has no addons');
    }
    return registry as IAddonRegistry;
};

/**
 * 计算文本的 SHA-256 哈希值（十六进制字符串）
 */
const computeHash = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * 从 registry 条目构建一个 IAddon（远端插件）。
 * 条目中已内嵌图标（data URL）与 i18n 资源，无需额外请求；
 * 各版本的下载地址由 download 路径派生。
 */
export const registryAddonToIAddon = (entry: IRegistryAddon): IAddon => {
    registerAddonI18n(entry.id, entry.i18n ?? {});
    const releases: Record<string, IRegistryVersion> = {};
    for (const version of entry.versions) {
        releases[version] = { main: 'addon.js', url: addonFileUrl(entry.download, version) };
    }
    return {
        id: entry.id,
        name: entry.name,
        description: entry.description,
        icon: entry.icon ?? '',
        author: entry.author,
        i18nNamespace: `addon_${entry.id}`,
        defaultEnabled: entry.defaultEnabled ?? false,
        settings: entry.settings ?? [],
        minVersion: entry.astratch?.minVersion,
        isCustom: false,
        downloaded: false,
        version: entry.version,
        versions: entry.versions,
        releases,
    };
};

/**
 * 读取 registry.json（统一商店入口）。先从 IndexedDB 缓存读取，
 * 没有缓存时再从 GitHub 下载并写回缓存。
 */
export async function getRegistry(): Promise<IAddonRegistry> {
    const text = await getFile(REGISTRY_CACHE_KEY, REGISTRY_URL);
    return parseRegistry(text);
}

/**
 * 从 GitHub 加载所有远端插件的列表（registry.json），不下载插件的 addon.js 内容。
 * 内容在启用插件时才按需下载（见 downloadAddonContent）。
 */
export async function listRemoteAddons(): Promise<IAddon[]> {
    const registry = await getRegistry();
    return registry.addons.map(entry => registryAddonToIAddon(entry));
}

/**
 * 强制从 GitHub 拉取最新 registry.json 并更新本地缓存（绕过缓存）。
 * 如果 registry.json 内容发生变化（哈希不匹配），会清空所有远端插件文件缓存，
 * 下次加载插件时需要重新下载。失败时抛出，由调用方决定如何处理。
 */
export async function refreshRegistry(): Promise<IAddonRegistry> {
    const text = await fetchText(REGISTRY_URL);
    const registry = parseRegistry(text);

    // 比较哈希，检测 registry.json 是否变化
    const newHash = await computeHash(text);
    const oldHash = await getRegistryHash();

    if (oldHash !== null && oldHash !== newHash) {
        // registry.json 变化，清空所有插件文件缓存
        await clearFileCache();
    }

    await cacheSet(REGISTRY_CACHE_KEY, text);
    await setRegistryHash(newHash);

    return registry;
}

/**
 * 下载并编译单个远端插件指定版本的 addon.js，返回编译后的 run 函数。
 * 在启用插件（或初始化时恢复已启用插件）时调用。
 */
export async function downloadAddonContent(id: string, version: string): Promise<IAddon['run']> {
    const registry = await getRegistry();
    const entry = registry.addons.find(item => item.id === id);
    if (!entry) {
        throw new Error(`Addon "${id}" not found in registry`);
    }
    if (!entry.versions.includes(version)) {
        throw new Error(`Addon "${id}"@${version} not found in registry`);
    }
    const mainCode = await getFile(
        addonContentCacheKey(id, version),
        addonFileUrl(entry.download, version),
    );
    return compileAddon(mainCode);
}
