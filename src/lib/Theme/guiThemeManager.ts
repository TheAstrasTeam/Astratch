import { DEFAULT_GUITHEME, type guiTheme } from '../../types/gui';
import useSettingsStore from '../../utils/settings';
import dark from './gui/dark';

const guiThemeMap: Partial<Record<guiTheme, typeof dark.guiTheme>> = {
    dark: dark.guiTheme,
};

const applyGuiTheme = (): void => {
    const { guiTheme: themeKey } = useSettingsStore.getState();
    const theme = guiThemeMap[themeKey] ?? guiThemeMap[DEFAULT_GUITHEME]!;

    Object.entries(theme).forEach(css => {
        document.documentElement.style.setProperty(`--${css[0]}`, css[1]);
    });
};

export { guiThemeMap, applyGuiTheme };
