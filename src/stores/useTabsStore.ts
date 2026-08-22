import { create, type UseBoundStore, type StoreApi } from 'zustand';
import type { TTargetMode } from '../types/vm';

export interface Tab {
    id: string;
    targetId: string;
    title: string;
    mode: TTargetMode;
    type: 'blockly';
    modified: boolean;
}

interface ITabsStore {
    tabs: Tab[];
    activeTabId: string | null;
    tabOrder: string[];
    openTab: (targetId: string, title: string, mode: TTargetMode) => void;
    closeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    reorderTabs: (fromIndex: number, toIndex: number) => void;
    markModified: (id: string, modified: boolean) => void;
}

const useTabsStore: UseBoundStore<StoreApi<ITabsStore>> = create<ITabsStore>((set, get) => ({
    tabs: [],
    activeTabId: null,
    tabOrder: [],
    openTab: (targetId, title, mode) => {
        const { tabs, tabOrder } = get();
        const existing = tabs.find(t => t.targetId === targetId);
        if (existing) {
            set({ activeTabId: existing.id });
            return;
        }
        const id = targetId;
        const newTab: Tab = { id, targetId, title, mode, type: 'blockly', modified: false };
        set({
            tabs: [...tabs, newTab],
            tabOrder: [...tabOrder, id],
            activeTabId: id,
        });
    },
    closeTab: id => {
        const { tabs, tabOrder, activeTabId } = get();
        const idx = tabOrder.indexOf(id);
        const nextTabs = tabs.filter(t => t.id !== id);
        const nextOrder = tabOrder.filter(t => t !== id);
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
        set({ tabs: nextTabs, tabOrder: nextOrder, activeTabId: nextActive });
    },
    setActiveTab: id => {
        set({ activeTabId: id });
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
