/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// 自定义插件：用户上传一个文件夹（相当于 AstratchAddons/<name>/ 的目录结构），
// 读取其中的 info.yaml / main.js / i18n / icon，编译并作为“自定义插件”运行。

import { parse as parseYaml } from 'yaml';
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
 * 递归收集目录下的所有 .js 文件，返回相对于 addon 根目录的路径。
 */
const collectJsFiles = async (
    handle: FileSystemDirectoryHandle,
    dir: FileSystemDirectoryHandle,
    prefix: string,
): Promise<string[]> => {
    const results: string[] = [];
    for await (const entry of dir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.js')) {
            results.push(prefix ? `${prefix}/${entry.name}` : entry.name);
        } else if (entry.kind === 'directory') {
            const subPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
            const subFiles = await collectJsFiles(
                handle,
                await dir.getDirectoryHandle(entry.name),
                subPrefix,
            );
            results.push(...subFiles);
        }
    }
    return results;
};

/**
 * 从 info.files 收集要包含的 JS 文件列表。
 * 支持文件路径和目录路径（目录递归收集 .js 文件）。
 * 入口文件始终包含在内。
 */
const collectAddonFiles = async (
    handle: FileSystemDirectoryHandle,
    info: IAddonInfo,
): Promise<string[]> => {
    const entry = info.main;
    const files = new Set([entry]);

    if (Array.isArray(info.files)) {
        for (const pattern of info.files) {
            try {
                // 先尝试作为文件
                await handle.getFileHandle(pattern);
                files.add(pattern);
                continue;
            } catch {
                // 不是文件，尝试作为目录
            }
            try {
                const dirHandle = await handle.getDirectoryHandle(pattern);
                const subFiles = await collectJsFiles(handle, dirHandle, pattern);
                for (const f of subFiles) files.add(f);
            } catch {
                // 既不是文件也不是目录，跳过
            }
        }
    }

    return [...files];
};

/**
 * 简易浏览器端模块打包器。
 * 将多个 ES Module 文件打包为一个立即执行函数，
 * 通过 import/export 重写实现模块间引用。
 *
 * 支持的语法：
 *   - `import { a, b as c } from './path'`
 *   - `import Name from './path'`
 *   - `export default ...`
 *   - `export { a, b as c }`
 *   - `export const/let/var/function/class`
 */
