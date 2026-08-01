import { Settings } from './SettingsRegistry';
import { spawnUserName } from '../utils/username';
import { DEFAULT_GUITHEME_MAP, guiThemes, guiAccents } from '../types/gui';
import i18next from 'i18next';
import { shortcutManager } from '../lib/ShortcutManager';
import { isSupportedLanguage, supportedLanguages } from '../i18n';

/** 注册内置设置，并在工作区创建前恢复用户选择的界面语言。 */
export const initBuiltInSettings = async () => {
    Settings.registerMany([
        {
            key: 'userName',
            defaultValue: spawnUserName(),
            category: 'general',
            label: 'gui:settings_userName',
            type: 'text',
            description: 'gui:settings_userName_description',
        },
        {
            key: 'language',
            defaultValue: i18next.language,
            category: 'general',
            label: 'gui:settings_language',
            type: 'select',
            options: supportedLanguages.map(language => ({
                value: language,
                label: `gui:language.${language}`,
            })),
        },
        {
            key: 'guiThemeMode',
            defaultValue: DEFAULT_GUITHEME_MAP.gui,
            category: 'appearance',
            label: 'gui:settings_guiThemeMode',
            type: 'select',
            options: Object.keys(guiThemes).map(k => ({ value: k, label: `gui:theme_${k}` })),
        },
        {
            key: 'guiThemeAccent',
            defaultValue: DEFAULT_GUITHEME_MAP.accent,
            category: 'appearance',
            label: 'gui:settings_guiThemeAccent',
            type: 'select',
            options: Object.keys(guiAccents).map(k => ({ value: k, label: `gui:accent_${k}` })),
        },
    ]);

    shortcutManager.registerSettings();

    Settings.build();

    const language = Settings.get('language');
    if (isSupportedLanguage(language)) {
        if (language !== i18next.language) {
            await i18next.changeLanguage(language);
        }
    } else {
        // 旧版本或手动修改 localStorage 可能留下已不支持的值。
        Settings.set('language', i18next.language);
    }
};
