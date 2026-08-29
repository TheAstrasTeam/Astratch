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

describe('useTabsStore 的内置页面标签（openSpecialTab）', () => {
    beforeEach(() => {
        useTabsStore.getState().closeAllTabs();
    });

    it('打开欢迎标签：创建单例并激活', () => {
        useTabsStore.getState().openSpecialTab('welcome');
        const { tabs, activeTabId } = useTabsStore.getState();
        expect(tabs).toHaveLength(1);
        expect(tabs[0].type).toBe('welcome');
        expect(tabs[0].id).toBe('welcome');
        expect(activeTabId).toBe('welcome');
    });

    it('重复打开同一内置标签不会重复创建，仅激活', () => {
        useTabsStore.getState().openSpecialTab('welcome');
        useTabsStore.getState().openSpecialTab('create_project');
        useTabsStore.getState().openSpecialTab('welcome');
        const { tabs, activeTabId } = useTabsStore.getState();
        expect(tabs).toHaveLength(2);
        expect(activeTabId).toBe('welcome');
        expect(useTabsStore.getState().mruTabIds[0]).toBe('welcome');
    });

    it('内置标签与 blockly 标签可共存', () => {
        useTabsStore.getState().openSpecialTab('welcome');
        open('a', 'A');
        expect(useTabsStore.getState().tabs.map(t => t.type)).toEqual(['welcome', 'blockly']);
    });

    it('返回流程：关闭 create_project 后重新打开 welcome', () => {
        useTabsStore.getState().openSpecialTab('welcome');
        useTabsStore.getState().openSpecialTab('create_project');
        // 模拟创建项目页“返回”：关闭 create_project 并重新打开 welcome
        useTabsStore.getState().closeTab('create_project');
        useTabsStore.getState().openSpecialTab('welcome');
        const { tabs, activeTabId } = useTabsStore.getState();
        expect(tabs.map(t => t.id)).toEqual(['welcome']);
        expect(activeTabId).toBe('welcome');
    });

    it('关闭内置标签后 MRU 同步清理', () => {
        useTabsStore.getState().openSpecialTab('welcome');
        useTabsStore.getState().openSpecialTab('create_project');
        useTabsStore.getState().closeTab('welcome');
        const { tabs, mruTabIds } = useTabsStore.getState();
        expect(tabs.map(t => t.id)).toEqual(['create_project']);
        expect(mruTabIds).toEqual(['create_project']);
    });

    it('closeSpecialTabs 关闭全部内置页面标签，保留 blockly 标签', () => {
        useTabsStore.getState().openSpecialTab('welcome');
        useTabsStore.getState().openSpecialTab('create_project');
        open('a', 'A');
        useTabsStore.getState().closeSpecialTabs();
        const { tabs, activeTabId } = useTabsStore.getState();
        expect(tabs.map(t => t.type)).toEqual(['blockly']);
        expect(tabs.map(t => t.id)).toEqual(['a']);
        expect(activeTabId).toBe('a');
    });

    it('closeSpecialTabs 在无内置标签时不做任何事', () => {
        open('a', 'A');
        useTabsStore.getState().closeSpecialTabs();
        const { tabs, activeTabId } = useTabsStore.getState();
        expect(tabs.map(t => t.id)).toEqual(['a']);
        expect(activeTabId).toBe('a');
    });
});
