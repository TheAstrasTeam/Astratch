// 此文件由AI生成
/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import i18next from 'i18next';
import { buildAddonFromHandle, slugify } from '../../src/addons/custom';

/** 嵌套目录树节点：字符串表示文件内容，子目录用接口递归 */
interface ITree {
    [key: string]: string | ITree;
}

/** 模拟一个插件文件夹（还原真实的 FileSystem API 行为：子目录需要 getDirectoryHandle） */
function makeTreeHandle(name: string, tree: ITree): FileSystemDirectoryHandle {
    const getFileHandle = (file: string) => {
        const node = tree[file];
        if (typeof node !== 'string') throw new DOMException('not a file', 'TypeMismatchError');
        return Promise.resolve({
            getFile: () => Promise.resolve({ text: () => Promise.resolve(node) }),
        });
    };
    const getDirectoryHandle = (dir: string) => {
        const node = tree[dir];
        if (typeof node === 'string') throw new DOMException('not found', 'NotFoundError');
        return Promise.resolve(makeTreeHandle(dir, node));
    };
    return { name, getFileHandle, getDirectoryHandle } as unknown as FileSystemDirectoryHandle;
}

describe('slugify', () => {
    it('converts a folder name into a stable id', () => {
        expect(slugify('My Addon')).toBe('my-addon');
        expect(slugify('  Hello--World!  ')).toBe('hello-world');
        expect(slugify('插件')).toBe('addon');
        expect(slugify('   ')).toBe('addon');
    });
});

describe('buildAddonFromHandle', () => {
    it('builds an addon from a valid folder', async () => {
        const run = (): (() => void) | undefined => undefined;
        const handle = makeTreeHandle('my-addon', {
            'manifest.json': JSON.stringify({
                name: 'My Custom Addon',
                description: 'A test addon',
                author: 'Me',
                icon: 'icon.svg',
            }),
            'main.js': 'export default () => {};',
            'icon.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
            i18n: {
                'en.json': JSON.stringify({ '@name': 'EN Name', greet: 'Hi' }),
                'zh-CN.json': JSON.stringify({ '@name': '中文名', greet: '你好' }),
            },
        });

        const addon = await buildAddonFromHandle(handle, 'custom-my-addon', () => run);

        expect(addon).not.toBeNull();
        expect(addon?.id).toBe('custom-my-addon');
        expect(addon?.name).toBe('My Custom Addon');
        expect(addon?.description).toBe('A test addon');
        expect(addon?.author).toBe('Me');
        expect(addon?.isCustom).toBe(true);
        expect(addon?.icon).toContain('data:image/svg+xml');
        expect(addon?.run).toBe(run);
    });

    it('registers i18n resources including @name/@description', async () => {
        const handle = makeTreeHandle('my-addon', {
            'manifest.json': JSON.stringify({ name: 'Raw Name', description: 'Raw desc' }),
            'main.js': 'export default () => {};',
            i18n: {
                'en.json': JSON.stringify({ '@name': 'EN Name', '@description': 'EN desc' }),
                'zh-CN.json': JSON.stringify({
                    '@name': '中文名',
                    '@description': '中文描述',
                }),
            },
        });

        await i18next.init({
            lng: 'zh-CN',
            fallbackLng: 'en',
            resources: { en: { translation: {} }, 'zh-CN': { translation: {} } },
        });

        await buildAddonFromHandle(handle, 'custom-my-addon', () => undefined);

        expect(i18next.t('addon_custom-my-addon:@name', { defaultValue: 'fallback' })).toBe(
            '中文名',
        );
        expect(i18next.t('addon_custom-my-addon:@description', { defaultValue: 'fallback' })).toBe(
            '中文描述',
        );
        expect(i18next.t('addon_custom-my-addon:greet', { defaultValue: 'fallback' })).toBe(
            'fallback',
        );
    });

    it('throws when manifest.json is missing', async () => {
        const handle = makeTreeHandle('addon', { 'main.js': 'export default () => {};' });
        await expect(buildAddonFromHandle(handle, 'custom-addon')).rejects.toThrow(
            'manifest.json not found',
        );
    });

    it('throws when main.js is missing', async () => {
        const handle = makeTreeHandle('addon', {
            'manifest.json': JSON.stringify({ name: 'X' }),
        });
        await expect(buildAddonFromHandle(handle, 'custom-addon')).rejects.toThrow(
            'main.js not found',
        );
    });

    it('uses manifest.main when provided', async () => {
        let compiled: string | null = null;
        const handle = makeTreeHandle('addon', {
            'manifest.json': JSON.stringify({ name: 'X', main: 'src/entry.js' }),
            src: { 'entry.js': 'export default () => {};' },
        });
        const addon = await buildAddonFromHandle(handle, 'custom-addon', code => {
            compiled = code;
            return (): (() => void) | undefined => undefined;
        });
        expect(addon).not.toBeNull();
        expect(compiled).toBe('export default () => {};');
    });

    it('parses manifest settings into the addon', async () => {
        const handle = makeTreeHandle('my-addon', {
            'manifest.json': JSON.stringify({
                name: 'X',
                settings: [
                    { name: 'greeting', id: 'greeting', type: 'string', default: 'Hi' },
                    { name: 'volume', id: 'volume', type: 'number', default: 50, min: 0, max: 100 },
                    { name: 'enabled', id: 'enabled', type: 'boolean', default: true },
                ],
            }),
            'main.js': 'export default () => {};',
        });
        const addon = await buildAddonFromHandle(handle, 'custom-my-addon', () => undefined);
        expect(addon?.settings).toEqual([
            { name: 'greeting', id: 'greeting', type: 'string', default: 'Hi' },
            { name: 'volume', id: 'volume', type: 'number', default: 50, min: 0, max: 100 },
            { name: 'enabled', id: 'enabled', type: 'boolean', default: true },
        ]);
    });

    it('defaults settings to an empty array when manifest has none', async () => {
        const handle = makeTreeHandle('my-addon', {
            'manifest.json': JSON.stringify({ name: 'X' }),
            'main.js': 'export default () => {};',
        });
        const addon = await buildAddonFromHandle(handle, 'custom-my-addon', () => undefined);
        expect(addon?.settings).toEqual([]);
    });
});
