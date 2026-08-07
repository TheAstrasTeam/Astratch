// 此文件由AI生成
/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import Runtime from '../../src/vm/runtime/runtime';
import { events } from '../../src/types/vm';
import { sendError } from '../../src/utils/debug';
import type { IVM, IFS, TTargetTreeNode } from '../../src/types/vm';
import type { IWorkspaceState } from '../../src/types/blocks';

// Runtime 依赖 Blockly 工作区管理，测试只关心数据逻辑，直接替换为桩类
vi.mock('../../src/vm/runtime/blocks', () => ({
    default: vi.fn(),
}));

// sendError 的默认类型是 'error' 会抛出，'warn' 只警告；
// 这里模拟同样的行为，避免测试依赖 Toast
vi.mock('../../src/utils/debug', () => ({
    sendError: vi.fn((error: unknown, type: 'error' | 'warn' = 'error') => {
        if (type === 'warn') return;
        throw error instanceof Error ? error : new Error(String(error));
    }),
}));

function makeVM() {
    const handlers = new Map<string, ((data: object) => void)[]>();
    const vm = {
        on: vi.fn((id: string, callback: (data: object) => void) => {
            const list = handlers.get(id) ?? [];
            list.push(callback);
            handlers.set(id, list);
        }),
        off: vi.fn(),
        emit: vi.fn((id: string, data?: object) => {
            handlers.get(id)?.forEach(callback => {
                callback(data ?? {});
            });
        }),
    };
    return { vm: vm as unknown as IVM, handlers };
}

function makeRuntime() {
    const { vm, handlers } = makeVM();
    const runtime = new Runtime(vm);
    return { runtime, vm, handlers };
}

function makeFolder(id: string, parentID: string | null = null, name = id): IFS {
    return { id, name, color: '#000000', parentID };
}

describe('createTarget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该创建target并自动生成id', () => {
        const { runtime } = makeRuntime();
        runtime.createTarget({ name: 'sprite' });
        const targets = [...runtime.targets.values()];
        expect(targets).toHaveLength(1);
        expect(targets[0].id).toBeTruthy();
        expect(targets[0].name).toBe('sprite');
        expect(targets[0].mode).toBe('entity');
        expect(targets[0].parentID).toBeNull();
    });

    it('应该使用传入的id/parent/mode', () => {
        const { runtime } = makeRuntime();
        runtime.createTarget({ id: 'custom-id', name: 'module', mode: 'module', parent: 'f1' });
        const target = runtime.getTargetByID('custom-id');
        expect(target?.name).toBe('module');
        expect(target?.mode).toBe('module');
        expect(target?.parentID).toBe('f1');
    });

    it('entity模式的target应该合并默认实体信息', () => {
        const { runtime } = makeRuntime();
        runtime.createTarget({ name: 'sprite', mode: 'entity' });
        const target = [...runtime.targets.values()][0];
        expect(target.size).toBe(runtime.DEFAULT_ENTITYINFO.size);
        expect(target.direction).toBe(runtime.DEFAULT_ENTITYINFO.direction);
        expect(target.volume).toBe(runtime.DEFAULT_ENTITYINFO.volume);
        expect(target.effects).toEqual(runtime.DEFAULT_ENTITYINFO.effects);
    });

    it('module模式的target不应包含实体信息', () => {
        const { runtime } = makeRuntime();
        runtime.createTarget({ name: 'module', mode: 'module' });
        const target = [...runtime.targets.values()][0];
        expect(target.size).toBeUndefined();
        expect(target.effects).toBeUndefined();
    });

    it('创建后应该发出UPDATE_PROJECT与UPDATE_TARGET_STRUCTURE事件', () => {
        const { runtime, vm } = makeRuntime();
        runtime.createTarget({ name: 'sprite' });
        expect(vi.mocked(vm.emit)).toHaveBeenCalledWith(events.UPDATE_PROJECT);
        expect(vi.mocked(vm.emit)).toHaveBeenCalledWith(events.UPDATE_TARGET_STRUCTURE);
    });

    it('默认创建后切换为编辑目标', () => {
        const { runtime, vm } = makeRuntime();
        runtime.createTarget({ name: 'sprite' });
        expect(runtime.editingTargetID).toBe([...runtime.targets.keys()][0]);
        expect(vi.mocked(vm.emit)).toHaveBeenCalledWith(events.SWITCH_TARGET);
    });

    it('switchTo=false时不切换编辑目标', () => {
        const { runtime } = makeRuntime();
        runtime.createTarget({ name: 'sprite' }, false);
        expect(runtime.editingTargetID).toBe('');
    });

    it('创建多个target时互不影响（默认模板是深拷贝）', () => {
        const { runtime } = makeRuntime();
        runtime.createTarget({ name: 'a' });
        runtime.createTarget({ name: 'b' });
        const [a, b] = [...runtime.targets.values()];
        a.name = 'changed';
        a.blocks._script.push('x');
        expect(b.name).toBe('b');
        expect(b.blocks._script).toEqual([]);
        expect(runtime.DEFAULT_TARGETINFO.name).toBe('');
        expect(runtime.DEFAULT_TARGETINFO.blocks._script).toEqual([]);
    });
});

