/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import { create } from 'zustand';
import { localStorageIDs } from '../types/storage';
import { readLocalStorage, setItemToLocalStorage } from '../utils/localstorage';
import { loadAddons } from './loader';
import type { IAddon, IAddonContext, IAddonStorage } from './types';

export type TAddonLoadStatus = 'idle' | 'loading' | 'ready';

export interface IAddonStoreState {
    addons: IAddon[];
    enabled: ReadonlySet<string>;
    status: TAddonLoadStatus;
}

/**
 * 插件状态 store：UI 通过订阅它来实时刷新
 */
export const useAddonStore = create<IAddonStoreState>(() => ({
    addons: [],
    enabled: new Set<string>(),
    status: 'idle',
}));

interface IAddonPersist {
    enabled: string[];
    disabled: string[];
}

const DEFAULT_PERSIST: IAddonPersist = {
    enabled: [],
    disabled: [],
};

/**
 * 插件管理器
 *
 * 插件在运行时从 GitHub 的 AstratchAddons 仓库下载，并缓存到 IndexedDB，
 * 不支持外部自定义扩展。
 */
class AddonManager {
    private cleanups = new Map<string, () => void>();
    private ctx: IAddonContext | null = null;
    private persistData: IAddonPersist = { ...DEFAULT_PERSIST };

    constructor() {
        const stored = readLocalStorage(localStorageIDs.Addons);
        if (Array.isArray(stored)) {
            // 兼容旧格式：只有启用列表
            this.persistData = {
                enabled: stored.filter((id): id is string => typeof id === 'string'),
                disabled: [],
            };
        } else if (stored && typeof stored === 'object') {
            this.persistData = { ...DEFAULT_PERSIST, ...stored };
        }
    }

    /**
     * 初始化：下载/读取插件，注入上下文，并运行所有已启用的插件（只执行一次）
     */
    async init(ctx: IAddonContext) {
        if (this.ctx) return;
        this.ctx = ctx;
        useAddonStore.setState({ status: 'loading' });
        try {
            const addons = await loadAddons();
            const enabled = new Set<string>();
            for (const addon of addons) {
                const userDisabled = this.persistData.disabled.includes(addon.id);
                const userEnabled = this.persistData.enabled.includes(addon.id);
                if (userDisabled ? false : userEnabled || addon.defaultEnabled)
                    enabled.add(addon.id);
            }
            useAddonStore.setState({ addons, enabled, status: 'ready' });
            for (const addon of addons) {
                if (enabled.has(addon.id)) this.runAddon(addon);
            }
        } catch (error) {
            console.error('Failed to load addons:', error);
            useAddonStore.setState({ status: 'ready' });
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
        this.persistData.enabled = [...new Set([...this.persistData.enabled, id])];
        this.persistData.disabled = this.persistData.disabled.filter(item => item !== id);
        this.persist();
        if (this.ctx) this.runAddon(addon);
    }

    disable(id: string) {
        if (!useAddonStore.getState().enabled.has(id)) return;
        const next = new Set(useAddonStore.getState().enabled);
        next.delete(id);
        useAddonStore.setState({ enabled: next });
        this.persistData.disabled = [...new Set([...this.persistData.disabled, id])];
        this.persistData.enabled = this.persistData.enabled.filter(item => item !== id);
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
        setItemToLocalStorage(localStorageIDs.Addons, {
            enabled: [...useAddonStore.getState().enabled],
            disabled: this.persistData.disabled,
        });
    }
}

export const addonManager = new AddonManager();
