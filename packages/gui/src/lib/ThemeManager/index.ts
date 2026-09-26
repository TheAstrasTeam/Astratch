import { EventBus } from 'astratch-core';
import type { PartialByKeys } from '../../utils/types';
import { DB } from '../DBManager';
import {
    builtIn_accentThemes,
    builtIn_defaultTheme_accent,
    builtIn_defaultTheme_UI,
    builtIn_themeIDs,
    builtIn_UIThemes,
} from './builtIn';

// 公共部分
type TThemeMeta = { translate: false; name: string } | { translate: true; translateID: string };

type TAccentTheme = {
    id: string;
    kind: 'accent';
    scheme: {
        primary: string;
        secondary: string;
        tertiary: string;
        transparent: string;
        highlight: string;
    };
} & TThemeMeta;

type TUITheme = {
    id: string;
    kind: 'ui';
    mixWithAccent: boolean;
    isDarkTheme: boolean;
    scheme: {
        primary: string;
        secondary: string;
        tertiary: string;
        quaternary: string;
        'primary-icon': string;
        'secondary-icon': string;
        'tertiary-icon': string;
        'quaternary-icon': string;
        'transparent-dark': string;
        'transparent-light': string;
        text: string;
    };
} & TThemeMeta;

type TTheme = TAccentTheme | TUITheme;

type TSubmitTheme = PartialByKeys<TTheme, 'id'>;

interface IThemeManager {
    init(): Promise<void>;
    /**
     * 创建一个新主题，并返回它的ID
     * @param autoApply 创建完成后自动应用？
     */
    addNewTheme(config: TSubmitTheme, autoApply: boolean): Promise<string>;
    /** 删除一个主题，并返回是否删除成功 */
    deleteTheme(kind: 'accent' | 'ui', id: string): Promise<boolean>;
    /** 获取一个主题 */
    getTheme<K extends 'accent' | 'ui'>(
        kind: K,
        id: string,
    ): Promise<
        | {
              accent: TAccentTheme;
              ui: TUITheme;
          }[K]
        | undefined
    >;
    /** 获取正在使用的主题 */
    getUsingTheme<K extends 'accent' | 'ui'>(
        kind: K,
    ): Promise<
        {
            accent: TAccentTheme;
            ui: TUITheme;
        }[K]
    >;
    /** 应用一个主题 */
    applyTheme(kind: 'accent' | 'ui', id: string): Promise<void>;
}

interface IThemeDBStorage {
    usingUITheme: string;
    usingAccentTheme: string;
    themes: {
        ui: Record<string, TUITheme>;
        accent: Record<string, TAccentTheme>;
    };
}

interface IThemeEventsType {
    APPLIED_THEME: {
        id: string;
        kind: 'accent' | 'ui';
    };
    DELETED_THEME: {
        id: string;
        kind: 'accent' | 'ui';
    };
    ADDED_THEME: {
        id: string;
        kind: 'accent' | 'ui';
    };
}

const THEME_MANAGER_ID = 'astratch-theme' as const;
const THEME_DOM_ACCENT_ID = 'astratch-theme-accent' as const;
const THEME_DOM_UI_ID = 'astratch-theme-ui' as const;

class ThemeManager extends EventBus<IThemeEventsType> implements IThemeManager {
    private isWriting = false;
    protected async useDB<T>(callback: (storage: IThemeDBStorage) => Promise<T> | T): Promise<T> {
        if (this.isWriting) throw new Error('DB is using.');
        this.isWriting = true;
        try {
            const DBThemeStorage = (await DB.getData(THEME_MANAGER_ID)) as IThemeDBStorage;
            return await callback(DBThemeStorage);
        } finally {
            this.isWriting = false;
        }
    }
    private async addThemeToDB(theme: TTheme): Promise<void> {
        await this.useDB(async DBThemeStorage => {
            DBThemeStorage.themes[theme.kind][theme.id] = theme;
            await DB.setData(THEME_MANAGER_ID, DBThemeStorage);
        });
    }
    private async deleteThemeFromDB(kind: 'accent' | 'ui', id: string): Promise<void> {
        await this.useDB(async DBThemeStorage => {
            const { [id]: _, ...themes } = DBThemeStorage.themes[kind];
            DBThemeStorage.themes[kind] = themes as Record<string, TAccentTheme> &
                Record<string, TUITheme>;
            await DB.setData(THEME_MANAGER_ID, DBThemeStorage);
        });
    }
    private async setUsingThemeToDB(kind: 'accent' | 'ui', id: string): Promise<void> {
        await this.useDB(async DBThemeStorage => {
            if (kind === 'accent') DBThemeStorage.usingAccentTheme = id;
            else DBThemeStorage.usingUITheme = id;
            await DB.setData(THEME_MANAGER_ID, DBThemeStorage);
        });
    }
    private async getThemeByDB<K extends 'accent' | 'ui'>(
        kind: K,
        id: string,
    ): Promise<
        | {
              accent: TAccentTheme;
              ui: TUITheme;
          }[K]
        | undefined
    > {
        const storage = await this.getThemeStorage();
        // TypeScript, FUCK YOU!
        // 等价报错类型不兼容的来
        return storage.themes[kind][id] as { accent: TAccentTheme; ui: TUITheme }[K] | undefined;
    }
    private async getThemeStorage(): Promise<IThemeDBStorage> {
        const storage = (await DB.getData(THEME_MANAGER_ID)) as IThemeDBStorage | undefined;
        if (!storage) throw new Error(`Can't get theme storage.`);
        return storage;
    }

