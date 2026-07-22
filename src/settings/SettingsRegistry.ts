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
        return this;
    }

    registerMany(defs: ISettingDefinition[]): this {
        for (const def of defs) {
            this.definitions.set(def.key, def);
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
