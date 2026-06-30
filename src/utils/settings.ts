// 用于管理界面、编辑器等除VM之外的设置
import { create } from 'zustand';
import { spawnUserName } from './username';
import { DEFAULT_GUITHEME, type guiTheme, type IGuiSettings } from '../types/gui';

export function initSettings(): IGuiSettings {
    const settingsOrigin = localStorage.getItem('ash:settings');
    let settings: IGuiSettings | undefined; //万一不存在呢...

    if (settingsOrigin) {
        try {
            settings = JSON.parse(settingsOrigin);
        } catch {
            // ignore
        }
    }
    return {
        userName: settings?.userName ?? spawnUserName(),
        guiTheme: settings?.guiTheme ?? DEFAULT_GUITHEME,
    };
}

const useSettingsStore = create<IGuiSettings>(set => ({
    ...initSettings(),
    setUserName: (userName: string) => set({ userName }),
    setGuiTheme: (guiTheme: guiTheme) => set({ guiTheme: guiTheme }),
}));
export default useSettingsStore;
