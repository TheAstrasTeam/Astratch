/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import i18next from 'i18next';
import type { IAddon, IAddonContext, IAddonManifest } from './types';

/**
 * main.js 的默认导出：接收 (ctx)，可返回清理函数
 */
interface IAddonMainModule {
    default?: (ctx: IAddonContext) => (() => void) | undefined;
}

// 构建时静态收集所有插件目录下的文件
const mainModules = import.meta.glob<IAddonMainModule>('./addons/*/main.js', { eager: true });
const manifestModules = import.meta.glob<IAddonManifest>('./addons/*/manifest.json', {
    eager: true,
    import: 'default',
});
const iconModules = import.meta.glob<string>('./addons/*/*.svg', {
    eager: true,
    import: 'default',
});
const i18nModules = import.meta.glob<Record<string, string>>('./addons/*/i18n/*.json', {
    eager: true,
    import: 'default',
});

/** 从 glob 路径中提取插件目录名，如 ./addons/example/manifest.json -> example */
function getAddonName(path: string): string {
    return path.split('/')[2] ?? '';
}

/**
 * 加载所有插件
 */
export function loadAddons(): IAddon[] {
    const addons: IAddon[] = [];
    for (const [path, manifest] of Object.entries(manifestModules)) {
        const id = getAddonName(path);
        if (!id) continue;
        const run = mainModules[`./addons/${id}/main.js`].default;
        if (!run) continue;
        const iconPath = manifest.icon ? `./addons/${id}/${manifest.icon}` : '';
        addons.push({
            id,
            name: manifest.name,
            description: manifest.description ?? '',
            icon: iconModules[iconPath] ?? '',
            author: manifest.author ?? '',
            i18nNamespace: `addon_${id}`,
            run,
        });
    }
    return addons;
}

/**
 * 将各插件的 i18n/*.json 注册到 i18next
 * 需要在 i18next 初始化完成后调用
 */
export function registerAddonI18n() {
    for (const [path, resources] of Object.entries(i18nModules)) {
        const id = getAddonName(path);
        if (!id) continue;
        const language = path.split('/')[4]?.replace(/\.json$/, '') ?? '';
        if (!language) continue;
        i18next.addResourceBundle(language, `addon_${id}`, resources, true, true);
    }
}
