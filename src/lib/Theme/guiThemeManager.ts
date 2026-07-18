import {
    DEFAULT_GUIACCENT,
    DEFAULT_GUITHEME,
    type TGuiAccent,
    type TGuiTheme,
} from '../../types/gui';
import type * as Blockly from 'blockly';
import { Settings } from '../../settings/SettingsRegistry';
import dark from './gui/dark';
import light from './gui/light';

import blue from './accent/blue';

const guiThemeMap: Record<TGuiTheme, Record<string, string>> = {
    dark: dark.guiTheme,
    light: light.guiTheme,
};
const blocklyThemeMap: Record<TGuiTheme, Blockly.Theme.ComponentStyle> = {
    dark: dark.blocklyTheme,
    light: light.blocklyTheme,
};
const guiAccentMap: Record<TGuiAccent, Record<'gui' | 'block', Record<string, string>>> = {
    blue: {
        gui: blue.guiColors,
        block: blue.blockColors,
    },
};

const applyGuiTheme = (): void => {
    const themeMode = Settings.get('guiThemeMode') as TGuiTheme;
    const themeAccent = Settings.get('guiThemeAccent') as TGuiAccent;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const theme = guiThemeMap[themeMode] ?? guiThemeMap[DEFAULT_GUITHEME];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const accents = guiAccentMap[themeAccent] ?? guiAccentMap[DEFAULT_GUIACCENT];

    Object.entries(theme).forEach(css => {
        if (css[0] === 'color-scheme') document.documentElement.style.colorScheme = css[1];
        else document.documentElement.style.setProperty(`--${css[0]}`, css[1]);
    });
    Object.entries(accents).forEach(color => {
        Object.entries(color[1]).forEach(css => {
            document.documentElement.style.setProperty(`--${css[0]}`, css[1]);
        });
    });
};

const getBlocklyComponentStyles = (): Blockly.Theme.ComponentStyle => {
    const themeMode = (Settings.get('guiThemeMode') ?? DEFAULT_GUITHEME) as TGuiTheme;
    return blocklyThemeMap[themeMode];
};

export { guiThemeMap, blocklyThemeMap, applyGuiTheme, getBlocklyComponentStyles };
