/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由 Ai 生成

import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { readLocalStorage, setItemToLocalStorage } from '../utils/localstorage';
import { localStorageIDs } from '../types/storage';

export type TSettingType = 'text' | 'number' | 'boolean' | 'select' | 'theme' | 'key';

export interface ISettingOption {
    value: string;
    label: string;
}

export interface ISettingDefinition<T = unknown> {
    key: string;
    defaultValue: T;
    category: string;
    label: string;
    description?: string;
    type: TSettingType;
    options?: ISettingOption[];
    /** number 类型的最小值（默认不限制） */
    min?: number;
    /** number 类型的最大值（默认不限制） */
    max?: number;
    /** text 类型：是否允许多行输入（渲染为两倍高度的 textarea），默认 false */
    allowLines?: boolean;
    /** 所属分组（用于在设置页里按插件划分子标题，一般放 i18n key） */
    group?: string;
}

interface SettingsState {
    setValue: (key: string, value: unknown) => void;
    [key: string]: unknown;
}

export type TSettingsStore = UseBoundStore<StoreApi<SettingsState>>;

class SettingsRegistry {
    private definitions = new Map<string, ISettingDefinition>();
    private _store: TSettingsStore | null = null;

    register<T>(def: ISettingDefinition<T>): this {
        this.definitions.set(def.key, def);
        // build 之后再注册（如插件设置）时，若 store 里还没有该 key，则补上默认值
        if (this._store) {
            const current = this._store.getState()[def.key];
            if (current === undefined) {
                this._store.getState().setValue(def.key, def.defaultValue);
            }
        }
        return this;
    }

    registerMany(defs: ISettingDefinition[]): this {
        for (const def of defs) {
            this.register(def);
        }
        return this;
    }

    /**
     * 注销某个分类下的所有设置定义（如插件刷新/移除时清理旧的插件设置）。
     * store 里已有的值不会删除，但不存在的定义不会再被持久化。
     */
    unregisterByCategory(category: string): this {
        for (const key of this.definitions.keys()) {
            if (this.definitions.get(key)?.category === category) {
                this.definitions.delete(key);
            }
        }
        return this;
    }

    build(): TSettingsStore {
        if (this._store) return this._store;

        const defaults: Record<string, unknown> = {};
        for (const [key, def] of this.definitions) {
            defaults[key] = def.defaultValue;
        }

        const persisted = readLocalStorage(localStorageIDs.Settings) as Record<
            string,
            unknown
        > | null;
        const initialValues: Record<string, unknown> = { ...defaults, ...persisted };

        this._store = create<SettingsState>(set => ({
            ...initialValues,
            setValue: (key: string, value: unknown) => {
                set({ [key]: value });
            },
        }));

        this._store.subscribe(state => {
            const values: Record<string, unknown> = {};
            for (const key of this.definitions.keys()) {
                values[key] = state[key];
            }
            setItemToLocalStorage(localStorageIDs.Settings, values);
        });

        return this._store;
    }

    get store(): TSettingsStore {
        if (!this._store) throw new Error('You need build Settings first!');
        return this._store;
    }

    get use(): TSettingsStore {
        if (!this._store) throw new Error('You need build Settings first!');
        return this._store;
    }

    get(key: string): unknown {
        return this.store.getState()[key];
    }

    set(key: string, value: unknown): void {
        this.store.getState().setValue(key, value);
    }

    reset(key: string): void {
        const def = this.definitions.get(key);
        if (def) {
            this.set(key, def.defaultValue);
        }
    }

    resetAll(): void {
        for (const [key, def] of this.definitions) {
            this.set(key, def.defaultValue);
        }
    }

    getDefinitions(): ISettingDefinition[] {
        return Array.from(this.definitions.values());
    }

    getAllCategory(): string[] {
        return Object.keys(this.getDefinitionsByCategory());
    }

    getDefinitionsByCategory(): Record<string, ISettingDefinition[]> {
        const categories: Record<string, ISettingDefinition[]> = {};
        for (const def of this.definitions.values()) {
            (categories[def.category] ??= []).push(def);
        }
        return categories;
    }
}

export const Settings = new SettingsRegistry();

/**
 * React hook
 * 不用hook可能导致GUI不！刷！新！
 * 这个就是`Settings.use(...)`的hook包装
 */
export const useSettings = <T>(selector: (state: SettingsState) => T): T =>
    Settings.store(selector);
