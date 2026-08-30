/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { create, type UseBoundStore, type StoreApi } from 'zustand';
import { TargetModes, type TTargetMode } from '../types/vm/vm';
import { SPECIAL_TAB_META, type TSpecialTabType, type TTabType } from '../tabs/tabTypes';

export interface Tab {
    id: string;
    /** blockly 标签对应的目标 id；内置页面标签不使用 */
    targetId: string;
    title: string;
    /** 目标模式，仅 type === 'blockly' 时有效；内置页面标签为占位值 */
    mode: TTargetMode;
    type: TTabType;
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
    /** 打开（或激活）内置页面标签（welcome/create_project）。单例 */
    openSpecialTab: (type: TSpecialTabType) => void;
    closeTab: (id: string) => void;
    closeOtherTabs: (id: string) => void;
    closeAllTabs: () => void;
    /** 关闭所有内置页面标签（welcome/create_project），保留 blockly 标签 */
    closeSpecialTabs: () => void;
    setActiveTab: (id: string) => void;
    reorderTabs: (fromIndex: number, toIndex: number) => void;
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
        const newTab: Tab = { id, targetId, title, mode, type: 'blockly' };
        set({
            tabs: [...tabs, newTab],
            tabOrder: [...tabOrder, id],
            mruTabIds: moveToFront(mruTabIds, id),
            activeTabId: id,
        });
    },
    openSpecialTab: type => {
        const { tabs, tabOrder, mruTabIds } = get();
        const meta = SPECIAL_TAB_META[type];
        const id = meta.id;
        const existing = tabs.find(t => t.id === id);
        if (existing) {
            set({ activeTabId: existing.id, mruTabIds: moveToFront(mruTabIds, existing.id) });
            return;
        }
        const newTab: Tab = {
            id,
            targetId: '',
            title: meta.titleKey,
            mode: TargetModes.ENTITY,
            type,
        };
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
    closeSpecialTabs: () => {
        const { tabs, tabOrder, activeTabId, mruTabIds } = get();
        const special = tabs.filter(t => t.type !== 'blockly');
        if (special.length === 0) return;
        const ids = new Set(special.map(t => t.id));
        const nextTabs = tabs.filter(t => !ids.has(t.id));
        const nextOrder = tabOrder.filter(id => !ids.has(id));
        const nextMru = mruTabIds.filter(id => !ids.has(id));
        let nextActive = activeTabId;
        if (activeTabId !== null && ids.has(activeTabId)) {
            if (nextOrder.length === 0) {
                nextActive = null;
            } else {
                const idx = tabOrder.indexOf(activeTabId);
                nextActive =
                    idx < nextOrder.length ? nextOrder[idx] : nextOrder[nextOrder.length - 1];
            }
        }
        set({ tabs: nextTabs, tabOrder: nextOrder, mruTabIds: nextMru, activeTabId: nextActive });
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
}));

export { useTabsStore };
