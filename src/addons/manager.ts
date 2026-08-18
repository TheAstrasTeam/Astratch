/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import { localStorageIDs } from '../types/storage';
import { readLocalStorage, setItemToLocalStorage } from '../utils/localstorage';
import { loadAddons, registerAddonI18n } from './loader';
import type { IAddon, IAddonContext, IAddonStorage } from './types';

/**
 * 插件管理器
 *
 * 插件全部来自 `src/addons/addons/<addon>/` 目录（manifest.json + main.js + userscripts + i18n），
 * 由构建时的 import.meta.glob 静态收集，不支持外部自定义扩展。
 */
class AddonManager {
    private addons = new Map<string, IAddon>();
    private cleanups = new Map<string, () => void>();
    private enabled = new Set<string>();
    private ctx: IAddonContext | null = null;

    constructor() {
        this.addons = new Map(loadAddons().map(addon => [addon.id, addon]));
        const stored = readLocalStorage(localStorageIDs.Addons);
        if (Array.isArray(stored)) {
            for (const id of stored) {
                if (typeof id === 'string' && this.addons.has(id)) this.enabled.add(id);
            }
        }
    }

    /**
     * 初始化：注入上下文，注册插件 i18n，并运行所有已启用的插件（只执行一次）
     */
    init(ctx: IAddonContext) {
        if (this.ctx) return;
        this.ctx = ctx;
        registerAddonI18n();
        for (const addon of this.addons.values()) {
            if (this.enabled.has(addon.id)) this.runAddon(addon);
        }
    }

    getAddons(): IAddon[] {
        return [...this.addons.values()];
    }

    isEnabled(id: string): boolean {
        return this.enabled.has(id);
    }

    toggle(id: string) {
        if (this.enabled.has(id)) this.disable(id);
        else this.enable(id);
    }

    enable(id: string) {
        if (this.enabled.has(id)) return;
        const addon = this.addons.get(id);
        if (!addon) return;
        this.enabled.add(id);
        this.persist();
        if (this.ctx) this.runAddon(addon);
    }

    disable(id: string) {
        if (!this.enabled.has(id)) return;
        this.enabled.delete(id);
        this.persist();
        this.cleanup(id);
    }

    private runAddon(addon: IAddon) {
        if (!this.ctx) return;
        try {
            const result = addon.run(this.makeContext(addon.id));
            if (typeof result === 'function') this.cleanups.set(addon.id, result);
        } catch (error) {
            console.error(`Addon "${addon.id}" failed to run:`, error);
        }
    }

    private makeContext(addonID: string): IAddonContext {
        const base = this.ctx;
        if (!base) throw new Error('AddonManager is not initialized');
        const storage: IAddonStorage = {
            get: key => {
                try {
                    const raw = localStorage.getItem(`ash_addon:${addonID}:${key}`);
                    return raw ? (JSON.parse(raw) as unknown) : null;
                } catch {
                    return null;
                }
            },
            set: (key, value) => {
                localStorage.setItem(`ash_addon:${addonID}:${key}`, JSON.stringify(value));
            },
            remove: key => {
                localStorage.removeItem(`ash_addon:${addonID}:${key}`);
            },
        };
        return { ...base, storage };
    }

    private cleanup(id: string) {
        const cleanup = this.cleanups.get(id);
        this.cleanups.delete(id);
        try {
            cleanup?.();
        } catch (error) {
            console.error(`Addon "${id}" cleanup failed:`, error);
        }
    }

    private persist() {
        setItemToLocalStorage(localStorageIDs.Addons, [...this.enabled]);
    }
}

export const addonManager = new AddonManager();
