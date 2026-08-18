/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import { create } from 'zustand';
import { localStorageIDs } from '../types/storage';
import { readLocalStorage, setItemToLocalStorage } from '../utils/localstorage';
import { loadAddons, registerAddonI18n } from './loader';
import type { IAddon, IAddonContext, IAddonStorage } from './types';

export interface IAddonStoreState {
    addons: IAddon[];
    enabled: ReadonlySet<string>;
}

/**
 * 插件状态 store：UI 通过订阅它来实时刷新
 */
export const useAddonStore = create<IAddonStoreState>(() => ({
    addons: [],
    enabled: new Set<string>(),
}));

/**
 * 插件管理器
 *
 * 插件全部来自 `src/addons/addons/<addon>/` 目录（manifest.json + main.js + userscripts + i18n），
 * 由构建时的 import.meta.glob 静态收集，不支持外部自定义扩展。
 */
class AddonManager {
    private cleanups = new Map<string, () => void>();
    private ctx: IAddonContext | null = null;

    constructor() {
        const addons = loadAddons();
        const stored = readLocalStorage(localStorageIDs.Addons);
        const enabledIDs = Array.isArray(stored)
            ? stored.filter((id): id is string => typeof id === 'string')
            : [];
        useAddonStore.setState({
            addons,
            enabled: new Set(enabledIDs.filter(id => addons.some(addon => addon.id === id))),
        });
    }

    /**
     * 初始化：注入上下文，注册插件 i18n，并运行所有已启用的插件（只执行一次）
     */
    init(ctx: IAddonContext) {
        if (this.ctx) return;
        this.ctx = ctx;
        registerAddonI18n();
        const { addons, enabled } = useAddonStore.getState();
        for (const addon of addons) {
            if (enabled.has(addon.id)) this.runAddon(addon);
        }
    }

    toggle(id: string) {
        if (useAddonStore.getState().enabled.has(id)) this.disable(id);
        else this.enable(id);
    }

    enable(id: string) {
        if (useAddonStore.getState().enabled.has(id)) return;
        const addon = useAddonStore.getState().addons.find(addon => addon.id === id);
        if (!addon) return;
        useAddonStore.setState({
            enabled: new Set(useAddonStore.getState().enabled).add(id),
        });
        this.persist();
        if (this.ctx) this.runAddon(addon);
    }

    disable(id: string) {
        if (!useAddonStore.getState().enabled.has(id)) return;
        const next = new Set(useAddonStore.getState().enabled);
        next.delete(id);
        useAddonStore.setState({ enabled: next });
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
        setItemToLocalStorage(localStorageIDs.Addons, [...useAddonStore.getState().enabled]);
    }
}

export const addonManager = new AddonManager();
