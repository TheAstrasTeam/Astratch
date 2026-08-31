/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import type { IAddon, IAddonRegistry, IRegistryAddon, IRegistryVersion } from './types';
import {
    cacheGet,
    cacheSet,
    setRegistryHash,
    setFileHash,
} from './cache';
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

/** i18n 缓存 key：i18n:<id>@<version>:<locale> */
const addonI18nCacheKey = (id: string, version: string, locale: string): string =>
    `i18n:${id}@${version}:${locale}`;

/**
 * 根据插件 id 和版本号派生 addon.js 的下载地址。
 * 例：id="example", version="2.0.0" → .../example@v2.0.0/addon.js
 */
export const addonFileUrl = (id: string, version: string): string =>
    `${ADDONS_REPO_URL}/${id}@v${version}/addon.js`;

/** hashes.json 的下载地址 */
const addonHashesUrl = (id: string, version: string): string =>
    `${ADDONS_REPO_URL}/${id}@v${version}/hashes.json`;

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
    // 首次下载后记录哈希，防止 refreshRegistry 误判为变更并删除缓存
    const hash = await computeHash(text);
    await setFileHash(cacheKey, hash);
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
 * 图标和 i18n 路径在 registry 中以相对路径提供，客户端据此构建完整 URL。
 * i18n 资源在后台异步加载并注册。
 */
export const registryAddonToIAddon = (entry: IRegistryAddon): IAddon => {
    const releases: Record<string, IRegistryVersion> = {};
    for (const version of entry.versions) {
        releases[version] = { main: 'addon.js', url: addonFileUrl(entry.id, version) };
    }

    // 图标：将相对路径转为完整 URL
    const icon = entry.icon ? `${ADDONS_REPO_URL}/${entry.id}@v${entry.version}/${entry.icon}` : '';

    // i18n：异步加载并注册
    if (entry.i18n && entry.i18n.length > 0) {
        void loadAddonI18n(entry.id, entry.version, entry.i18n);
    }

    return {
        id: entry.id,
        name: entry.name,
        description: entry.description,
        icon,
        author: entry.author,
        i18nNamespace: `addon_${entry.id}`,
        defaultEnabled: entry.defaultEnabled ?? false,
        settings: entry.settings ?? [],
        astratchVersion: entry.astratch?.version,
        isCustom: false,
        downloaded: false,
        version: entry.version,
        versions: entry.versions,
        readme: entry.readme,
        releases,
    };
};

/**
 * 异步加载插件的 i18n 资源并注册到 i18next。
 * 从版本目录下 i18n/{locale}.json 加载，通过 IndexedDB 缓存。
 */
const loadAddonI18n = async (
    addonId: string,
    version: string,
    locales: string[],
): Promise<void> => {
    const resources: Partial<Record<string, Record<string, string>>> = {};
    await Promise.all(
        locales.map(async locale => {
            try {
                const cacheKey = addonI18nCacheKey(addonId, version, locale);
                const url = `${ADDONS_REPO_URL}/${addonId}@v${version}/i18n/${locale}.json`;
                const text = await getFile(cacheKey, url);
                resources[locale] = JSON.parse(text) as Record<string, string>;
            } catch {
                // 加载失败的 locale 静默跳过，走 fallback
            }
        }),
    );

    registerAddonI18n(addonId, resources);
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
 * 逐文件比对哈希值：只有哈希变更的文件才会重新下载，避免全量清空缓存。
 * 失败时抛出，由调用方决定如何处理。
 */
export async function refreshRegistry(): Promise<IAddonRegistry> {
    const text = await fetchText(REGISTRY_URL);
    const registry = parseRegistry(text);

    // 更新 registry.json 缓存
    const newHash = await computeHash(text);
    await cacheSet(REGISTRY_CACHE_KEY, text);
    await setRegistryHash(newHash);

    // 逐插件拉取 hashes.json，更新本地哈希记录（不删除缓存，避免与本地哈希算法不一致导致误删）
    await Promise.all(
        registry.addons.map(async addon => {
            try {
                const hashesText = await fetchText(addonHashesUrl(addon.id, addon.version));
                const remoteHashes = JSON.parse(hashesText) as Record<string, string>;

                for (const [relPath, remoteHash] of Object.entries(remoteHashes)) {
                    // 根据文件类型构造对应的 cacheKey
                    let cacheKey: string;
                    if (relPath === 'addon.js') {
                        cacheKey = addonContentCacheKey(addon.id, addon.version);
                    } else if (relPath.startsWith('i18n/')) {
                        const locale = relPath.replace(/^i18n\//, '').replace(/\.json$/, '');
                        cacheKey = addonI18nCacheKey(addon.id, addon.version, locale);
                    } else {
                        continue;
                    }

                    await setFileHash(cacheKey, remoteHash);
                }
            } catch {
                // 拉取 hashes.json 失败时静默跳过该插件，不影响其他插件
            }
        }),
    );

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
        addonFileUrl(entry.id, version),
    );
    return compileAddon(mainCode);
}

/** 插件 README 缓存 key：readme:<id>@<version>:<locale> */
const addonReadmeCacheKey = (id: string, version: string, locale: string): string =>
    `readme:${id}@${version}:${locale}`;

/**
 * 获取插件的 README（Markdown 格式），支持多语言。
 * 按 locale 尝试加载 README/{locale}.md，失败时回退到 README/en.md。
 * 插件没有 README 时返回 null。
 */
export async function fetchAddonReadme(
    id: string,
    version: string,
    locale: string,
): Promise<string | null> {
    const tryLocales = locale === 'en' ? ['en'] : [locale, 'en'];
    for (const loc of tryLocales) {
        const url = `${ADDONS_REPO_URL}/${id}@v${version}/README/${loc}.md`;
        try {
            return await getFile(addonReadmeCacheKey(id, version, loc), url);
        } catch {
            // try next locale
        }
    }
    return null;
}
