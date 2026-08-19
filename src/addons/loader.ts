/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import type { IAddon, IAddonManifest } from './types';
import { cacheGet, cacheSet } from './cache';
import { registerAddonI18n } from './i18n';

/**
 * 插件仓库：AstratchAddons 的 GitHub 发布地址（raw 形式）。
 * 插件在运行时从这里下载并缓存到 IndexedDB，离线也能用。
 */
const ADDONS_REPO_URL =
    'https://raw.githubusercontent.com/TheAstrasTeam/AstratchAddons/refs/heads/main';

/**
 * 插件文件的远程根目录：GitHub 仓库里的插件都放在 addons/<addon>/ 下
 */
const ADDONS_FILES_URL = `${ADDONS_REPO_URL}/addons`;

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

/** 编译 addon 的 main.js：通过 blob URL 动态 import，得到默认导出（run 函数） */
export const compileAddon = async (code: string): Promise<IAddon['run']> => {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
    try {
        const module = (await import(/* @vite-ignore */ url)) as {
            default?: IAddon['run'];
        };
        const run = module.default;
        if (typeof run !== 'function') {
            throw new Error('main.js must export a function as default export');
        }
        return run;
    } finally {
        URL.revokeObjectURL(url);
    }
};

/**
 * 从 GitHub 加载所有远端插件的“列表”信息（manifest / 图标 / i18n），
 * 不下载插件的 main.js 内容。内容在启用插件时才按需下载（见 downloadAddonContent）。
 */
export async function listRemoteAddons(): Promise<IAddon[]> {
    const listText = await getFile('addons.json', `${ADDONS_REPO_URL}/addons.json`);
    const list = JSON.parse(listText) as unknown;
    if (!Array.isArray(list)) return [];
    const names = list.filter((name): name is string => typeof name === 'string');

    const addons: IAddon[] = [];
    for (const id of names) {
        try {
            const manifestText = await getFile(
                `${id}/manifest.json`,
                `${ADDONS_FILES_URL}/${id}/manifest.json`,
            );
            const manifest = JSON.parse(manifestText) as IAddonManifest;

            let icon = '';
            if (manifest.icon) {
                try {
                    const iconText = await getFile(
                        `${id}/${manifest.icon}`,
                        `${ADDONS_FILES_URL}/${id}/${manifest.icon}`,
                    );
                    icon = svgToDataUrl(iconText);
                } catch {
                    // 没有图标也可以
                }
            }

            const resources: Partial<Record<string, Record<string, string>>> = {};
            for (const language of ['zh-CN', 'en']) {
                try {
                    const resourcesText = await getFile(
                        `${id}/i18n/${language}.json`,
                        `${ADDONS_FILES_URL}/${id}/i18n/${language}.json`,
                    );
                    resources[language] = JSON.parse(resourcesText) as Record<string, string>;
                } catch {
                    // 该语言没有翻译
                }
            }
            registerAddonI18n(id, resources);

            addons.push({
                id,
                name: manifest.name,
                description: manifest.description ?? '',
                icon,
                author: manifest.author ?? '',
                i18nNamespace: `addon_${id}`,
                defaultEnabled: manifest.defaultEnabled ?? false,
                isCustom: false,
                downloaded: false,
            });
        } catch (error) {
            console.error(`Failed to load addon "${id}":`, error);
        }
    }
    return addons;
}

/**
 * 下载并编译单个远端插件的 main.js，返回编译后的 run 函数。
 * 在启用插件（或初始化时恢复已启用插件）时调用。
 */
export async function downloadAddonContent(id: string): Promise<IAddon['run']> {
    const manifestText = await getFile(
        `${id}/manifest.json`,
        `${ADDONS_FILES_URL}/${id}/manifest.json`,
    );
    const manifest = JSON.parse(manifestText) as IAddonManifest;
    const mainPath = manifest.main ?? 'main.js';
    const mainCode = await getFile(`${id}/${mainPath}`, `${ADDONS_FILES_URL}/${id}/${mainPath}`);
    return compileAddon(mainCode);
}
