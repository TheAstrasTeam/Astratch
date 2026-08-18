/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import i18next from 'i18next';
import type { IAddon, IAddonManifest } from './types';
import { cacheGet, cacheSet } from './cache';

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
const svgToDataUrl = (text: string): string =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;

/** 编译 addon 的 main.js：通过 blob URL 动态 import，得到默认导出（run 函数） */
const compileAddon = async (code: string): Promise<IAddon['run']> => {
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
 * 从 GitHub 加载所有插件（按 addons.json 中的顺序）。
 * 下载并缓存插件文件，编译 main.js，注册 i18n。
 */
export async function loadAddons(): Promise<IAddon[]> {
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
            const mainPath = manifest.main ?? 'main.js';
            const mainCode = await getFile(
                `${id}/${mainPath}`,
                `${ADDONS_FILES_URL}/${id}/${mainPath}`,
            );
            const run = await compileAddon(mainCode);

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

            for (const language of ['zh-CN', 'en']) {
                try {
                    const resourcesText = await getFile(
                        `${id}/i18n/${language}.json`,
                        `${ADDONS_FILES_URL}/${id}/i18n/${language}.json`,
                    );
                    i18next.addResourceBundle(
                        language,
                        `addon_${id}`,
                        JSON.parse(resourcesText) as Record<string, string>,
                        true,
                        true,
                    );
                } catch {
                    // 该语言没有翻译
                }
            }

            addons.push({
                id,
                name: manifest.name,
                description: manifest.description ?? '',
                icon,
                author: manifest.author ?? '',
                i18nNamespace: `addon_${id}`,
                defaultEnabled: manifest.defaultEnabled ?? false,
                run,
            });
        } catch (error) {
            console.error(`Failed to load addon "${id}":`, error);
        }
    }
    return addons;
}