describe('switchTarget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该更新编辑目标并发出SWITCH_TARGET事件', () => {
        const { runtime, vm } = makeRuntime();
        runtime.createTarget({ id: 'a' });
        runtime.createTarget({ id: 'b' });
        runtime.switchTarget('a');
        expect(runtime.editingTargetID).toBe('a');
        expect(vi.mocked(vm.emit)).toHaveBeenCalledWith(events.SWITCH_TARGET);
    });
});

describe('target读写', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getTargetByID应该返回target，不存在的返回undefined', () => {
        const { runtime } = makeRuntime();
        runtime.createTarget({ id: 'a' });
        expect(runtime.getTargetByID('a')?.id).toBe('a');
        expect(runtime.getTargetByID('missing')).toBeUndefined();
    });

    it('setTargetBlock应该更新工作区状态并发出UPDATE_PROJECT事件', () => {
        const { runtime, vm } = makeRuntime();
        runtime.createTarget({ id: 'a' });
        const state: IWorkspaceState = { blocks: { languageVersion: 0, blocks: [] } };
        runtime.setTargetBlock('a', state);
        expect(runtime.getTargetByID('a')?.blocks._workspace).toBe(state);
        expect(vi.mocked(vm.emit)).toHaveBeenCalledWith(events.UPDATE_PROJECT);
    });

    it('setTargetBlock在target不存在时应该抛出错误', () => {
        const { runtime } = makeRuntime();
        const state: IWorkspaceState = { blocks: { languageVersion: 0, blocks: [] } };
        expect(() => {
            runtime.setTargetBlock('missing', state);
        }).toThrow('Not found target "missing" in project.');
    });
});

