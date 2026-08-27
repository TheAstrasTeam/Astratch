/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 

// QuickOpen 搜索面板的状态（纯搜索面板，与 Ctrl+Tab 快速切换解耦）。
// 通过 mod+p 或点击菜单栏搜索框打开；输入框可编辑，query 实时过滤 Target / 命令。
// Ctrl+Tab 的“按住循环、松开提交”语义由独立的 TabSwitcher 负责。

import { create, type UseBoundStore, type StoreApi } from 'zustand';

interface IQuickOpenStore {
    isOpen: boolean;
    /** 搜索词，`>` 前缀表示命令模式 */
    query: string;
    /** 当前高亮条目在结果列表中的下标 */
    index: number;
    /** 打开面板。重复打开保留已输入的 query */
    open: () => void;
    /** 关闭面板并清空状态 */
    close: () => void;
    /** 设置搜索词并重置高亮 */
    setQuery: (query: string) => void;
    /** 循环移动高亮，delta 为 1（下一个）或 -1（上一个）；count 为当前列表长度 */
    move: (delta: number, count: number) => void;
    /** 高亮直接跳到某一下标（鼠标悬停用） */
    setIndex: (index: number) => void;
}

const INITIAL = {
    isOpen: false,
    query: '',
    index: 0,
};

const useQuickOpenStore: UseBoundStore<StoreApi<IQuickOpenStore>> = create<IQuickOpenStore>(
    set => ({
        ...INITIAL,
        // 重复打开（已打开时再按 mod+p / 再点搜索框）保留已输入的 query
        open: () => {
            set({ isOpen: true, index: 0 });
        },
        close: () => {
            set({ ...INITIAL });
        },
        setQuery: query => {
            set({ query, index: 0 });
        },
        // count 由调用方传入当前列表长度：store 不持有过滤结果，无法自行计算
        move: (delta, count) => {
            set(state => {
                if (count === 0) return state;
                const nextIndex = (((state.index + delta) % count) + count) % count;
                return { index: nextIndex };
            });
        },
        setIndex: index => {
            set({ index });
        },
    }),
);

export { useQuickOpenStore };
