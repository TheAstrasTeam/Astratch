// 此文件由AI生成
/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import Folder from '../../src/vm/runtime/folder';
import { events } from '../../src/types/vm';

describe('Folder.fromJSON', () => {
    it('应该从纯对象还原文件夹并带方法', () => {
        const folder = Folder.fromJSON(
            { id: 'f1', name: '角色', color: '#0099ff', parentID: null },
            vi.fn(),
        );
        expect(folder.id).toBe('f1');
        expect(folder.name).toBe('角色');
        expect(folder.color).toBe('#0099ff');
        expect(folder.parentID).toBeNull();
        expect('rename' in folder).toBe(true);
    });

    it('缺失字段时使用默认值', () => {
        const folder = Folder.fromJSON(
            // @ts-expect-error 检测需要忽略
            {
                id: 'f1',
            },
            vi.fn(),
        );
        expect(folder.name).toBe('');
        expect(folder.color).toBe('#000000');
        expect(folder.parentID).toBeNull();
    });
});

describe('Folder.rename', () => {
    it('应该更新名字并发出UPDATE_TARGET_STRUCTURE事件', () => {
        const emit = vi.fn();
        const folder = Folder.fromJSON(
            {
                id: 'f1',
                name: '',
                color: '',
                parentID: null,
            },
            emit,
        );
        folder.rename('新名字');
        expect(folder.name).toBe('新名字');
        expect(emit).toHaveBeenCalledWith(events.UPDATE_TARGET_STRUCTURE);
    });
});

describe('Folder.setColor', () => {
    it('应该更新颜色并发出事件', () => {
        const emit = vi.fn();
        const folder = Folder.fromJSON(
            {
                id: 'f1',
                name: '',
                color: '',
                parentID: null,
            },
            emit,
        );
        folder.setColor('#ff0000');
        expect(folder.color).toBe('#ff0000');
        expect(emit).toHaveBeenCalledWith(events.UPDATE_TARGET_STRUCTURE);
    });
});

describe('Folder.setParent', () => {
    it('应该更新parentID并发出事件', () => {
        const emit = vi.fn();
        const folder = Folder.fromJSON(
            {
                id: 'f1',
                name: '',
                color: '',
                parentID: null,
            },
            emit,
        );
        folder.setParent('f2');
        expect(folder.parentID).toBe('f2');
        expect(emit).toHaveBeenCalledWith(events.UPDATE_TARGET_STRUCTURE);
    });
});

describe('Folder.cloneAsNode', () => {
    it('应该保留原型（方法可用）并带type字段', () => {
        const folder = Folder.fromJSON(
            {
                id: 'f1',
                name: '角色',
                color: '',
                parentID: null,
            },
            vi.fn(),
        );
        const node = folder.cloneAsNode();
        expect(node).toBeInstanceOf(Folder);
        expect(node.type).toBe('folder');
        expect(node.id).toBe('f1');
        expect(node.rename).toBeTypeOf('function');
        // 浅拷贝：基本类型互不影响，但节点自身可用方法
        node.rename('改名');
        expect(node.name).toBe('改名');
        expect(folder.name).toBe('角色');
    });
});
