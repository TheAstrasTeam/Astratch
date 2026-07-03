import {
    DEFAULT_GUIACCENT,
    DEFAULT_GUITHEME,
    type TGuiAccent,
    type TGuiTheme,
} from '../../types/gui';
import type * as Blockly from 'blockly';
import useSettingsStore from '../../stores/useSettingsStore';

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
    const { guiTheme: themeKey } = useSettingsStore.getState();
    // themeKey可能未被存放值
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const theme = guiThemeMap[themeKey.gui] ?? guiThemeMap[DEFAULT_GUITHEME];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const accents = guiAccentMap[themeKey.accent] ?? guiAccentMap[DEFAULT_GUIACCENT];

    Object.entries(theme).forEach(css => {
        document.documentElement.style.setProperty(`--${css[0]}`, css[1]);
    });
    Object.entries(accents).forEach(color => {
        // gui, block
        Object.entries(color[1]).forEach(css => {
            document.documentElement.style.setProperty(`--${css[0]}`, css[1]);
        });
    });
};

const getBlocklyComponentStyles = (): Blockly.Theme.ComponentStyle => {
    const { guiTheme: themeKey } = useSettingsStore.getState();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return blocklyThemeMap[themeKey.gui] ?? blocklyThemeMap[DEFAULT_GUITHEME];
};

export { guiThemeMap, blocklyThemeMap, applyGuiTheme, getBlocklyComponentStyles };