    async addNewTheme(config: TSubmitTheme, autoApply: boolean): Promise<string> {
        const id = config.id ?? crypto.randomUUID();
        const themeConfig = {
            ...config,
            id,
        };
        await this.addThemeToDB(themeConfig);
        this.emit('ADDED_THEME', {
            id,
            kind: themeConfig.kind,
        });

        if (autoApply) await this.applyTheme(themeConfig.kind, id);
        return id;
    }
    async init(): Promise<void> {
        const addDefaultThemes = async (apply: boolean) => {
            // 添加内置主题
            // init只会在DB初始化时执行一次，所以嘛
            // 不会有任何问题
            for (const uiTheme of Object.values(builtIn_UIThemes)) {
                await this.addNewTheme(uiTheme, false);
            }
            for (const accentTheme of Object.values(builtIn_accentThemes)) {
                await this.addNewTheme(accentTheme, false);
            }
            if (apply) {
                await this.applyTheme('ui', builtIn_defaultTheme_UI);
                await this.applyTheme('accent', builtIn_defaultTheme_accent);
            }
        };
        const themeStorage = (await DB.getData(THEME_MANAGER_ID)) as IThemeDBStorage | undefined;

        if (themeStorage) {
            await addDefaultThemes(false);

            // 应用主题
            await this.applyTheme('ui', themeStorage.usingUITheme || builtIn_defaultTheme_UI);
            await this.applyTheme(
                'accent',
                themeStorage.usingAccentTheme || builtIn_defaultTheme_accent,
            );
            return;
        }
        await DB.setData(THEME_MANAGER_ID, {
            usingUITheme: '',
            usingAccentTheme: '',
            themes: {
                ui: {},
                accent: {},
            },
        } satisfies IThemeDBStorage);
        await addDefaultThemes(true);
    }
    async applyTheme(kind: 'accent' | 'ui', id: string): Promise<void> {
        const themeConfig = await this.getThemeByDB(kind, id);
        if (!themeConfig) throw new Error(`Not't found theme of ${id}`);
        const styleID = kind === 'accent' ? THEME_DOM_ACCENT_ID : THEME_DOM_UI_ID;

        let cssString = ':root{';
        if (kind === 'accent') {
            Object.entries(themeConfig.scheme).forEach(accent => {
                cssString += `--accent-${accent[0]}: ${accent[1]};`;
            });
        } else {
            // 这个if其实是100%成立的，这里为了类型系统不报错
            if (themeConfig.kind === 'ui')
                cssString += `color-scheme: ${themeConfig.isDarkTheme ? 'dark' : 'light'};`;
            Object.entries(themeConfig.scheme).forEach(ui => {
                cssString += `--ui-${ui[0]}: ${
                    themeConfig.kind === 'ui'
                        ? themeConfig.mixWithAccent
                            ? `color-mix(in srgb, ${ui[1]} 95%, var(--accent-primary))`
                            : ui[1]
                        : ui[1]
                };`;
            });
        }
        cssString += '}';
        let styleDOM = document.head.querySelector(`style.${styleID}`);
        if (!styleDOM) {
            styleDOM = document.createElement('style');
            styleDOM.className = styleID;
            document.head.appendChild(styleDOM);
        }
        styleDOM.textContent = cssString;
        await this.setUsingThemeToDB(kind, id);
        this.emit('APPLIED_THEME', {
            id,
            kind,
        });
    }
    async getTheme<K extends 'accent' | 'ui'>(
        kind: K,
        id: string,
    ): Promise<
        | {
              accent: TAccentTheme;
              ui: TUITheme;
          }[K]
        | undefined
    > {
        const themeConfig = await this.getThemeByDB(kind, id);
        return themeConfig;
    }
    async getUsingTheme<K extends 'accent' | 'ui'>(
        kind: K,
    ): Promise<
        {
            accent: TAccentTheme;
            ui: TUITheme;
        }[K]
    > {
        const themeStorage = await this.getThemeStorage();
        // 等价报错类型不兼容的来
        // 好熟悉的样子
        if (kind === 'accent')
            return themeStorage.themes.accent[themeStorage.usingAccentTheme] as {
                accent: TAccentTheme;
                ui: TUITheme;
            }[K];
        return themeStorage.themes.ui[themeStorage.usingUITheme] as {
            accent: TAccentTheme;
            ui: TUITheme;
        }[K];
    }
    async deleteTheme(kind: 'accent' | 'ui', id: string): Promise<boolean> {
        if (builtIn_themeIDs.includes(id)) {
            console.warn(`Can't delete the built-in theme.`);
            return false;
        }
        const themeStorage = await this.getThemeStorage();
        if (
            (kind === 'accent' && themeStorage.usingAccentTheme === id) ||
            (kind === 'ui' && themeStorage.usingUITheme === id)
        ) {
            console.warn(`Can't delete theme of ${id}\nThis theme is using.`);
            return false;
        }
        const themeConfig = themeStorage.themes[kind][id] as TAccentTheme | TUITheme | undefined;
        if (!themeConfig) return false;
        await this.deleteThemeFromDB(kind, id);
        this.emit('DELETED_THEME', {
            id,
            kind,
        });
        return true;
    }
}
const themeManager = new ThemeManager();
await themeManager.init();
export { themeManager, type TTheme, type IThemeEventsType };
