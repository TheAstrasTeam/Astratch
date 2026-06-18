// 用于管理界面、编辑器等除VM之外的设置
import { create } from 'zustand'
import { spawnUserName } from './username'
import type { settings } from '../typescript/interface';


export function initSettings(){
    const settingsOrigin = localStorage.getItem('aen:settings');
    let settings: settings;
    if(settingsOrigin) settings = JSON.parse(settingsOrigin);
    
    create(() => ({
        userName: settings?.userName ?? spawnUserName(),
        guiTheme: settings?.guiTheme ?? 'dark'
    }))
}