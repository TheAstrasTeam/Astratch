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
import { Settings, type TSettingType } from '../settings/SettingsRegistry';
import {
    listRemoteAddons,
    downloadAddonContent,
    refreshRegistry,
    registryAddonToIAddon,
    addonContentCacheKey,
    compileAddon,
} from './loader';
import { cacheGet } from './cache';
import { importCustomAddon, loadCustomAddons, removeCustomAddonHandle } from './custom';
import type {
    IAddon,
    IAddonContext,
    IAddonSettingDefinition,
    IAddonSettingsApi,
    IAddonStorage,
    TAddonSettingType,
} from './types';
import type { IQuickOpenCommand } from '../types/gui';
import { useQuickOpenCommandsStore } from '../stores/useQuickOpenCommandsStore';

/** 插件设置项在 Settings 里的 key 前缀（`addon.<addonId>.<settingId>`） */
const ADDON_SETTINGS_CATEGORY = 'addons';

const addonSettingsKey = (addonID: string, settingId: string): string =>
    `addon.${addonID}.${settingId}`;

/** 插件设置类型 → Settings 注册表的设置类型 */
const ADDON_SETTING_TYPE_MAP: Record<TAddonSettingType, TSettingType> = {
    string: 'text',
    number: 'number',
    boolean: 'boolean',
};

/** 把 manifest 里的设置默认值归一化：string→''，number→0（受 min/max 约束），boolean→false */
const normalizeSettingDefault = (setting: IAddonSettingDefinition): unknown => {
    switch (setting.type) {
        case 'number': {
            const value = typeof setting.default === 'number' ? setting.default : 0;
            const min = setting.min ?? -Infinity;
            const max = setting.max ?? Infinity;
            return Math.min(Math.max(value, min), max);
        }
        case 'boolean':
            return setting.default === true;
        case 'string':
        default:
            return typeof setting.default === 'string' ? setting.default : '';
    }
};

export type TAddonLoadStatus = 'idle' | 'loading' | 'ready';

export interface IAddonStoreState {
    addons: IAddon[];
    enabled: ReadonlySet<string>;
    status: TAddonLoadStatus;
    /** 正在下载内容（main.js）的插件 id */
    downloading: ReadonlySet<string>;
    /** 后台刷新进行中（逐文件哈希比对 + 按需重下载） */
    refreshing: boolean;
}

/**
 * 插件状态 store：UI 通过订阅它来实时刷新
 */
export const useAddonStore = create<IAddonStoreState>(() => ({
    addons: [],
    enabled: new Set<string>(),
    status: 'idle',
    downloading: new Set<string>(),
    refreshing: false,
}));

interface IAddonPersist {
    enabled: string[];
    disabled: string[];
    /** 每个已启用插件选择的版本：addonId -> version（项目保存时记录具体依赖版本） */
    versions: Record<string, string>;
}

