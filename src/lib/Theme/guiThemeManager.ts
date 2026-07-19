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

const DEFAULT_BLOCKLY_SPRITES_STYLE_ID = 'blockly_sprites_style';

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
        if (css[0] === 'color-scheme') {
            document.documentElement.style.colorScheme = css[1];

            // 在亮色模式下将 blockly 右下角
            // 的图标为反色
            if (css[1] === 'light') {
                const blocklySpritesStyle = document.createElement('style');
                blocklySpritesStyle.id = DEFAULT_BLOCKLY_SPRITES_STYLE_ID;
                blocklySpritesStyle.textContent = `
                    .blocklyTrash image,
                    .blocklyZoom.blocklyZoomOut,
                    .blocklyZoom.blocklyZoomIn,
                    .blocklyZoom.blocklyZoomReset {
                        filter: invert(1);
                    }
                `;
                document.head.appendChild(blocklySpritesStyle);
            } else document.getElementById(DEFAULT_BLOCKLY_SPRITES_STYLE_ID)?.remove();
            
        } else document.documentElement.style.setProperty(`--${css[0]}`, css[1]);
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
