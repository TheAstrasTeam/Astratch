/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// 自定义插件：用户上传一个文件夹（相当于 AstratchAddons/<name>/ 的目录结构），
// 读取其中的 manifest.json / main.js / i18n / icon，编译并作为“自定义插件”运行。

import type { IAddon, IAddonManifest } from './types';
import { handleDelete, handleGet, handleSet, listHandleIds } from './cache';
import { registerAddonI18n } from './i18n';
import { compileAddon, svgToDataUrl } from './loader';

/**
 * 自定义插件的 id 前缀，避免与 GitHub 官方插件冲突。
 * 不能用 `:` 或 `.`，否则会与 i18next 的 ns 分隔符 / key 分隔符冲突。
 */
const CUSTOM_PREFIX = 'custom-';

/** 把文件夹名转换成稳定的插件 id */
export const slugify = (name: string): string => {
    const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || 'addon';
};

export const isCustomAddonId = (id: string): boolean => id.startsWith(CUSTOM_PREFIX);

/** 读取目录下的一个文本文件，不存在或读取失败时返回 null。支持 a/b.txt 形式的子目录路径 */
const readTextFile = async (
    handle: FileSystemDirectoryHandle,
    path: string,
): Promise<string | null> => {
    try {
        const segments = path.split('/').filter(Boolean);
        let current: FileSystemDirectoryHandle = handle;
        for (let i = 0; i < segments.length - 1; i++) {
            current = await current.getDirectoryHandle(segments[i]);
        }
        const fileName = segments[segments.length - 1];
        const fileHandle = await current.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return await file.text();
    } catch {
        return null;
    }
};

const parseJson = (text: string): unknown => JSON.parse(text);

/**
 * 从上传的文件夹构建一个自定义插件。
 *
 * @param handle 用户选择的插件文件夹
 * @param id 插件 id
 * @param compile 编译 main.js 的函数，测试时可注入假的实现
 */
export async function buildAddonFromHandle(
    handle: FileSystemDirectoryHandle,
    id: string,
    compile: typeof compileAddon = compileAddon,
): Promise<IAddon | null> {
    const manifestText = await readTextFile(handle, 'manifest.json');
    if (manifestText === null) throw new Error('manifest.json not found');
    const manifest = parseJson(manifestText) as IAddonManifest;

    const mainPath = manifest.main ?? 'main.js';
    const mainCode = await readTextFile(handle, mainPath);
    if (mainCode === null) throw new Error(`${mainPath} not found`);
    const run = await compile(mainCode);

    let icon = '';
    if (manifest.icon) {
        const iconText = await readTextFile(handle, manifest.icon);
        if (iconText) icon = svgToDataUrl(iconText);
    }

    const resources: Partial<Record<string, Record<string, string>>> = {};
    for (const language of ['zh-CN', 'en']) {
        const resourcesText = await readTextFile(handle, `i18n/${language}.json`);
        if (resourcesText) resources[language] = parseJson(resourcesText) as Record<string, string>;
    }
    registerAddonI18n(id, resources);

    return {
        id,
        name: manifest.name,
        description: manifest.description ?? '',
        icon,
        author: manifest.author ?? '',
        i18nNamespace: `addon_${id}`,
        defaultEnabled: manifest.defaultEnabled ?? false,
        isCustom: true,
        run,
    };
}

/**
 * 弹出文件夹选择框并安装自定义插件。
 * 用户取消时返回 null。
 */
export async function importCustomAddon(): Promise<IAddon | null> {
    let handle: FileSystemDirectoryHandle;
    try {
        handle = await window.showDirectoryPicker();
    } catch {
        // 用户取消了选择
        return null;
    }
    const id = `${CUSTOM_PREFIX}${slugify(handle.name)}`;
    const addon = await buildAddonFromHandle(handle, id);
    if (!addon) return null;
    await handleSet(id, handle);
    return addon;
}

/**
 * 启动时恢复所有已安装的自定义插件（从 IndexedDB 中保存的目录句柄重新读取）。
 * 若文件夹权限丢失（例如浏览器重启后），该插件会被跳过，需要重新导入。
 */
export async function loadCustomAddons(): Promise<IAddon[]> {
    const ids = await listHandleIds();
    const addons: IAddon[] = [];
    for (const id of ids) {
        if (!isCustomAddonId(id)) continue;
        const handle = await handleGet(id);
        if (!handle) continue;
        try {
            const addon = await buildAddonFromHandle(handle, id);
            if (addon) addons.push(addon);
        } catch (error) {
            console.error(`Failed to load custom addon "${id}":`, error);
        }
    }
    return addons;
}

/** 删除已安装的自定义插件的目录句柄 */
export const removeCustomAddonHandle = async (id: string): Promise<void> => {
    await handleDelete(id);
};
