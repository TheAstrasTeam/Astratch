/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { create, type UseBoundStore, type StoreApi } from 'zustand';
import type { TTargetMode } from '../types/vm/vm';

export interface Tab {
    id: string;
    targetId: string;
    title: string;
    mode: TTargetMode;
    type: 'blockly';
    modified: boolean;
}

// 将 id 移动到 MRU 数组队首（不存在则插入，已存在则去重后前置）
const moveToFront = (arr: readonly string[], id: string): string[] => [
    id,
    ...arr.filter(item => item !== id),
];

interface ITabsStore {
    tabs: Tab[];
    activeTabId: string | null;
    tabOrder: string[];
    /** 最近使用顺序（队首 = 最近激活），供 Ctrl+Tab 快速切换使用 */
    mruTabIds: string[];
    openTab: (targetId: string, title: string, mode: TTargetMode) => void;
    closeTab: (id: string) => void;
    closeOtherTabs: (id: string) => void;
    closeAllTabs: () => void;
    setActiveTab: (id: string) => void;
    reorderTabs: (fromIndex: number, toIndex: number) => void;
    markModified: (id: string, modified: boolean) => void;
}

const useTabsStore: UseBoundStore<StoreApi<ITabsStore>> = create<ITabsStore>((set, get) => ({
    tabs: [],
    activeTabId: null,
    tabOrder: [],
    mruTabIds: [],
    openTab: (targetId, title, mode) => {
        const { tabs, tabOrder, mruTabIds } = get();
        const existing = tabs.find(t => t.targetId === targetId);
        if (existing) {
            set({ activeTabId: existing.id, mruTabIds: moveToFront(mruTabIds, existing.id) });
            return;
        }
        const id = targetId;
        const newTab: Tab = { id, targetId, title, mode, type: 'blockly', modified: false };
        set({
            tabs: [...tabs, newTab],
            tabOrder: [...tabOrder, id],
            mruTabIds: moveToFront(mruTabIds, id),
            activeTabId: id,
        });
    },
    closeTab: id => {
        const { tabs, tabOrder, activeTabId, mruTabIds } = get();
        const idx = tabOrder.indexOf(id);
        const nextTabs = tabs.filter(t => t.id !== id);
        const nextOrder = tabOrder.filter(t => t !== id);
        const nextMru = mruTabIds.filter(t => t !== id);
        let nextActive = activeTabId;
        if (activeTabId === id) {
            if (nextOrder.length === 0) {
                nextActive = null;
            } else if (idx < nextOrder.length) {
                nextActive = nextOrder[idx];
            } else {
                nextActive = nextOrder[nextOrder.length - 1];
            }
        }
        set({
            tabs: nextTabs,
            tabOrder: nextOrder,
            mruTabIds: nextMru,
            activeTabId: nextActive,
        });
    },
    closeOtherTabs: id => {
        const { tabs } = get();
        const needKeepTab = tabs.find(t => t.id == id);
        if (!needKeepTab) return;
        set({
            tabs: [needKeepTab],
            tabOrder: [id],
            mruTabIds: [id],
            activeTabId: id,
        });
    },
    closeAllTabs: () => {
        set({
            tabs: [],
            tabOrder: [],
            mruTabIds: [],
            activeTabId: null,
        });
    },
    setActiveTab: id => {
        set({ activeTabId: id, mruTabIds: moveToFront(get().mruTabIds, id) });
    },
    reorderTabs: (fromIndex, toIndex) => {
        const { tabOrder } = get();
        const next = [...tabOrder];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        set({ tabOrder: next });
    },
    markModified: (id, modified) => {
        const { tabs } = get();
        set({
            tabs: tabs.map(t => (t.id === id ? { ...t, modified } : t)),
        });
    },
}));

export { useTabsStore };
