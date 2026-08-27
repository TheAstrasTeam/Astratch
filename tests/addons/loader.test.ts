// 此文件由AI生成
/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { addonContentCacheKey, registryAddonToIAddon, svgToDataUrl } from '../../src/addons/loader';
import type { IRegistryAddon } from '../../src/addons/types';

describe('addonContentCacheKey', () => {
    it('includes both id and version', () => {
        expect(addonContentCacheKey('example', '1.0.0')).toBe('addon:example@1.0.0');
        expect(addonContentCacheKey('example', '2.1.0')).toBe('addon:example@2.1.0');
    });
});

describe('svgToDataUrl', () => {
    it('encodes svg text into a data url', () => {
        const url = svgToDataUrl('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
        expect(url).toContain('data:image/svg+xml;charset=utf-8,');
        expect(url).toContain('%3Csvg');
    });
});

describe('registryAddonToIAddon', () => {
    const entry: IRegistryAddon = {
        id: 'example',
        name: 'Example Addon',
        description: 'A sample',
        author: 'AstrasTeam',
        license: 'MIT',
        icon: 'assets/icon.svg',
        i18n: ['en', 'zh-CN'],
        defaultEnabled: true,
        settings: [{ name: 'name', id: 'name', type: 'string', default: 'world' }],
        astratch: { version: '>=0.1.0' },
        version: '2.0.0',
        versions: ['1.0.0', '2.0.0'],
    };

    it('maps registry entry to an IAddon', () => {
        const addon = registryAddonToIAddon(entry);
        expect(addon.id).toBe('example');
        expect(addon.name).toBe('Example Addon');
        expect(addon.author).toBe('AstrasTeam');
        expect(addon.isCustom).toBe(false);
        expect(addon.downloaded).toBe(false);
        expect(addon.run).toBeUndefined();
    });

    it('defaults the version to the current version', () => {
        const addon = registryAddonToIAddon(entry);
        expect(addon.version).toBe('2.0.0');
    });

    it('exposes all available versions', () => {
        const addon = registryAddonToIAddon(entry);
        expect(addon.versions).toEqual(['1.0.0', '2.0.0']);
    });

    it('derives per-version download urls from id and version', () => {
        const addon = registryAddonToIAddon(entry);
        expect(addon.releases['1.0.0'].url).toContain('example@v1.0.0/addon.js');
        expect(addon.releases['2.0.0'].url).toContain('example@v2.0.0/addon.js');
    });

    it('copies settings and defaultEnabled', () => {
        const addon = registryAddonToIAddon(entry);
        expect(addon.settings).toEqual([
            { name: 'name', id: 'name', type: 'string', default: 'world' },
        ]);
        expect(addon.defaultEnabled).toBe(true);
    });

    it('uses empty string icon when missing', () => {
        const noIcon = registryAddonToIAddon({ ...entry, icon: undefined });
        expect(noIcon.icon).toBe('');
    });

    it('converts icon path to full URL', () => {
        const addon = registryAddonToIAddon(entry);
        expect(addon.icon).toBe(
            'https://raw.githubusercontent.com/TheAstrasTeam/AstratchAddons/refs/heads/release/example@v2.0.0/assets/icon.svg',
        );
    });
});
