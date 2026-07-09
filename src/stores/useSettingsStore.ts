// GUI 设置 store（用户名、主题等）
import { create } from 'zustand';
import {
    DEFAULT_SETTINGS,
    type IGuiSettings,
    type TGuiThemeMap,
} from '../types/gui';
import { readLocalStorage, setItemToLocalStorage } from '../utils/localstorage';
import { localStorageIDs } from '../types/storage';

export function initSettings(): IGuiSettings {
    let settings = readLocalStorage(localStorageIDs.Settings) as IGuiSettings | null;
    if (!settings) {
        settings = DEFAULT_SETTINGS;
        setItemToLocalStorage(localStorageIDs.Settings, DEFAULT_SETTINGS);
    }
    return {
        // 生成被移入了 DEFAULT_SETTINGS 的定义
        userName: settings.userName,
        guiTheme: settings.guiTheme,
    };
}

const useSettingsStore = create<IGuiSettings>(set => ({
    ...initSettings(),
    setUserName: (userName: string) => {
        set({ userName });
    },
    setGuiTheme: (guiTheme: TGuiThemeMap) => {
        set({ guiTheme: guiTheme });
    },
}));
export default useSettingsStore;
