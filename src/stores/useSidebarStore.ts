/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// 编辑器左侧边栏的选中面板状态。
// 从 WorkSpace 组件的局部 state 提升而来，
// 让快捷键、QuickOpen 命令等外部调用方也能切换面板。

import { create, type UseBoundStore, type StoreApi } from 'zustand';
import { allBuiltInTabs } from '../types/vm/vm';

interface ISidebarStore {
    /** 当前选中的侧边栏面板（内置标签页 ID 或插件标签页 ID） */
    selectedTab: string;
    select: (id: string) => void;
}

const useSidebarStore: UseBoundStore<StoreApi<ISidebarStore>> = create<ISidebarStore>(set => ({
    selectedTab: allBuiltInTabs.TARGETS,
    select: selectedTab => {
        set({ selectedTab });
    },
}));

export { useSidebarStore };
