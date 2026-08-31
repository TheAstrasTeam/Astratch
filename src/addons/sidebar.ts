/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/** @author AI */

// 侧边栏标签页注册表：保存插件动态注册的侧边栏标签页。
// 内置标签页（targets / assets / addons / debug）是静态的，不经过本 store。
// 每条记录带 owner（插件 ID），插件禁用/卸载时按 owner 批量注销。

import { create, type UseBoundStore, type StoreApi } from 'zustand';

export interface IAddonSidebarTabDefinition {
    /** 标签页唯一 ID（由管理器自动加插件前缀） */
    id: string;
    /** 归属插件 ID */
    owner: string;
    /** 标签页标题：字符串或返回字符串的函数 */
    title: string | (() => string);
    /** 标签页图标：SVG 字符串 */
    icon: string;
    /** 标签页内容：返回 DOM 元素的函数 */
    content: () => HTMLElement;
}

interface ISidebarTabsStore {
    /** 已注册的标签页：完整 ID → 定义 */
    tabs: Map<string, IAddonSidebarTabDefinition>;
}

interface ISidebarTabsActions {
    /**
     * 注册一个侧边栏标签页
     * @param owner 归属插件 ID
     * @param tab 标签页定义（id 无需带插件前缀）
     * @returns 注销函数
     */
    registerTab: (owner: string, tab: Omit<IAddonSidebarTabDefinition, 'id' | 'owner'> & { id: string }) => () => void;
    /** 按 ID 注销单个标签页 */
    unregisterTab: (id: string) => void;
    /** 注销某个插件注册的全部标签页 */
    unregisterByOwner: (owner: string) => void;
}

const useSidebarTabsStore: UseBoundStore<
    StoreApi<ISidebarTabsStore & ISidebarTabsActions>
> = create<ISidebarTabsStore & ISidebarTabsActions>((set, get) => ({
    tabs: new Map<string, IAddonSidebarTabDefinition>(),
    registerTab: (owner, tab) => {
        const fullId = `${owner}.${tab.id}`;
        set(state => {
            const next = new Map(state.tabs);
            next.set(fullId, { ...tab, id: fullId, owner });
            return { tabs: next };
        });
        return () => {
            get().unregisterTab(fullId);
        };
    },
    unregisterTab: id => {
        set(state => {
            if (!state.tabs.has(id)) return state;
            const next = new Map(state.tabs);
            next.delete(id);
            return { tabs: next };
        });
    },
    unregisterByOwner: owner => {
        set(state => {
            const next = new Map(state.tabs);
            let changed = false;
            for (const [id, record] of next) {
                if (record.owner === owner) {
                    next.delete(id);
                    changed = true;
                }
            }
            return changed ? { tabs: next } : state;
        });
    },
}));

export { useSidebarTabsStore };
