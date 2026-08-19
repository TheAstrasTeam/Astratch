/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import { create } from 'zustand';
import { t } from 'i18next';
import { localStorageIDs } from '../types/storage';
import { readLocalStorage, setItemToLocalStorage } from '../utils/localstorage';
import { Toast } from '../lib/ToastManager';
import { spawnRandomString } from '../utils/ash-data';
import { listRemoteAddons, downloadAddonContent } from './loader';
import { importCustomAddon, loadCustomAddons, removeCustomAddonHandle } from './custom';
import { clearFileCache } from './cache';
import type { IAddon, IAddonContext, IAddonStorage } from './types';

export type TAddonLoadStatus = 'idle' | 'loading' | 'ready';

export interface IAddonStoreState {
    addons: IAddon[];
    enabled: ReadonlySet<string>;
    status: TAddonLoadStatus;
    /** 正在下载内容（main.js）的插件 id */
    downloading: ReadonlySet<string>;
}

/**
 * 插件状态 store：UI 通过订阅它来实时刷新
 */
export const useAddonStore = create<IAddonStoreState>(() => ({
    addons: [],
    enabled: new Set<string>(),
    status: 'idle',
    downloading: new Set<string>(),
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
 * 插件分为两类：
 * - 官方插件：运行时从 GitHub 的 AstratchAddons 仓库下载，缓存到 IndexedDB；
 * - 自定义插件：用户上传文件夹安装，目录句柄保存在 IndexedDB。
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
     * 初始化：加载官方插件列表 + 自定义插件，注入上下文，
     * 然后下载并运行所有已启用的插件（只执行一次）。
     * 远端插件只拉取列表，内容在启用时才按需下载。
     */
    async init(ctx: IAddonContext) {
        if (this.ctx) return;
        this.ctx = ctx;
        useAddonStore.setState({ status: 'loading' });
        try {
            const [remote, custom] = await Promise.all([listRemoteAddons(), loadCustomAddons()]);
            const addons = [...remote, ...custom];
            const enabled = new Set<string>();
            for (const addon of addons) {
                const userDisabled = this.persistData.disabled.includes(addon.id);
                const userEnabled = this.persistData.enabled.includes(addon.id);
                if (userDisabled ? false : userEnabled || addon.defaultEnabled)
                    enabled.add(addon.id);
            }
            useAddonStore.setState({ addons, enabled, status: 'ready' });
            const pending = addons.filter(addon => enabled.has(addon.id) && !addon.downloaded);
            await Promise.all(pending.map(addon => this.downloadAddon(addon.id)));
            for (const addon of addons) {
                if (!enabled.has(addon.id)) continue;
                const current = useAddonStore.getState().addons.find(item => item.id === addon.id);
                if (current) this.runAddon(current);
            }
        } catch (error) {
            console.error('Failed to load addons:', error);
            useAddonStore.setState({ status: 'ready' });
        }
    }

    /**
     * 弹出文件夹选择框，安装自定义插件。
     * 用户取消时不提示；失败时弹错误通知。
     */
    async installCustomAddon() {
        let addon: IAddon | null;
        try {
            addon = await importCustomAddon();
        } catch (error) {
            console.error('Failed to import custom addon:', error);
            Toast.create({
                type: 'error',
                id: `addon_import_err_${spawnRandomString()}`,
                text: t('gui:addon.err.importFailed', {
                    err: error instanceof Error ? error.message : String(error),
                }),
            });
            return;
        }
        if (!addon) return;
        const nextAddons = [
            ...useAddonStore.getState().addons.filter(item => item.id !== addon.id),
            addon,
        ];
        useAddonStore.setState({ addons: nextAddons });
        Toast.create({
            type: 'info',
            id: `addon_imported_${addon.id}`,
            text: t('gui:addon.imported', {
                name: t(`${addon.i18nNamespace}:@name`, { defaultValue: addon.name }),
            }),
        });
    }

    /**
     * 刷新官方插件列表：先清空远端插件缓存，再只下载插件列表（manifest / 图标 / i18n），
     * 不下载插件内容。内容在用户点击“下载/启用”时按需拉取。
     * 已挂载的自定义插件保持不变。
     * 注意：仅在没有任何插件启用时调用（UI 已限制按钮可用性）。
     */
    async refreshRemoteAddons() {
        const custom = useAddonStore.getState().addons.filter(addon => addon.isCustom);
        try {
            await clearFileCache();
            const remote = await listRemoteAddons();
            useAddonStore.setState({ addons: [...remote, ...custom] });
            Toast.create({
                type: 'info',
                id: 'addon_list_refreshed',
                text: t('gui:addon.remoteRefreshed'),
            });
        } catch (error) {
            console.error('Failed to refresh addons:', error);
            Toast.create({
                type: 'error',
                id: `addon_refresh_err_${spawnRandomString()}`,
                text: t('gui:addon.err.refreshFailed', {
                    err: error instanceof Error ? error.message : String(error),
                }),
            });
        }
    }

    /**
     * 卸载自定义插件：删除目录句柄并从列表中移除
     */
    async uninstallCustomAddon(id: string) {
        await removeCustomAddonHandle(id);
        if (useAddonStore.getState().enabled.has(id)) this.disable(id);
        useAddonStore.setState({
            addons: useAddonStore.getState().addons.filter(item => item.id !== id),
        });
    }

    toggle(id: string) {
        if (useAddonStore.getState().enabled.has(id)) this.disable(id);
        else this.enable(id);
    }

    /**
     * 下载插件内容（main.js）。仅下载，不启用。
     * 下载成功后按钮会变为“启用”，由用户再点击启用。
     */
    async download(id: string) {
        if (useAddonStore.getState().downloading.has(id)) return;
        const addon = useAddonStore.getState().addons.find(item => item.id === id);
        if (!addon || addon.downloaded) return;
        useAddonStore.setState({
            downloading: new Set(useAddonStore.getState().downloading).add(id),
        });
        try {
            await this.downloadAddon(id);
        } finally {
            const next = new Set(useAddonStore.getState().downloading);
            next.delete(id);
            useAddonStore.setState({ downloading: next });
        }
    }

    /**
     * 启用插件。要求内容已下载（未下载时按钮应显示“下载”，不调用本方法）。
     */
    enable(id: string) {
        if (useAddonStore.getState().enabled.has(id)) return;
        const addon = useAddonStore.getState().addons.find(item => item.id === id);
        if (!addon?.downloaded) return;
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
        if (!addon.run) return;
        try {
            const result = addon.run(this.makeContext(addon.id));
            if (typeof result === 'function') this.cleanups.set(addon.id, result);
        } catch (error) {
            console.error(`Addon "${addon.id}" failed to run:`, error);
        }
    }

    /**
     * 下载单个远端插件的 main.js 并编译，成功后更新 store 中的插件（run / downloaded）。
     * 失败时弹错误通知，返回 false。
     */
    private async downloadAddon(id: string): Promise<boolean> {
        try {
            const run = await downloadAddonContent(id);
            useAddonStore.setState({
                addons: useAddonStore
                    .getState()
                    .addons.map(addon =>
                        addon.id === id ? { ...addon, run, downloaded: true } : addon,
                    ),
            });
            return true;
        } catch (error) {
            console.error(`Failed to download addon "${id}":`, error);
            Toast.create({
                type: 'error',
                id: `addon_download_err_${spawnRandomString()}`,
                text: t('gui:addon.err.downloadFailed', {
                    err: error instanceof Error ? error.message : String(error),
                }),
            });
            return false;
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
