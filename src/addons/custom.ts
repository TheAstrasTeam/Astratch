/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// 自定义插件：用户上传一个已打包的文件夹（形如 <id>@v<version>/），
// 包含 addon.js / info.json / assets/，直接加载运行。

import type { IAddon, IAddonInfo } from './types';
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

const parseJson = (text: string): unknown => JSON.parse(text);

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

/**
 * 从已打包的文件夹构建一个自定义插件。
 * 文件夹结构：
 *   <id>@v<version>/
 *     addon.js      已编译的插件入口
 *     info.json     插件元信息（info.yaml 的 JSON 形式）
 *     assets/       可选资源
 *     i18n/         可选翻译
 *
 * @param handle 用户选择的文件夹
 * @param id 插件 id
 * @param compile 编译函数，测试时可注入假的实现
 */
export async function buildAddonFromHandle(
    handle: FileSystemDirectoryHandle,
    id: string,
    compile: typeof compileAddon = compileAddon,
): Promise<IAddon | null> {
    // 读取 info.json
    const infoText = await readTextFile(handle, 'info.json');
    if (infoText === null) throw new Error('info.json not found');
    const info = (parseJson(infoText) ?? {}) as IAddonInfo;

    // 读取 addon.js（已编译的入口）
    const mainCode = await readTextFile(handle, 'addon.js');
    if (mainCode === null) throw new Error('addon.js not found');
    const run = await compile(mainCode);

    // 读取图标
    let icon = '';
    const iconPath = info.icon ?? 'assets/icon.svg';
    const iconText = await readTextFile(handle, iconPath);
    if (iconText) icon = svgToDataUrl(iconText);

    // 读取 i18n
    const resources: Partial<Record<string, Record<string, string>>> = {};
    for (const language of ['zh-CN', 'en']) {
        const resourcesText = await readTextFile(handle, `i18n/${language}.json`);
        if (resourcesText) resources[language] = parseJson(resourcesText) as Record<string, string>;
    }
    registerAddonI18n(id, resources);

    const version = info.version ?? '1.0.0';

    return {
        id,
        name: info.name,
        description: info.description ?? '',
        icon,
        author: info.author ?? '',
        i18nNamespace: `addon_${id}`,
        defaultEnabled: info.defaultEnabled ?? false,
        settings: info.astratch?.settings ?? [],
        minVersion: info.astratch?.minVersion,
        isCustom: true,
        downloaded: true,
        run,
        version,
        versions: [version],
        releases: {},
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
