import { Settings } from './SettingsRegistry';
import { spawnUserName } from '../utils/username';
import { DEFAULT_GUITHEME_MAP, guiThemes, guiAccents } from '../types/gui';
import { t } from 'i18next';

export const initBuiltInSettings = () => {
    Settings.registerMany([
        {
            key: 'userName',
            defaultValue: spawnUserName(),
            category: 'general',
            label: t('gui:settings_userName'),
            type: 'text',
            description: t('gui:settings_userName_description'),
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

    Settings.build();
};
