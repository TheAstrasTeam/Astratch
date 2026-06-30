// GUI 设置 store（用户名、主题等）
import { create } from 'zustand';
import { spawnUserName } from '../utils/username';
import { DEFAULT_GUITHEME, type guiTheme, type IGuiSettings } from '../types/gui';
import { readLocalStorage } from '../utils/localstorage';

export function initSettings(): IGuiSettings {
    const settings = readLocalStorage('ash:settings') as IGuiSettings | null;
    return {
        userName: settings?.userName ?? spawnUserName(),
        guiTheme: settings?.guiTheme ?? DEFAULT_GUITHEME,
    };
}

const useSettingsStore = create<IGuiSettings>(set => ({
    ...initSettings(),
    setUserName: (userName: string) => {
        set({ userName });
    },
    setGuiTheme: (guiTheme: guiTheme) => {
        set({ guiTheme: guiTheme });
    },
}));
export default useSettingsStore;