describe('文件夹操作', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('addFolder', () => {
        it('应该将文件夹添加到对应模式并发出事件', () => {
            const { runtime, vm } = makeRuntime();
            runtime.addFolder('entity', makeFolder('f1', null, '角色'));
            expect(runtime.fs.get('entity')).toHaveLength(1);
            expect(runtime.fs.get('entity')?.[0]).toMatchObject({
                id: 'f1',
                name: '角色',
                parentID: null,
            });
            expect(runtime.fs.get('module')).toHaveLength(0);
            expect(vi.mocked(vm.emit)).toHaveBeenCalledWith(events.UPDATE_TARGET_STRUCTURE);
        });

        it('重复id应该报错且不添加', () => {
            const { runtime } = makeRuntime();
            runtime.addFolder('entity', makeFolder('f1'));
            expect(() => {
                runtime.addFolder('entity', makeFolder('f1'));
            }).toThrow();
            expect(runtime.fs.get('entity')).toHaveLength(1);
            expect(sendError).toHaveBeenCalled();
        });
    });

    describe('getFolderByID/getFolderParent/getFolderChildren/getFolderDescendants', () => {
        let runtime: Runtime;
        beforeEach(() => {
            runtime = makeRuntime().runtime;
            runtime.addFolder('entity', makeFolder('f1'));
            runtime.addFolder('entity', makeFolder('f2', 'f1'));
            runtime.addFolder('entity', makeFolder('f3', 'f1'));
            runtime.addFolder('entity', makeFolder('f4', 'f2'));
            runtime.addFolder('entity', makeFolder('f5'));
        });

        it('getFolderByID应该返回文件夹或null', () => {
            expect(runtime.getFolderByID('f2', 'entity')?.id).toBe('f2');
            expect(runtime.getFolderByID('missing', 'entity')).toBeNull();
        });

        it('getFolderParent应该返回父文件夹', () => {
            expect(runtime.getFolderParent('entity', 'f2')?.id).toBe('f1');
        });

        it('getFolderParent对顶层文件夹或不存在时返回null', () => {
            expect(runtime.getFolderParent('entity', 'f1')).toBeNull();
            expect(runtime.getFolderParent('entity', 'missing')).toBeNull();
        });

        it('getFolderChildren只返回直接子文件夹', () => {
            expect(runtime.getFolderChildren('entity', 'f1').map(f => f.id)).toEqual(['f2', 'f3']);
            expect(runtime.getFolderChildren('entity', null).map(f => f.id)).toEqual(['f1', 'f5']);
        });

        it('getFolderDescendants应该返回所有后代（不含自身）', () => {
            expect(
                runtime
                    .getFolderDescendants('entity', 'f1')
                    .map(f => f.id)
                    .sort(),
            ).toEqual(['f2', 'f3', 'f4']);
            expect(runtime.getFolderDescendants('entity', 'f4')).toEqual([]);
        });

        it('getFolderDescendants(null)应该返回所有文件夹', () => {
            expect(
                runtime
                    .getFolderDescendants('entity', null)
                    .map(f => f.id)
                    .sort(),
            ).toEqual(['f1', 'f2', 'f3', 'f4', 'f5']);
        });
    });

    describe('setFolderName/setFolderColor', () => {
        it('应该重命名文件夹并发出事件', () => {
            const { runtime, vm } = makeRuntime();
            runtime.addFolder('entity', makeFolder('f1'));
            runtime.setFolderName('entity', 'f1', '新名字');
            expect(runtime.getFolderByID('f1', 'entity')?.name).toBe('新名字');
            expect(vi.mocked(vm.emit)).toHaveBeenCalledWith(events.UPDATE_TARGET_STRUCTURE);
        });

        it('应该修改文件夹颜色', () => {
            const { runtime } = makeRuntime();
            runtime.addFolder('entity', makeFolder('f1'));
            runtime.setFolderColor('entity', 'f1', '#ff0000');
            expect(runtime.getFolderByID('f1', 'entity')?.color).toBe('#ff0000');
        });

        it('不存在的文件夹应该报错', () => {
            const { runtime } = makeRuntime();
            expect(() => {
                runtime.setFolderName('entity', 'missing', 'x');
            }).toThrow();
            expect(() => {
                runtime.setFolderColor('entity', 'missing', '#fff');
            }).toThrow();
            expect(sendError).toHaveBeenCalled();
        });
    });

    describe('removeFolderFolder', () => {
        it('应该级联删除文件夹及其中的target', () => {
            const { runtime } = makeRuntime();
            runtime.addFolder('entity', makeFolder('f1'));
            runtime.addFolder('entity', makeFolder('f2', 'f1'));
            runtime.addFolder('entity', makeFolder('f3', 'f2'));
            runtime.addFolder('entity', makeFolder('f4'));
            runtime.createTarget({ id: 't1', parent: 'f2' });
            runtime.createTarget({ id: 't2', parent: 'f3' });
            runtime.createTarget({ id: 't3' });
            runtime.createTarget({ id: 't4', parent: 'f4' });

            runtime.removeFolderFolder('entity', 'f2');

            expect(runtime.fs.get('entity')?.map(f => f.id)).toEqual(['f1', 'f4']);
            expect(runtime.getTargetByID('t1')).toBeUndefined();
            expect(runtime.getTargetByID('t2')).toBeUndefined();
            expect(runtime.getTargetByID('t3')).toBeDefined();
            expect(runtime.getTargetByID('t4')).toBeDefined();
        });

        it('不存在的文件夹不影响任何东西', () => {
            const { runtime } = makeRuntime();
            runtime.addFolder('entity', makeFolder('f1'));
            runtime.createTarget({ id: 't1' });
            runtime.removeFolderFolder('entity', 'missing');
            expect(runtime.fs.get('entity')?.map(f => f.id)).toEqual(['f1']);
            expect(runtime.getTargetByID('t1')).toBeDefined();
        });
    });
});