const bundleModules = (files: Map<string, string>, entryPath: string): string => {
    // 拓扑排序：解析依赖顺序
    const resolved: string[] = [];
    const visited = new Set<string>();

    const visit = (file: string) => {
        if (visited.has(file)) return;
        visited.add(file);
        const code = files.get(file) ?? '';
        // 匹配 import ... from '...'
        for (const match of code.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g)) {
            const dep = resolveImportPath(file, match[1]);
            if (files.has(dep)) visit(dep);
        }
        resolved.push(file);
    };
    visit(entryPath);

    // 收集每个模块的命名导出
    const moduleExports = new Map<string, string[]>();
    for (const file of resolved) {
        const code = files.get(file) ?? '';
        const exports: string[] = [];
        // export { a, b as c }
        for (const match of code.matchAll(/export\s*\{([^}]+)\}/g)) {
            for (const spec of match[1].split(',')) {
                const parts = spec.trim().split(/\s+as\s+/);
                exports.push(parts[parts.length - 1].trim());
            }
        }
        // export const/let/var/function/class name
        for (const match of code.matchAll(/export\s+(?:const|let|var|function|class)\s+(\w+)/g)) {
            exports.push(match[1]);
        }
        moduleExports.set(file, exports);
    }

    // 生成打包代码
    const lines: string[] = [];
    lines.push('const __modules = {};');
    lines.push('const __exportMap = {};');
    lines.push('function __imp(path) { return __exportMap[path] || {}; }');
    lines.push('');

    for (const file of resolved) {
        const code = files.get(file) ?? '';

        // 重写 import 语句
        let rewritten = code;
        // import { a, b as c } from './path'  →  const { a, b: c } = __imp(resolvedPath)
        rewritten = rewritten.replace(
            /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?/g,
            (_, imports: string, specifier: string) => {
                const resolved = resolveImportPath(file, specifier);
                const specifiers = imports
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
                    .map(s => {
                        const [local, alias] = s.split(/\s+as\s+/).map(x => x.trim());
                        return alias ? `${local}: ${alias}` : local;
                    });
                return `const { ${specifiers.join(', ')} } = __imp(${JSON.stringify(resolved)});`;
            },
        );
        // import Name from './path'  →  const Name = __imp(resolvedPath).default
        rewritten = rewritten.replace(
            /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g,
            (_, name: string, specifier: string) => {
                const resolved = resolveImportPath(file, specifier);
                return `const ${name} = __imp(${JSON.stringify(resolved)}).default;`;
            },
        );
        // export default expr  →  __mod.exports.default = expr
        rewritten = rewritten.replace(/export\s+default\s+/g, '__mod.exports.default = ');
        // export { a, b as c }  →  __mod.exports.a = a; __mod.exports.c = b;
        rewritten = rewritten.replace(/export\s*\{([^}]+)\}\s*;?/g, (_, items: string) => {
            return items
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
                .map(s => {
                    const [local, alias] = s.split(/\s+as\s+/).map(x => x.trim());
                    const exported = alias || local;
                    return `__mod.exports.${exported} = ${local};`;
                })
                .join('\n');
        });
        // export const/let/var/function/class name  →  const name = ...; __mod.exports.name = name;
        rewritten = rewritten.replace(
            /export\s+(const|let|var|function|class)\s+(\w+)/g,
            (_, keyword: string, name: string) =>
                `${keyword} ${name}; __mod.exports.${name} = ${name}; __mod.exports.${name} = (() => {`,
        );

        lines.push(`__modules[${JSON.stringify(file)}] = function(__mod) {`);
        lines.push(`__mod.exports = {};`);
        lines.push(rewritten);
        lines.push(`__exportMap[${JSON.stringify(file)}] = __mod.exports;`);
        lines.push('};');
        lines.push('');
    }

    lines.push(`__modules[${JSON.stringify(entryPath)}]({});`);
    return lines.join('\n');
};

/** 解析 import 路径为相对于 addon 根目录的绝对路径 */
const resolveImportPath = (from: string, specifier: string): string => {
    if (!specifier.startsWith('.')) return specifier;
    const fromParts = from.split('/');
    fromParts.pop(); // 去掉文件名
    const specParts = specifier.split('/');
    for (const part of specParts) {
        if (part === '..') fromParts.pop();
        else if (part !== '.') fromParts.push(part);
    }
    return fromParts.join('/');
};

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
    const infoText = await readTextFile(handle, 'info.yaml');
    if (infoText === null) throw new Error('info.yaml not found');
    const info = (parseYaml(infoText) ?? {}) as IAddonInfo;

    const mainPath = info.main;

    // 收集所有文件
    const allFiles = await collectAddonFiles(handle, info);

    let run: Awaited<ReturnType<typeof compile>>;
    if (allFiles.length === 1) {
        // 单文件：直接编译
        const mainCode = await readTextFile(handle, mainPath);
        if (mainCode === null) throw new Error(`${mainPath} not found`);
        run = await compile(mainCode);
    } else {
        // 多文件：读取所有文件内容，打包成单个模块
        const fileContents = new Map<string, string>();
        for (const file of allFiles) {
            const content = await readTextFile(handle, file);
            if (content !== null) fileContents.set(file, content);
        }
        const bundled = bundleModules(fileContents, mainPath);
        run = await compile(bundled);
    }

    let icon = '';
    if (info.icon) {
        const iconText = await readTextFile(handle, info.icon);
        if (iconText) icon = svgToDataUrl(iconText);
    }

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
