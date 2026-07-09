export const localStorageIDs = {
    /**
     * 当前使用的界面语言
     */
    Language: 'ash_language',
    /**
     * 当前的设置
     */
    Settings: 'ash_settings',
} as const;

export type TlocalStorageIDs = (typeof localStorageIDs)[keyof typeof localStorageIDs];
