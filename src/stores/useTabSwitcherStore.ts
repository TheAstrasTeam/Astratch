/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// Ctrl+Tab 快速切换浮层的会话状态（与 QuickOpen 解耦）。
// entries 是按下组合键那一刻的 MRU 快照（队首 = 最近激活），
// index 是当前高亮的条目；提交时才真正调用 setActiveTab。

import { create, type UseBoundStore, type StoreApi } from 'zustand';

interface ITabSwitcherStore {
    isOpen: boolean;
    entries: string[];
    index: number;
    /**
     * 开始一次切换会话
     * @param entries MRU 快照，要求至少一个条目
     * @param backward true 表示反向（Ctrl+Shift+Tab），初始高亮队尾而非第 2 位
     */
    beginSession: (entries: string[], backward: boolean) => void;
    /** 循环移动高亮，delta 为 1（下一个）或 -1（上一个） */
    move: (delta: number) => void;
    /** 关闭浮层并清空会话 */
    reset: () => void;
}

const useTabSwitcherStore: UseBoundStore<StoreApi<ITabSwitcherStore>> = create<ITabSwitcherStore>(
    set => ({
        isOpen: false,
        entries: [],
        index: 0,
        beginSession: (entries, backward) => {
            if (entries.length === 0) return;
            // 正向默认高亮“上一次使用的标签”（MRU 第 2 位）；只有一个标签时保持自身；
            // 反向则从队尾开始往回循环。
            const nextIndex = backward ? entries.length - 1 : Math.min(1, entries.length - 1);
            set({ isOpen: true, entries, index: nextIndex });
        },
        move: delta => {
            set(state => {
                if (!state.isOpen || state.entries.length === 0) return state;
                const count = state.entries.length;
                const nextIndex = (((state.index + delta) % count) + count) % count;
                return { index: nextIndex };
            });
        },
        reset: () => {
            set({ isOpen: false, entries: [], index: 0 });
        },
    }),
);

export { useTabSwitcherStore };
