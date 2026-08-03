/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// Targets 面板的 UI 状态管理
// 什么你问我为什么放这里？这玩意默认是全部收起的！

import { create, type UseBoundStore, type StoreApi } from 'zustand';

const useTargetsStore: UseBoundStore<
    StoreApi<{
        expandedFolders: Set<string>;
        toggleFolder: (id: string) => void;
    }>
> = create(set => ({
    expandedFolders: new Set<string>(),
    toggleFolder: (id: string) => {
        set(state => {
            const next = new Set(state.expandedFolders);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return { expandedFolders: next };
        });
    },
}));

export { useTargetsStore };
