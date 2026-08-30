/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 快捷键管理器的统一常量与类型定义

import type Mousetrap from 'mousetrap';

export interface ShortcutDefinition {
    id: string;
    defaultKey: string;
    scope: 'global' | 'blockly';
    blocklyName?: string;
}

export const SHORTCUTS = {
    NEW_PROJECT: {
        id: 'project.new',
        defaultKey: 'mod+e',
        scope: 'global',
    },
    SAVE_PROJECT: {
        id: 'project.save',
        defaultKey: 'mod+s',
        scope: 'global',
    },
    SAVE_PROJECT_AS: {
        id: 'project.saveAs',
        defaultKey: 'mod+shift+s',
        scope: 'global',
    },
    OPEN_PROJECT: {
        id: 'project.open',
        defaultKey: 'mod+o',
        scope: 'global',
    },
    OPEN_SETTINGS: {
        id: 'settings.open',
        defaultKey: 'mod+,',
        scope: 'global',
    },
    BLOCKLY_COPY: {
        id: 'blockly.copy',
        defaultKey: 'mod+c',
        scope: 'blockly',
        blocklyName: 'copy',
    },
    BLOCKLY_CUT: {
        id: 'blockly.cut',
        defaultKey: 'mod+x',
        scope: 'blockly',
        blocklyName: 'cut',
    },
    BLOCKLY_PASTE: {
        id: 'blockly.paste',
        defaultKey: 'mod+v',
        scope: 'blockly',
        blocklyName: 'paste',
    },
    BLOCKLY_UNDO: {
        id: 'blockly.undo',
        defaultKey: 'mod+z',
        scope: 'blockly',
        blocklyName: 'undo',
    },
    BLOCKLY_REDO: {
        id: 'blockly.redo',
        defaultKey: 'mod+shift+z',
        scope: 'blockly',
        blocklyName: 'redo',
    },
    BLOCKLY_DUPLICATE: {
        id: 'blockly.duplicate',
        defaultKey: 'd',
        scope: 'blockly',
        blocklyName: 'duplicate',
    },
    BLOCKLY_CLEANUP: {
        id: 'blockly.cleanup',
        defaultKey: 'c',
        scope: 'blockly',
        blocklyName: 'cleanup',
    },
    BLOCKLY_DISCONNECT: {
        id: 'blockly.disconnect',
        defaultKey: 'shift+x',
        scope: 'blockly',
        blocklyName: 'disconnect',
    },
    COLLAPSE_OTHER_CATEGORIES: {
        id: 'blockly.collapseOtherCategories',
        defaultKey: 'mod+shift+o',
        scope: 'blockly',
        blocklyName: 'collapseOtherCategories',
    },
    WORKSPACE_SEARCH: {
        id: 'blockly.workspaceSearch',
        defaultKey: 'mod+f',
        scope: 'blockly',
    },
    SWITCH_TAB_TARGET: {
        id: 'tabs.switchTab.target',
        defaultKey: 'mod+1',
        scope: 'global',
    },
    SWITCH_TAB_ADDON: {
        id: 'tabs.switchTab.addon',
        defaultKey: 'mod+2',
        scope: 'global',
    },
    SWITCH_TAB_DEBUG: {
        id: 'tabs.switchTab.debug',
        defaultKey: 'mod+3',
        scope: 'global',
    },
    QUICK_OPEN: {
        id: 'quickOpen.open',
        defaultKey: 'mod+p',
        scope: 'global',
    },
    QUICK_OPEN_COMMAND: {
        id: 'quickOpen.openCommand',
        defaultKey: 'mod+shift+p',
        scope: 'global',
    },
    QUICK_OPEN_NEXT_TAB: {
        id: 'tabs.quickOpenNext',
        defaultKey: 'mod+tab',
        scope: 'global',
    },
    QUICK_OPEN_PREV_TAB: {
        id: 'tabs.quickOpenPrev',
        defaultKey: 'mod+shift+tab',
        scope: 'global',
    },
} as const satisfies Record<string, ShortcutDefinition>;

export type ShortcutIds = (typeof SHORTCUTS)[keyof typeof SHORTCUTS]['id'];
export type ResolvedShortcutDefinition = ShortcutDefinition & { id: ShortcutIds };

export type ShortcutCommand = (
    event: Mousetrap.ExtendedKeyboardEvent,
    combo: string,
) => void | Promise<void>;

export type ShortcutCommands = Partial<Record<ShortcutIds, ShortcutCommand>>;

export type SetShortcutResult =
    { ok: true } | { ok: false; reason: 'empty' | 'conflict'; conflictWith?: ShortcutIds };

export interface ShortcutChangeEvent {
    id: ShortcutIds;
    scope: ShortcutDefinition['scope'];
    oldKey: string | undefined;
    newKey: string | undefined;
}

export type ShortcutChangeListener = (event: ShortcutChangeEvent) => void;

export interface IShortcut {
    readonly shortcuts: ReadonlyMap<ShortcutIds, ResolvedShortcutDefinition>;
    registerSettings(): void;
    bindCommands(commands: ShortcutCommands): () => void;
    getDefinition(id: ShortcutIds): ResolvedShortcutDefinition;
    getDefinitions(): readonly ResolvedShortcutDefinition[];
    getDefaultHotKey(id: ShortcutIds): string;
    getHotKey(id: ShortcutIds): string;
    formatHotKey(key: string): string;
    setHotKey(id: ShortcutIds, hotKey: string): SetShortcutResult;
    resetHotKey(id: ShortcutIds): void;
    onChange(listener: ShortcutChangeListener): () => void;
}

// toastManager

export interface IToastManger {
    /**
     * 创建一个通知
     * 并返回是否创建成功
     */
    create(meta: IToast): boolean;
    emit(data: TToastEvent): void;
    on(id: string, callback: (data: TToastEvent) => void, opts?: { once?: boolean }): () => void;
    off(id: string): void;
    /**
     * 当前活跃的通知（未归档）
     */
    getAllHistory(): ReadonlyMap<string, IToast>;
    /**
     * 完整历史（活跃 + 已归档），按 createdAt 倒序
     */
    getFullHistory(): IToast[];
    /**
     * 删除一个通知（程序移除，不会触发 action）
     * 归档到完整历史中
     * @param id 通知id
     * @returns 是否成功删除
     */
    removeToast(id: string): boolean;
    /**
     * 用户点击通知时调用，会触发 action 并归档
     * @returns 是否成功（通知存在时为 true）
     */
    interact(id: string): boolean;
    /**
     * 仅触发 action，不归档（供历史面板使用）
     * @returns 是否成功
     */
    trigger(id: string): boolean;
    /**
     * 设置 progress 类型通知的进度
     * @returns 是否成功
     */
    setProgress(id: string, progress: number): boolean;
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
    action?(result: boolean): void;
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
    callback?(data: TToastEvent): void;
    once?: boolean;
    id: string;
}