describe('generateTargetsTree', () => {
    const describeNode = (node: { type: string; id: string }) =>
        node.type === 'folder' ? `f:${node.id}` : `t:${node.id}`;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该生成包含顶层target和文件夹的树', () => {
        const { runtime } = makeRuntime();
        runtime.addFolder('entity', makeFolder('f1'));
        runtime.addFolder('entity', makeFolder('f2', 'f1'));
        runtime.addFolder('entity', makeFolder('f5', 'f1'));
        runtime.addFolder('entity', makeFolder('f6'));
        runtime.createTarget({ id: 'tTop' });
        runtime.createTarget({ id: 'tInF1', parent: 'f1' });
        runtime.createTarget({ id: 'tInF2', parent: 'f2' });
        runtime.createTarget({ id: 'tModule', mode: 'module' });

        const tree = runtime.generateTargetsTree('entity');

        // 顶层：target在前，文件夹在后
        expect(tree.map(describeNode)).toEqual(['t:tTop', 'f:f1', 'f:f6']);

        // 文件夹内：子文件夹在前，target在后
        const f1Node = tree.find(
            node => node.type === 'folder' && node.id === 'f1',
        ) as TTargetTreeNode;
        expect(f1Node.children.map(describeNode)).toEqual(['f:f2', 'f:f5', 't:tInF1']);

        const f2Node = f1Node.children.find(
            node => node.type === 'folder' && node.id === 'f2',
        ) as TTargetTreeNode;
        expect(f2Node.children.map(describeNode)).toEqual(['t:tInF2']);
    });

    it('module模式的target只在module树中出现', () => {
        const { runtime } = makeRuntime();
        runtime.createTarget({ id: 'tEntity' });
        runtime.createTarget({ id: 'tModule', mode: 'module' });

        expect(runtime.generateTargetsTree('entity').map(describeNode)).toEqual(['t:tEntity']);
        expect(runtime.generateTargetsTree('module').map(describeNode)).toEqual(['t:tModule']);
    });
});

describe('removeTarget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该删除target并发出事件', () => {
        const { runtime, vm } = makeRuntime();
        runtime.createTarget({ id: 'a' });
        expect(runtime.removeTarget('a')).toBe(true);
        expect(runtime.getTargetByID('a')).toBeUndefined();
        expect(vi.mocked(vm.emit)).toHaveBeenCalledWith(events.UPDATE_TARGET_STRUCTURE);
    });

    it('删除不存在的target返回false且不发出事件', () => {
        const { runtime, vm } = makeRuntime();
        runtime.createTarget({ id: 'a' });
        vi.mocked(vm.emit).mockClear();
        expect(runtime.removeTarget('missing')).toBe(false);
        expect(vi.mocked(vm.emit)).not.toHaveBeenCalled();
    });
});

describe('moveTarget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该移动target到文件夹下并发出事件', () => {
        const { runtime, vm } = makeRuntime();
        runtime.addFolder('entity', makeFolder('f1'));
        runtime.createTarget({ id: 'a' });
        expect(runtime.moveTarget('entity', 'a', 'f1')).toBe(true);
        expect(runtime.getTargetByID('a')?.parentID).toBe('f1');
        expect(vi.mocked(vm.emit)).toHaveBeenCalledWith(events.UPDATE_TARGET_STRUCTURE);
    });

    it('移动到顶层(null)成功', () => {
        const { runtime } = makeRuntime();
        runtime.addFolder('entity', makeFolder('f1'));
        runtime.createTarget({ id: 'a', parent: 'f1' });
        expect(runtime.moveTarget('entity', 'a', null)).toBe(true);
        expect(runtime.getTargetByID('a')?.parentID).toBeNull();
    });

    it('target不存在时返回false', () => {
        const { runtime } = makeRuntime();
        runtime.addFolder('entity', makeFolder('f1'));
        expect(runtime.moveTarget('entity', 'missing', 'f1')).toBe(false);
    });

    it('目标文件夹不存在时返回false且不修改', () => {
        const { runtime } = makeRuntime();
        runtime.createTarget({ id: 'a' });
        expect(runtime.moveTarget('entity', 'a', 'missing')).toBe(false);
        expect(runtime.getTargetByID('a')?.parentID).toBeNull();
        expect(sendError).toHaveBeenCalledWith(expect.stringContaining('missing'), 'warn');
    });
});

