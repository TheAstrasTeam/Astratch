import type { JSX } from 'react/jsx-runtime';
import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { spawnRandomString } from '../utils/ash-data';

type ISideTab =
    | {
          id: string;
          mode: 'split';
      }
    | {
          id: string;
          title: string;
          icon: string; // 图片
          dom: JSX.Element;
          mode: 'tab';
      };

type TSideTabMeta =
    | {
          id?: string;
          mode: 'split';
      }
    | {
          id?: string;
          title: string;
          icon: string;
          dom: JSX.Element;
          mode?: 'tab';
      };

interface ISideTabsStore {
    tabs: Map<string, ISideTab>;
    activeTabId: string;
    openTab: (id: string) => void;
    /** 返回新Tab的ID */
    newTab: (meta: TSideTabMeta) => string;
    removeTab: (id: string) => void;
}

const useSideTabsStore: UseBoundStore<StoreApi<ISideTabsStore>> = create<ISideTabsStore>(
    (set, get) => ({
        tabs: new Map(),
        activeTabId: '',
        openTab: (id: string) => {
            const { tabs } = get();
            if (!tabs.has(id)) return;
            set({
                activeTabId: id,
            });
        },
        newTab: (meta: TSideTabMeta) => {
            const { tabs } = get();
            const id = meta.id ?? spawnRandomString();
            const metaResult: ISideTab =
                meta.mode === 'split' ? { id, mode: 'split' } : { ...meta, id, mode: 'tab' };
            if (id) if (tabs.has(id)) return '';
            set({
                tabs: tabs.set(id, metaResult),
            });
            return metaResult.id;
        },
        removeTab: (id: string) => {
            const { tabs } = get();
            if (!tabs.has(id)) return;
            const newTabs = new Map(tabs);
            newTabs.delete(id);
            set({ tabs: newTabs });
        },
    }),
);

export { useSideTabsStore, type ISideTab, type ISideTabsStore };
