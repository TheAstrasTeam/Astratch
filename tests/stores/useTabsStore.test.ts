// 此文件由AI生成
/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { useTabsStore } from '../../src/stores/useTabsStore';
import { TargetModes } from '../../src/types/vm/vm';

const open = (id: string, title: string) => {
    useTabsStore.getState().openTab(id, title, TargetModes.ENTITY);
};

describe('useTabsStore 的 MRU 维护', () => {
    beforeEach(() => {
        useTabsStore.getState().closeAllTabs();
    });

    it('新开标签按激活顺序进入 MRU 队首', () => {
        open('a', 'A');
        open('b', 'B');
        open('c', 'C');
        expect(useTabsStore.getState().mruTabIds).toEqual(['c', 'b', 'a']);
        expect(useTabsStore.getState().activeTabId).toBe('c');
        // 视觉顺序不受 MRU 影响
        expect(useTabsStore.getState().tabOrder).toEqual(['a', 'b', 'c']);
    });

    it('openTab 已存在目标时仅激活并移到 MRU 队首', () => {
        open('a', 'A');
        open('b', 'B');
        open('a', 'A');
        expect(useTabsStore.getState().tabs).toHaveLength(2);
        expect(useTabsStore.getState().mruTabIds).toEqual(['a', 'b']);
        expect(useTabsStore.getState().activeTabId).toBe('a');
    });

    it('setActiveTab 将标签移到 MRU 队首', () => {
        open('a', 'A');
        open('b', 'B');
        open('c', 'C');
        useTabsStore.getState().setActiveTab('a');
        expect(useTabsStore.getState().mruTabIds).toEqual(['a', 'c', 'b']);
    });

    it('closeTab 从 MRU 移除且不影响其余顺序', () => {
        open('a', 'A');
        open('b', 'B');
        open('c', 'C');
        useTabsStore.getState().closeTab('a');
        expect(useTabsStore.getState().mruTabIds).toEqual(['c', 'b']);
    });

    it('关闭非当前激活的标签不改变 activeTabId', () => {
        open('a', 'A');
        open('b', 'B');
        useTabsStore.getState().setActiveTab('a');
        useTabsStore.getState().closeTab('b');
        expect(useTabsStore.getState().activeTabId).toBe('a');
        expect(useTabsStore.getState().mruTabIds).toEqual(['a']);
    });

    it('closeOtherTabs 与 closeAllTabs 清理 MRU', () => {
        open('a', 'A');
        open('b', 'B');
        open('c', 'C');
        useTabsStore.getState().closeOtherTabs('b');
        expect(useTabsStore.getState().mruTabIds).toEqual(['b']);

        useTabsStore.getState().closeAllTabs();
        expect(useTabsStore.getState().mruTabIds).toEqual([]);
        expect(useTabsStore.getState().tabs).toHaveLength(0);
    });
});
