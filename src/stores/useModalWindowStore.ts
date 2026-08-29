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
const STORAGE_KEY = 'ash_modalCache';

/** 与 @reactleaf/modal 的 .modal-layer 默认 z-index 保持一致 */
const BASE_Z = 1001;

type TWindows = Record<string, IModalWindowState | undefined>;

/**
 * 计算当前所有窗口中的最高层级（下限为 BASE_Z）
 */
const computeMaxZ = (windows: TWindows): number =>
    Object.values(windows).reduce((max, w) => Math.max(max, w?.z ?? 0), BASE_Z);

/**
 * 纯读取：计算窗口的初始 z-index（总是当前最高 + 1）
 * 不能使用持久化的旧 z：否则重新打开的窗口会拿到过期的低层级，出现在父窗口下方
 * 用于在组件第一次渲染时就知道正确的层级
 */
const getInitialWindowZ = (): number => computeMaxZ(useModalWindowStore.getState().windows) + 1;

/**
 * 默认窗口矩形：首次打开时居中显示
 */
const getDefaultRect = (): IModalWindowRect => {
    const innerWidth = typeof window === 'undefined' ? 1000 : window.innerWidth;
    const innerHeight = typeof window === 'undefined' ? 800 : window.innerHeight;
    const width = Math.min(480, innerWidth * 0.6);
    const height = 360;
    return {
        x: Math.max(0, Math.round((innerWidth - width) / 2)),
        y: Math.max(0, Math.round((innerHeight - height) / 2)),
        width,
        height,
    };
};

const createDefaultState = (): IModalWindowState => ({ ...getDefaultRect(), z: BASE_Z });

/**
 * 将窗口矩形钳制到当前视口内
 * 若持久化的尺寸/位置来自更大的屏幕或旧版本，窗口会比 .modal-layer 还大，
 * 导致 react-rnd 的 bounds='parent' 约束区间为空（left > right），
 * 拖拽时坐标被坍缩到固定角落，表现为"鼠标动了窗口不动"
 */
const clampRectToViewport = (rect: IModalWindowState): IModalWindowState => {
    if (typeof window === 'undefined') return rect;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(rect.width, vw);
    const height = Math.min(rect.height, vh);
    return {
        ...rect,
        width,
        height,
        x: Math.min(Math.max(rect.x, 0), Math.max(0, vw - width)),
        y: Math.min(Math.max(rect.y, 0), Math.max(0, vh - height)),
    };
};

const readStored = (): TWindows => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as Record<string, IModalWindowState | undefined>;
        const next: Record<string, IModalWindowState | undefined> = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (value) next[key] = clampRectToViewport(value);
        }
        return next;
    } catch {
        return {};
    }
};

const writeStored = (windows: TWindows) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(windows));
    } catch {
        // 忽略存储失败（如隐私模式）
    }
};

/**
 * 节流写入持久化：拖拽/点击置顶会高频触发状态更新，
 * 同步全量 JSON.stringify 写入 localStorage 代价过高，
 * 因此合并为 trailing 定时写入
 */
let storedTimer: ReturnType<typeof setTimeout> | undefined;

const scheduleWriteStored = () => {
    if (storedTimer !== undefined) return;
    storedTimer = setTimeout(() => {
        storedTimer = undefined;
        writeStored(useModalWindowStore.getState().windows);
    }, 200);
};

const flushStored = () => {
    if (storedTimer === undefined) return;
    clearTimeout(storedTimer);
    storedTimer = undefined;
    writeStored(useModalWindowStore.getState().windows);
};

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushStored();
    });
    window.addEventListener('beforeunload', flushStored);
}

interface IModalWindowStore {
    windows: TWindows;
    /**
     * 当前活跃（最顶层）窗口的 ID，用于非活动窗口的暗淡显示
     */
    activeWindowID: string | null;
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
        activeWindowID: null,
        register: windowID => {
            const { windows } = get();
            const existing = windows[windowID];
            const maxZ = computeMaxZ(windows);
            // 已存在的窗口保留位置/大小，但层级必须刷新到当前最高，否则
            // 重新打开（如子窗口）会出现在父窗口下方
            const next: IModalWindowState = existing
                ? clampRectToViewport({ ...existing, z: maxZ + 1 })
                : { ...createDefaultState(), z: maxZ + 1 };
            const nextWindows = { ...windows, [windowID]: next };
            set({ windows: nextWindows, activeWindowID: windowID });
            scheduleWriteStored();
        },
        update: (windowID, rect) => {
            const { windows } = get();
            const existing = windows[windowID];
            if (!existing) return;
            const nextWindows = {
                ...windows,
                [windowID]: clampRectToViewport({ ...existing, ...rect }),
            };
            set({ windows: nextWindows });
            scheduleWriteStored();
        },
        raise: windowID => {
            const { windows, activeWindowID } = get();
            const existing = windows[windowID];
            if (!existing) return;
            const maxZ = computeMaxZ(windows);
            // 已经是最高层且处于活跃状态时无需更新：
            // raise 由窗口内每次 mousedown 触发，短路可避免
            // 每次点击都进行全量 set 与持久化写入
            if (existing.z >= maxZ && activeWindowID === windowID) return;
            const nextWindows = {
                ...windows,
                [windowID]: { ...existing, z: maxZ + 1 },
            };
            set({ windows: nextWindows, activeWindowID: windowID });
            scheduleWriteStored();
        },
    }),
);

export { useModalWindowStore, getInitialWindowZ, clampRectToViewport, getDefaultRect }; // 此导出由AI生成
