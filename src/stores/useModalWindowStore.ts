/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 此文件由AI生成：可拖动模态框的窗口状态（位置/大小/层级）管理 
 */

import { create, type UseBoundStore, type StoreApi } from 'zustand';

/**
 * 某个模态框窗口的几何与层级状态
 */
export interface IModalWindowRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface IModalWindowState extends IModalWindowRect {
    /**
     * 层级，数值越大越靠前
     */
    z: number;
}

/**
 * 窗口ID的持久化 key
 */
const STORAGE_KEY = 'astratch.modalWindows';

/** 与 @reactleaf/modal 的 .modal-layer 默认 z-index 保持一致 */
const BASE_Z = 1001;

/**
 * 纯读取：计算窗口的初始 z-index（总是当前最高 + 1）
 * 不能使用持久化的旧 z：否则重新打开的窗口会拿到过期的低层级，出现在父窗口下方
 * 用于在组件第一次渲染时就知道正确的层级
 */
const getInitialWindowZ = (windowID: string): number => {
    const state = useModalWindowStore.getState();
    return (
        Object.values(state.windows).reduce((max, w) => Math.max(max, w?.z ?? 0), BASE_Z) + 1
    );
};

/**
 * 计算默认窗口状态：首次打开时居中显示
 */
const createDefaultState = (): IModalWindowState => {
    const width = Math.min(480, (typeof window === 'undefined' ? 1000 : window.innerWidth) * 0.6);
    const height = 360;
    const innerWidth = typeof window === 'undefined' ? 1000 : window.innerWidth;
    const innerHeight = typeof window === 'undefined' ? 800 : window.innerHeight;
    return {
        x: Math.max(0, Math.round((innerWidth - width) / 2)),
        y: Math.max(0, Math.round((innerHeight - height) / 2)),
        width,
        height,
        z: BASE_Z,
    };
};

const readStored = (): Record<string, IModalWindowState | undefined> => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, IModalWindowState>;
    } catch {
        return {};
    }
};

const writeStored = (windows: Record<string, IModalWindowState | undefined>) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(windows));
    } catch {
        // 忽略存储失败（如隐私模式）
    }
};

interface IModalWindowStore {
    windows: Record<string, IModalWindowState | undefined>;
    /**
     * 确保窗口已登记（还没有则新建一个并置顶）
     * 新打开的窗口总是放在最前面
     */
    register: (windowID: string) => void;
    /**
     * 更新窗口的位置/大小
     */
    update: (windowID: string, rect: Partial<IModalWindowRect>) => void;
    /**
     * 将窗口提升到最前面
     */
    raise: (windowID: string) => void;
}

const useModalWindowStore: UseBoundStore<StoreApi<IModalWindowStore>> = create<IModalWindowStore>(
    (set, get) => ({
        windows: readStored(),
        register: windowID => {
            const { windows } = get();
            const existing = windows[windowID];
            const maxZ = Object.values(windows).reduce(
                (max, w) => Math.max(max, w?.z ?? 0),
                BASE_Z,
            );
            // 已存在的窗口保留位置/大小，但层级必须刷新到当前最高，否则
            // 重新打开（如子窗口）会出现在父窗口下方
            const next: IModalWindowState = existing
                ? { ...existing, z: maxZ + 1 }
                : { ...createDefaultState(), z: maxZ + 1 };
            const nextWindows = { ...windows, [windowID]: next };
            set({ windows: nextWindows });
            writeStored(nextWindows);
        },
        update: (windowID, rect) => {
            const { windows } = get();
            const existing = windows[windowID];
            if (!existing) return;
            const nextWindows = {
                ...windows,
                [windowID]: { ...existing, ...rect },
            };
            set({ windows: nextWindows });
            writeStored(nextWindows);
        },
        raise: windowID => {
            const { windows } = get();
            const existing = windows[windowID];
            if (!existing) return;
            const maxZ = Object.values(windows).reduce(
                (max, w) => Math.max(max, w?.z ?? 0),
                BASE_Z,
            );
            const nextWindows = {
                ...windows,
                [windowID]: { ...existing, z: maxZ + 1 },
            };
            set({ windows: nextWindows });
            writeStored(nextWindows);
        },
    }),
);

export { useModalWindowStore, getInitialWindowZ }; // 此导出由AI生成
