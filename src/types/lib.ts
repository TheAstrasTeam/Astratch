// shortcut manager

import type Mousetrap from 'mousetrap';

export const ALL_SHORTCUTS_IDS = {
    NEW_PROJECT: 'project.new',
    SAVE_PROJECT: 'project.save',
    OPEN_PROJECT: 'project.open',
    BLOCKLY_COPY: 'blockly.copy',
    BLOCKLY_CUT: 'blockly.cut',
    BLOCKLY_PASTE: 'blockly.paste',
    BLOCKLY_UNDO: 'blockly.undo',
    BLOCKLY_REDO: 'blockly.redo',
    BLOCKLY_DUPLICATE: 'blockly.duplicate',
    BLOCKLY_CLEANUP: 'blockly.cleanup',
    BLOCKLY_DISCONNECT: 'blockly.disconnect',
} as const;

export type ShortcutIds = (typeof ALL_SHORTCUTS_IDS)[keyof typeof ALL_SHORTCUTS_IDS];

export const DEFAULT_SHORTCUTS = {
    [ALL_SHORTCUTS_IDS.NEW_PROJECT]: 'mod+e',
    [ALL_SHORTCUTS_IDS.SAVE_PROJECT]: 'mod+s',
    [ALL_SHORTCUTS_IDS.OPEN_PROJECT]: 'mod+o',
    [ALL_SHORTCUTS_IDS.BLOCKLY_COPY]: 'mod+c',
    [ALL_SHORTCUTS_IDS.BLOCKLY_CUT]: 'mod+x',
    [ALL_SHORTCUTS_IDS.BLOCKLY_PASTE]: 'mod+v',
    [ALL_SHORTCUTS_IDS.BLOCKLY_UNDO]: 'mod+z',
    [ALL_SHORTCUTS_IDS.BLOCKLY_REDO]: 'mod+shift+z',
    [ALL_SHORTCUTS_IDS.BLOCKLY_DUPLICATE]: 'd',
    [ALL_SHORTCUTS_IDS.BLOCKLY_CLEANUP]: 'c',
    [ALL_SHORTCUTS_IDS.BLOCKLY_DISCONNECT]: 'shift+x',
} satisfies Record<ShortcutIds, string>;

export type ShortcutCommand = (
    event: Mousetrap.ExtendedKeyboardEvent,
    combo: string,
) => void | Promise<void>;

export interface IShortcutMeta {
    id: ShortcutIds;
    scope: string;
    command?: ShortcutCommand;
}

export type SetShortcutResult =
    | { ok: true }
    | { ok: false; reason: 'empty' | 'conflict'; conflictWith?: ShortcutIds };

export interface ShortcutChangeEvent {
    id: ShortcutIds;
    scope: string;
    oldKey: string | undefined;
    newKey: string | undefined;
}

export type ShortcutChangeListener = (event: ShortcutChangeEvent) => void;

export interface IShortcut {
    readonly shortcuts: ReadonlyMap<ShortcutIds, IShortcutMeta>;
    register: (meta: IShortcutMeta) => () => void;
    unregister: (id: ShortcutIds) => boolean;
    getHotKey: (id: ShortcutIds) => string;
    getMeta: (id: ShortcutIds) => IShortcutMeta | undefined;
    formatHotKey: (key: string) => string;
    setHotKey: (id: ShortcutIds, hotKey: string) => SetShortcutResult;
    resetHotKey: (id: ShortcutIds) => void;
    onChange: (listener: ShortcutChangeListener) => () => void;
}

// toastManager

export interface IToastManger {
    /**
     * 创建一个通知
     * 并返回是否创建成功
     */
    create: (meta: IToast) => boolean;
    emit: (data: TToastEvent) => void;
    on: (
        id: string,
        callback: (data: TToastEvent) => void,
        opts?: { once?: boolean },
    ) => () => void;
    off: (id: string) => void;
    /**
     * 当前活跃的通知（未归档）
     */
    getAllHistory: () => ReadonlyMap<string, IToast>;
    /**
     * 完整历史（活跃 + 已归档），按 createdAt 倒序
     */
    getFullHistory: () => IToast[];
    /**
     * 删除一个通知（程序移除，不会触发 action）
     * 归档到完整历史中
     * @param id 通知id
     * @returns 是否成功删除
     */
    removeToast: (id: string) => boolean;
    /**
     * 用户点击通知时调用，会触发 action 并归档
     * @returns 是否成功（通知存在时为 true）
     */
    interact: (id: string) => boolean;
    /**
     * 仅触发 action，不归档（供历史面板使用）
     * @returns 是否成功
     */
    trigger: (id: string) => boolean;
    /**
     * 设置 progress 类型通知的进度
     * @returns 是否成功
     */
    setProgress: (id: string, progress: number) => boolean;
}

export type TToastMode = 'info' | 'error' | 'warn' | 'spinner' | 'progress';

export interface IToast {
    id: string;
    type: TToastMode;
    text: string;
    duration?: number;
    /**
     * 用户点击通知时触发的回调
     * 仅在 interact/trigger 时被调用，result 恒为 true
     */
    action?: (result: boolean) => void;
    /**
     * 进度值，仅 type === 'progress' 时有效
     * spinner 类型不应使用此字段（永远显示滚动动画）
     */
    progress?: number;
    /**
     * 创建时间戳（由 ToastManager 自动填充）
     */
    createdAt?: number;
    /**
     * 归档时间戳（被 dismiss 后由 ToastManager 填充，存在表示已归档）
     */
    archivedAt?: number;
}

/**
 * toast 事件
 * - refresh: 增删/全量刷新
 * - progress: 单条 loading 进度更新（UI 可局部刷新）
 */
export type TToastEvent = { type: 'refresh' } | { type: 'progress'; id: string; progress: number };

export interface IEvent {
    callback?: (data: TToastEvent) => void;
    once?: boolean;
    id: string;
}
