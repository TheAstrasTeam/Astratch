import { DEFAULT_GUITHEME, type guiTheme } from '../../types/gui';
import useSettingsStore from '../../stores/useSettingsStore';
import dark from './gui/dark';
import light from './gui/light';

const guiThemeMap: Record<guiTheme, Record<string, string>> = {
    dark: dark.guiTheme,
    light: light.guiTheme,
};

const applyGuiTheme = (): void => {
    const { guiTheme: themeKey } = useSettingsStore.getState();
    // themeKey可能未被存放值
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const theme = guiThemeMap[themeKey] ?? guiThemeMap[DEFAULT_GUITHEME];

    Object.entries(theme).forEach(css => {
        document.documentElement.style.setProperty(`--${css[0]}`, css[1]);
    });
};

export { guiThemeMap, applyGuiTheme };
