// 用于管理界面、编辑器等除VM之外的设置
import { create } from 'zustand'
import { spawnUserName } from './username'
import type { IGuiSettings } from '../types/gui';

const DEFAULT_GUITHEME: string = 'dark';

export function initSettings() {
    const settingsOrigin = localStorage.getItem('aen:settings');
    let settings: IGuiSettings | undefined; //万一不存在呢...

    if (settingsOrigin) {
        try {
            settings = JSON.parse(settingsOrigin);
        } catch {
            // ignore
        }
    }
    create(() => ({
        userName: settings?.userName ?? spawnUserName(),
        guiTheme: settings?.guiTheme ?? DEFAULT_GUITHEME
    }))
}