describe('moveFolder', () => {
    let runtime: Runtime;
    beforeEach(() => {
        vi.clearAllMocks();
        runtime = makeRuntime().runtime;
        runtime.addFolder('entity', makeFolder('f1'));
        runtime.addFolder('entity', makeFolder('f2', 'f1'));
        runtime.addFolder('entity', makeFolder('f3', 'f2'));
        runtime.addFolder('entity', makeFolder('f4'));
    });

    it('应该移动文件夹到另一个文件夹下', () => {
        expect(runtime.moveFolder('entity', 'f3', 'f4')).toBe(true);
        expect(runtime.getFolderByID('f3', 'entity')?.parentID).toBe('f4');
    });

    it('移动到顶层(null)成功', () => {
        expect(runtime.moveFolder('entity', 'f2', null)).toBe(true);
        expect(runtime.getFolderByID('f2', 'entity')?.parentID).toBeNull();
    });

    it('移入自身应该拒绝', () => {
        expect(runtime.moveFolder('entity', 'f1', 'f1')).toBe(false);
        expect(runtime.getFolderByID('f1', 'entity')?.parentID).toBeNull();
        expect(sendError).toHaveBeenCalled();
    });

    it('移入自身后代应该拒绝', () => {
        expect(runtime.moveFolder('entity', 'f1', 'f3')).toBe(false);
        expect(runtime.moveFolder('entity', 'f2', 'f3')).toBe(false);
        expect(runtime.getFolderByID('f1', 'entity')?.parentID).toBeNull();
        expect(runtime.getFolderByID('f2', 'entity')?.parentID).toBe('f1');
        expect(sendError).toHaveBeenCalled();
    });

    it('目标父文件夹不存在时返回false', () => {
        expect(runtime.moveFolder('entity', 'f2', 'missing')).toBe(false);
        expect(runtime.getFolderByID('f2', 'entity')?.parentID).toBe('f1');
        expect(sendError).toHaveBeenCalled();
    });

    it('文件夹不存在时返回false', () => {
        expect(runtime.moveFolder('entity', 'missing', null)).toBe(false);
    });
});

describe('视口同步', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('构造时应该订阅VIEWPORT_VIEW事件', () => {
        const { handlers } = makeRuntime();
        expect(handlers.get(events.VIEWPORT_VIEW)).toBeDefined();
    });

    it('VIEWPORT_VIEW事件应更新编辑目标的viewX/viewY', () => {
        const { runtime, handlers } = makeRuntime();
        runtime.createTarget({ id: 'a' });
        handlers.get(events.VIEWPORT_VIEW)?.forEach(cb => {
            cb({ changed: 'position', x: 10, y: 20 });
        });
        expect(runtime.getTargetByID('a')?.viewX).toBe(10);
        expect(runtime.getTargetByID('a')?.viewY).toBe(20);
    });

    it('VIEWPORT_VIEW事件应更新编辑目标的viewScale', () => {
        const { runtime, handlers } = makeRuntime();
        runtime.createTarget({ id: 'a' });
        handlers.get(events.VIEWPORT_VIEW)?.forEach(cb => {
            cb({ changed: 'scale', scale: 2 });
        });
        expect(runtime.getTargetByID('a')?.viewScale).toBe(2);
    });

    it('没有编辑目标时不应报错', () => {
        const { handlers } = makeRuntime();
        expect(() =>
            handlers.get(events.VIEWPORT_VIEW)?.forEach(cb => {
                cb({ changed: 'scale', scale: 2 });
            }),
        ).not.toThrow();
    });
});