const DEFAULT_PERSIST: IAddonPersist = {
    enabled: [],
    disabled: [],
    versions: {},
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
                versions: {},
            };
        } else if (stored && typeof stored === 'object') {
            this.persistData = { ...DEFAULT_PERSIST, ...stored };
        }
    }

    /**
     * 初始化：加载官方插件列表（registry）+ 自定义插件，注入上下文，
     * 然后下载并运行所有已启用的插件（只执行一次）。
     * 远端插件只拉取列表，内容在启用时才按需下载。
     * 随后在后台静默刷新 registry，更新商店列表。
     */
    async init(ctx: IAddonContext) {
        if (this.ctx) return;
        this.ctx = ctx;
        useAddonStore.setState({ status: 'loading' });
        try {
            const [remote, custom] = await Promise.all([listRemoteAddons(), loadCustomAddons()]);
            const addons = [...remote, ...custom].map(addon => {
                // 恢复该插件之前选择的版本
                const persistedVersion = this.persistData.versions[addon.id];
                if (persistedVersion && addon.versions.includes(persistedVersion)) {
                    return { ...addon, version: persistedVersion };
                }
                return addon;
            });
            const enabled = new Set<string>();
            for (const addon of addons) {
                const userDisabled = this.persistData.disabled.includes(addon.id);
                const userEnabled = this.persistData.enabled.includes(addon.id);
                if (userDisabled ? false : userEnabled || addon.defaultEnabled)
                    enabled.add(addon.id);
            }
            useAddonStore.setState({ addons, enabled, status: 'ready' });
            this.syncAddonSettings();
            const pending = addons.filter(addon => enabled.has(addon.id) && !addon.downloaded);
            await Promise.all(pending.map(addon => this.downloadAddon(addon.id, addon.version)));
            for (const addon of addons) {
                if (!enabled.has(addon.id)) continue;
                const current = useAddonStore.getState().addons.find(item => item.id === addon.id);
                if (current) this.runAddon(current);
            }
            void this.backgroundRefresh();
        } catch (error) {
            console.error('Failed to load addons:', error);
            useAddonStore.setState({ status: 'ready' });
        }
    }

    /**
     * 后台静默刷新 registry：更新本地缓存并合并商店列表。
     * 刷新期间设置 refreshing 状态，UI 可据此显示加载提示。
     * 失败的静默忽略（商店继续用旧缓存展示），不影响主流程。
     */
    private async backgroundRefresh() {
        useAddonStore.setState({ refreshing: true });
        try {
            const registry = await refreshRegistry();
            const freshRemote = registry.addons.map(entry => registryAddonToIAddon(entry));
            const current = useAddonStore.getState();
            const custom = current.addons.filter(addon => addon.isCustom);
            const merged = freshRemote.map(fresh => {
                const existing = current.addons.find(item => item.id === fresh.id);
                if (!existing) return fresh;
                // 保留用户已选择的版本、下载状态与已编译内容
                const version =
                    existing.version && fresh.versions.includes(existing.version)
                        ? existing.version
                        : fresh.version;
                return {
                    ...fresh,
                    version,
                    downloaded: existing.downloaded && version === existing.version,
                    run:
                        existing.downloaded && version === existing.version
                            ? existing.run
                            : undefined,
                };
            });
            useAddonStore.setState({ addons: [...merged, ...custom] });
            this.syncAddonSettings();
        } catch {
            // 后台刷新失败不影响已展示的列表
        } finally {
            useAddonStore.setState({ refreshing: false });
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
        this.syncAddonSettings();
        Toast.create({
            type: 'info',
            id: `addon_imported_${addon.id}`,
            text: t('gui:addon.imported', {
                name: t(`${addon.i18nNamespace}:@name`, { defaultValue: addon.name }),
            }),
        });
    }

    /**
     * 刷新官方插件列表：强制重新拉取 registry.json（统一商店入口）并更新本地缓存，
     * 展示最新可用插件与版本。逐文件哈希比对，仅重下载变更文件。
     * 已挂载的自定义插件保持不变。
     */
    async refreshRemoteAddons() {
        const current = useAddonStore.getState();
        const custom = current.addons.filter(addon => addon.isCustom);
        useAddonStore.setState({ refreshing: true });
        try {
            const registry = await refreshRegistry();
            const freshRemote = registry.addons.map(entry => registryAddonToIAddon(entry));
            const merged = freshRemote.map(fresh => {
                const existing = current.addons.find(item => item.id === fresh.id);
                if (!existing) return fresh;
                const version =
                    existing.version && fresh.versions.includes(existing.version)
                        ? existing.version
                        : fresh.version;
                return {
                    ...fresh,
                    version,
                    downloaded: existing.downloaded && version === existing.version,
                    run:
                        existing.downloaded && version === existing.version
                            ? existing.run
                            : undefined,
                };
            });
            useAddonStore.setState({ addons: [...merged, ...custom] });
            this.syncAddonSettings();
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
        } finally {
            useAddonStore.setState({ refreshing: false });
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
        this.syncAddonSettings();
    }

    toggle(id: string) {
        if (useAddonStore.getState().enabled.has(id)) this.disable(id);
        else this.enable(id);
    }

    /**
     * 返回当前远端插件的启用/禁用状态及版本（不含自定义插件）。
     * 供项目保存时记录，以便下次打开项目时恢复一致的插件环境。
     */
    getProjectAddonState(): {
        enabled: string[];
        disabled: string[];
        versions: Record<string, string>;
    } {
        const { addons, enabled } = useAddonStore.getState();
        const enabledList: string[] = [];
        const disabledList: string[] = [];
        const versions: Record<string, string> = {};
        for (const addon of addons) {
            if (addon.isCustom) continue;
            if (enabled.has(addon.id)) enabledList.push(addon.id);
            else disabledList.push(addon.id);
            versions[addon.id] = addon.version;
        }
        return { enabled: enabledList, disabled: disabledList, versions };
    }

    /**
     * 恢复项目保存的远端插件启用/禁用状态及版本。
     * 自定义插件不受影响；不在列表中的插件保持默认状态。
     * 若记录的版本在可用版本列表中，则选择该版本；否则保留当前版本。
     * 版本切换完成后，再按项目记录的启用/禁用状态恢复。
     */
    async loadProjectAddonState(state: {
        enabled: string[];
        disabled: string[];
        versions?: Record<string, string>;
    }) {
        const { addons } = useAddonStore.getState();
        const remoteIds = new Set(addons.filter(a => !a.isCustom).map(a => a.id));
        const projectEnabled = new Set(state.enabled.filter(id => remoteIds.has(id)));
        const projectDisabled = new Set(state.disabled.filter(id => remoteIds.has(id)));
        const versions = state.versions ?? {};

        // 先选择项目记录的版本并下载，等待所有版本切换完成
        await Promise.all(
            addons
                .filter(addon => {
                    if (addon.isCustom) return false;
                    const recordedVersion = versions[addon.id];
                    return (
                        recordedVersion &&
                        addon.versions.includes(recordedVersion) &&
                        addon.version !== recordedVersion
                    );
                })
                .map(addon => {
                    const recordedVersion = versions[addon.id];
                    return this.selectVersion(addon.id, recordedVersion);
                }),
        );

        // 禁用所有当前启用的远端插件（除了项目中需要启用的）
        for (const addon of addons) {
            if (addon.isCustom) continue;
            if (projectEnabled.has(addon.id)) continue;
            if (useAddonStore.getState().enabled.has(addon.id)) {
                this.disable(addon.id);
            }
        }

        // 启用项目中启用的远端插件（需要先下载编译）
        for (const addon of addons) {
            if (addon.isCustom) continue;
            if (!projectEnabled.has(addon.id)) continue;
            if (!useAddonStore.getState().enabled.has(addon.id)) {
                if (!useAddonStore.getState().addons.find(a => a.id === addon.id)?.downloaded) {
                    await this.download(addon.id);
                }
                this.enable(addon.id);
            }
        }

        // 更新全局持久化（让 localStorage 也反映项目状态）
        this.persistData.enabled = [...projectEnabled];
        this.persistData.disabled = [...projectDisabled];
        this.persist();
    }

    /**
     * 选择插件的某个版本。
     * - 已启用：先停用，切换版本并下载编译，再重新启用。
     * - 已禁用：仅切换版本。若该版本已缓存则标记为已下载可直接启用。
     */
    async selectVersion(id: string, version: string) {
        const addon = useAddonStore.getState().addons.find(item => item.id === id);
        if (!addon || !addon.versions.includes(version) || addon.version === version) return;
        const wasEnabled = useAddonStore.getState().enabled.has(id);
        if (wasEnabled) this.disable(id);
        let downloaded = false;
        let run: IAddon['run'] | undefined;
        const cached = await cacheGet(addonContentCacheKey(id, version));
        if (cached) {
            try {
                run = await compileAddon(cached);
                downloaded = true;
            } catch {
                // 缓存内容无法编译，标记为未下载
            }
        }
        useAddonStore.setState({
            addons: useAddonStore
                .getState()
                .addons.map(item =>
                    item.id === id ? { ...item, version, downloaded, run } : item,
                ),
        });
        this.persistData.versions[id] = version;
        this.persist();
        if (wasEnabled) {
            await this.download(id);
            this.enable(id);
        }
    }

    /**
     * 下载插件内容（addon.js）。仅下载，不启用。
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
            await this.downloadAddon(id, addon.version);
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
        this.persistData.versions[id] = addon.version;
        this.persist();
        this.syncAddonSettings();
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
        this.syncAddonSettings();
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
    private async downloadAddon(id: string, version: string): Promise<boolean> {
        try {
            const run = await downloadAddonContent(id, version);
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
        const addon = useAddonStore.getState().addons.find(item => item.id === addonID);
        const settings: IAddonSettingsApi = {
            get: id => Settings.get(addonSettingsKey(addonID, id)),
            set: (id, value) => {
                Settings.set(addonSettingsKey(addonID, id), value);
            },
            defs: addon?.settings ?? [],
        };
        // 命令 ID 自动加插件前缀，保证跨插件不冲突
        const quickOpen = {
            registerCommand: (command: Omit<IQuickOpenCommand, 'id'> & { id: string }) =>
                useQuickOpenCommandsStore.getState().registerCommand(addonID, {
                    ...command,
                    id: `${addonID}.${command.id}`,
                }),
        };
        return { ...base, storage, settings, quickOpen };
    }

    /**
     * 把当前所有已启用插件的 manifest 设置项同步到 Settings 注册表。
     * 先清空旧的插件设置，再按当前启用的插件重新注册，保证禁用/卸载后不会残留。
     */
    private syncAddonSettings() {
        Settings.unregisterByCategory(ADDON_SETTINGS_CATEGORY);
        const { addons, enabled } = useAddonStore.getState();
        for (const addon of addons) {
            if (!enabled.has(addon.id)) continue;
            for (const setting of addon.settings) {
                Settings.register({
                    key: addonSettingsKey(addon.id, setting.id),
                    defaultValue: normalizeSettingDefault(setting),
                    category: ADDON_SETTINGS_CATEGORY,
                    label: `${addon.i18nNamespace}:@settings/${setting.id}`,
                    description: setting.description
                        ? `${addon.i18nNamespace}:@settings/${setting.id}.description`
                        : undefined,
                    type: ADDON_SETTING_TYPE_MAP[setting.type],
                    min: setting.min,
                    max: setting.max,
                    allowLines: setting.allowLines,
                    group: `${addon.i18nNamespace}:@name`,
                });
            }
        }
    }

    private cleanup(id: string) {
        // 先注销插件注册的 QuickOpen 命令：即使插件清理函数遗漏也不会泄漏
        useQuickOpenCommandsStore.getState().unregisterByOwner(id);
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
            versions: this.persistData.versions,
        });
    }
}

export const addonManager = new AddonManager();
