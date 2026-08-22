// 此文件由AI生成
/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import Target from '../../src/vm/runtime/target';
import {
    events,
    type IEntityInfo,
    type IVM,
    type TEmit,
    type TTargetInfo,
} from '../../src/types/vm';
import { sendError } from '../../src/utils/debug';
import { OPCODES, type ICustomFunction, type IWorkspaceState } from '../../src/types/blocks';
import { initFunctionBlocks } from '../../src/lib/BlocklyAdapter/blocks/function';
import type { IFunctionDefinition } from '../../src/components/modal_createFunction/functionPreview';
import * as Blockly from 'blockly';
import i18next from 'i18next';
import { readFileSync } from 'node:fs';

vi.mock('../../src/utils/debug', () => ({
    sendError: vi.fn((error: unknown, type: 'error' | 'warn' = 'error') => {
        if (type === 'warn') return;
        throw error instanceof Error ? error : new Error(String(error));
    }),
}));

const DEFAULTS: TTargetInfo = {
    name: '',
    id: '',
    blocks: {
        _workspace: { blocks: { languageVersion: 0, blocks: [] } },
        _script: [],
    },
    comments: {},
    parentID: null,
    mode: 'entity',
    viewX: 0,
    viewY: 0,
    viewScale: 1,
    links: [],
    data: [],
    function: [],
};

const ENTITY_INFO: IEntityInfo = {
    size: 100,
    direction: 90,
    currentCostume: 0,
    effects: {
        brightness: 0,
        color: 0,
        fisheye: 0,
        ghost: 0,
        mosaic: 0,
        pixelate: 0,
        whirl: 0,
    },
    volume: 100,
    x: 0,
    y: 0,
};

function makeTarget(emit: TEmit = vi.fn()) {
    return Target.fromMeta({ name: 'sprite' }, DEFAULTS, ENTITY_INFO, emit);
}

describe('Target.fromMeta', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该创建target并自动生成id', () => {
        const target = makeTarget();
        expect(target.id).toBeTruthy();
        expect(target.name).toBe('sprite');
        expect(target.mode).toBe('entity');
        expect(target.parentID).toBeNull();
    });

    it('应该使用传入的id/parent/mode', () => {
        const target = Target.fromMeta(
            { id: 'custom-id', name: 'module', mode: 'module', parent: 'f1' },
            DEFAULTS,
            ENTITY_INFO,
            vi.fn(),
        );
        expect(target.id).toBe('custom-id');
        expect(target.mode).toBe('module');
        expect(target.parentID).toBe('f1');
    });

    it('entity模式的target应该合并默认实体信息', () => {
        const target = makeTarget();
        expect(target.size).toBe(ENTITY_INFO.size);
        expect(target.direction).toBe(ENTITY_INFO.direction);
        expect(target.volume).toBe(ENTITY_INFO.volume);
        expect(target.effects).toEqual(ENTITY_INFO.effects);
    });

    it('module模式的target不应包含实体信息', () => {
        const target = Target.fromMeta(
            { name: 'module', mode: 'module' },
            DEFAULTS,
            ENTITY_INFO,
            vi.fn(),
        );
        expect(target.size).toBeUndefined();
        expect(target.effects).toBeUndefined();
    });

    it('创建的多个target互不影响（默认模板是深拷贝）', () => {
        const a = makeTarget();
        const b = makeTarget();
        a.name = 'changed';
        a.blocks._script.push('x');
        expect(b.name).toBe('sprite');
        expect(b.blocks._script).toEqual([]);
    });
});

describe('Target.rename', () => {
    it('应该更新名字并发出UPDATE_TARGET_STRUCTURE事件', () => {
        const emit = vi.fn();
        const target = makeTarget(emit);
        target.rename('新名字');
        expect(target.name).toBe('新名字');
        expect(emit).toHaveBeenCalledWith(events.UPDATE_TARGET_STRUCTURE);
    });
});

describe('Target.setParent', () => {
    it('应该更新parentID并发出事件', () => {
        const emit = vi.fn();
        const target = makeTarget(emit);
        target.setParent('f1');
        expect(target.parentID).toBe('f1');
        expect(emit).toHaveBeenCalledWith(events.UPDATE_TARGET_STRUCTURE);
    });
});

describe('Target.setBlocks', () => {
    it('应该更新工作区状态并发出UPDATE_PROJECT事件', () => {
        const emit = vi.fn();
        const target = makeTarget(emit);
        const state: IWorkspaceState = { blocks: { languageVersion: 0, blocks: [] } };
        target.setBlocks(state);
        expect(target.blocks._workspace).toBe(state);
        expect(emit).toHaveBeenCalledWith(events.UPDATE_PROJECT);
    });
});

describe('Target链接', () => {
    it('addLink应该添加链接并发出UPDATE_PROJECT事件', () => {
        const emit = vi.fn();
        const target = makeTarget(emit);
        expect(target.addLink('module-1')).toBe(true);
        expect(target.links).toEqual(['module-1']);
        expect(emit).toHaveBeenCalledWith(events.UPDATE_PROJECT);
    });

    it('addLink链接自己应该报错并返回false', () => {
        const target = makeTarget();
        expect(target.addLink(target.id)).toBe(false);
        expect(target.links).toEqual([]);
        expect(sendError).toHaveBeenCalled();
    });

    it('removeLink应该移除链接并发出事件', () => {
        const emit = vi.fn();
        const target = makeTarget(emit);
        target.addLink('module-1');
        emit.mockClear();
        target.removeLink('module-1');
        expect(target.links).toEqual([]);
        expect(emit).toHaveBeenCalledWith(events.UPDATE_PROJECT);
    });
});

describe('Target数据', () => {
    it('createData应该创建数据并返回id，发出UPDATE_PROJECT与CREATE_DATA事件', () => {
        const emit = vi.fn();
        const target = makeTarget(emit);
        const id = target.createData('变量', 1, true, false);
        expect(id).toBeTruthy();
        expect(target.data.get(id)).toMatchObject({
            id,
            name: '变量',
            data: 1,
            isPrivate: true,
            isConst: false,
        });
        expect(emit).toHaveBeenCalledWith(events.UPDATE_PROJECT);
        expect(emit).toHaveBeenCalledWith(events.CREATE_DATA, { targetID: target.id, dataID: id });
    });

    it('createData重名时应该警告（报错）', () => {
        const target = makeTarget();
        target.createData('变量', 1);
        expect(() => {
            target.createData('变量', 2);
        }).toThrow();
        expect(target.data.size).toBe(1);
        expect(sendError).toHaveBeenCalled();
    });

    it('getData应该返回数据，不存在的返回null', () => {
        const target = makeTarget();
        const id = target.createData('变量', 1);
        expect(target.getData(id)?.name).toBe('变量');
        expect(target.getData('missing')).toBeNull();
    });
});

describe('Target.setViewport', () => {
    it('position更新viewX/viewY', () => {
        const target = makeTarget();
        target.setViewport({ changed: 'position', x: 10, y: 20 });
        expect(target.viewX).toBe(10);
        expect(target.viewY).toBe(20);
    });

    it('scale更新viewScale', () => {
        const target = makeTarget();
        target.setViewport({ changed: 'scale', scale: 2, oldScale: 1 });
        expect(target.viewScale).toBe(2);
    });
});

describe('Target.cloneAsNode', () => {
    it('应该保留原型（方法可用）并带type字段', () => {
        const target = makeTarget();
        const node = target.cloneAsNode();
        expect(node).toBeInstanceOf(Target);
        expect(node.type).toBe('target');
        expect(node.id).toBe(target.id);
        expect(node.rename).toBeTypeOf('function');
        // 浅拷贝：基本类型互不影响，但节点自身可用方法
        node.rename('改名');
        expect(node.name).toBe('改名');
        expect(target.name).toBe('sprite');
    });
});

describe('Target.fromJSON', () => {
    it('应该从纯对象还原target并带方法', () => {
        const target = Target.fromJSON(
            {
                name: 'a',
                id: 't1',
                mode: 'module',
                parentID: null,
                viewScale: 2,
                links: [],
                data: [],
                blocks: { _workspace: { blocks: { languageVersion: 0, blocks: [] } }, _script: [] },
                comments: {},
                viewX: 0,
                viewY: 0,
                function: [],
            },
            vi.fn(),
        );
        expect(target.name).toBe('a');
        expect(target.id).toBe('t1');
        expect(target.mode).toBe('module');
        expect('rename' in target).toBe(true);
    });
});

describe('Target 数据序列化', () => {
    it('toJSON应该把data Map序列化为数组', () => {
        const target = makeTarget();
        const id = target.createData('变量', 1);
        const json = target.toJSON();
        expect(Array.isArray(json.data)).toBe(true);
        expect(json.data).toHaveLength(1);
        expect(json.data[0]).toMatchObject({ id, name: '变量', data: 1 });
    });

    it('data应该能通过 JSON 往返并还原为 Map', () => {
        const target = makeTarget();
        target.createData('变量', 1, true, false);
        target.createData('常量', 2, false, true);
        const roundTrip = Target.fromJSON(
            JSON.parse(JSON.stringify(target.toJSON())) as TTargetInfo,
            vi.fn(),
        );
        expect(roundTrip.data).toBeInstanceOf(Map);
        expect(roundTrip.data.size).toBe(2);
        expect([...roundTrip.data.values()]).toMatchObject([
            { name: '变量', data: 1, isPrivate: true, isConst: false },
            { name: '常量', data: 2, isPrivate: false, isConst: true },
        ]);
    });

    it('toJSON应该把function Map序列化为数组并能还原为Map', () => {
        const emit = vi.fn();
        const target = makeTarget(emit);
        const body: ICustomFunction = {
            body: [
                { type: 'text', text: '计算' },
                { type: ['number', 'string'], text: 'value' },
            ],
            color: { primary: '#123456' },
            id: 'a',
            isValue: true,
            returnType: ['number', 'string'],
        };
        target.addCustomFunction('a', body);
        const json = target.toJSON();
        expect(Array.isArray(json.function)).toBe(true);
        expect(json.function).toHaveLength(1);
        expect(json.function[0]).toEqual(body);
        const roundTrip = Target.fromJSON(JSON.parse(JSON.stringify(json)) as TTargetInfo, vi.fn());
        expect(roundTrip.function).toBeInstanceOf(Map);
        expect(roundTrip.getFunction('a')).toEqual(body);
    });

    it('fromJSON遇到旧版本的data({})应该还原为空Map而不报错', () => {
        const target = Target.fromJSON(
            {
                name: 'legacy',
                id: 't1',
                mode: 'module',
                parentID: null,
                viewScale: 1,
                links: [],
                data: {} as unknown as TTargetInfo['data'],
                blocks: { _workspace: { blocks: { languageVersion: 0, blocks: [] } }, _script: [] },
                comments: {},
                viewX: 0,
                viewY: 0,
                function: [],
            },
            vi.fn(),
        );
        expect(target.data).toBeInstanceOf(Map);
        expect(target.data.size).toBe(0);
    });
});

describe('自定义函数测试', () => {
    it('应该按稳定ID读取函数并返回独立的列表快照', () => {
        const target = makeTarget();
        const customFunction: ICustomFunction = {
            body: [{ type: 'text', text: 'run' }],
            color: { primary: '#123456' },
            id: 'function-a',
            isValue: false,
        };

        target.addCustomFunction(customFunction.id, customFunction);
        const functions = target.listFunctions();

        expect(target.getFunction(customFunction.id)).toBe(customFunction);
        expect(target.getFunction('missing')).toBeNull();
        expect(functions).toEqual([customFunction]);
        (functions as ICustomFunction[]).length = 0;
        expect(target.listFunctions()).toEqual([customFunction]);
    });

    it('有已存在的函数id时报错', () => {
        const target = Target.fromJSON(
            {
                name: 'legacy',
                id: 't1',
                mode: 'module',
                parentID: null,
                viewScale: 1,
                links: [],
                data: {} as unknown as TTargetInfo['data'],
                blocks: { _workspace: { blocks: { languageVersion: 0, blocks: [] } }, _script: [] },
                comments: {},
                viewX: 0,
                viewY: 0,
                function: [],
            },
            vi.fn(),
        );
        const body: ICustomFunction = {
            body: [],
            color: {},
            id: 'a',
            isValue: false,
        };
        expect(target.addCustomFunction('a', body)).toBe(true);
        expect(() => target.addCustomFunction('a', body)).toThrow(Error);
    });
    it('应该添加成功多个函数', () => {
        const target = Target.fromJSON(
            {
                name: 'legacy',
                id: 't1',
                mode: 'module',
                parentID: null,
                viewScale: 1,
                links: [],
                data: [],
                blocks: { _workspace: { blocks: { languageVersion: 0, blocks: [] } }, _script: [] },
                comments: {},
                viewX: 0,
                viewY: 0,
                function: [],
            },
            vi.fn(),
        );
        for (let i = 0; i <= 20; i++) {
            const id = crypto.randomUUID();
            const body: ICustomFunction = {
                body: [],
                color: {},
                id,
                isValue: false,
            };
            expect(target.addCustomFunction(id, body)).toBe(true);
        }
    });
    it('应该添加成功创建多个函数并广播', () => {
        const emit = vi.fn();
        const target = makeTarget(emit);
        for (let i = 0; i <= 20; i++) {
            emit.mockClear();
            const id = crypto.randomUUID();
            const body: ICustomFunction = {
                body: [],
                color: {},
                id,
                isValue: false,
            };
            target.addCustomFunction(id, body);
            expect(emit).toHaveBeenNthCalledWith(1, events.UPDATE_PROJECT);
            expect(emit).toHaveBeenNthCalledWith(2, events.CREATE_CUSTOM_FUNCTION, {
                id,
                targetID: target.id,
            });
        }
    });
    it('跨target定义函数时定义帽应序列化写入目标target的blocks数据', async () => {
        // 积木 init 会取 t('blocks:function.definition')（含 %1 占位符），
        // 必须用真实语言包初始化 i18next
        const zhBlocks = JSON.parse(
            readFileSync('src/i18n/locales/zh-CN/blocks.json', 'utf-8'),
        ) as Record<string, string>;
        await i18next.init({
            lng: 'zh-CN',
            fallbackLng: 'en',
            resources: { 'zh-CN': { blocks: zhBlocks } },
        });
        initFunctionBlocks(Blockly, {} as unknown as IVM);

        const emit = vi.fn();
        const target = makeTarget(emit);
        target.viewX = 40;
        target.viewY = 30;
        const id = 'fn-1';
        target.addCustomFunction(id, {
            body: [
                { type: 'text', text: '函数名称' },
                { type: 'string', text: 'name' },
                { type: 'number', text: 'count' },
            ],
            color: {},
            id,
            isValue: true,
        });

        // 模拟 handleFunctionCreated 的跨 target 分支：
        // 临时工作区 → newBlock → 序列化 → 销毁 → 定位 → 写入该 target 的 blocks 数据
        const tempWorkspace = new Blockly.Workspace();
        const definition = tempWorkspace.newBlock(
            OPCODES.FUNCTION_DEFINITION,
        ) as unknown as IFunctionDefinition;
        definition.functionData = target.getFunction(id);
        const signature = definition
            .getInput('NAME')
            ?.connection?.targetBlock() as Blockly.Block | null;
        console.log(
            'signature',
            { isShadow: signature?.isShadow(), dead: signature?.isDeadOrDying(), flyout: signature?.isInFlyout },
            signature?.inputList.map(input => ({
                name: input.name,
                target: input.connection?.targetBlock()?.type,
                check: input.connection?.getCheck(),
            })),
        );
        (signature as unknown as { ensureScopedBlocks?: () => void }).ensureScopedBlocks?.();
        console.log(
            'after ensure',
            signature?.getInput('ARG1')?.connection?.targetBlock()?.type,
            signature &&
                (signature as unknown as {
                    isFillingScopedSlots?: boolean;
                    getScopedSlots?: () => unknown;
                }).isFillingScopedSlots,
            signature &&
                (signature as unknown as { getScopedSlots?: () => unknown }).getScopedSlots?.(),
            tempWorkspace.getAllBlocks(false).map(block => block.type),
        );
        expect(signature?.type).toBe(OPCODES.FUNCTION_VALUE);
        expect(signature?.getInput('ARG1')?.connection?.targetBlock()?.type).toBe(
            OPCODES.FUNCTION_PARAM,
        );
        expect(signature?.getInput('ARG2')?.connection?.targetBlock()?.type).toBe(
            OPCODES.FUNCTION_PARAM,
        );
        expect(signature?.getInput('ARG1')?.connection?.targetBlock()?.getFieldValue('NAME')).toBe(
            'name',
        );
        const state = Blockly.serialization.blocks.save(
            definition,
        ) as unknown as Blockly.serialization.blocks.State;
        tempWorkspace.dispose();
        state.x = target.viewX;
        state.y = target.viewY;
        target.blocks._workspace.blocks.blocks.push(state);

        expect(target.blocks._workspace.blocks.blocks).toHaveLength(1);
        expect(target.blocks._workspace.blocks.blocks[0]).toMatchObject({
            type: OPCODES.FUNCTION_DEFINITION,
            x: 40,
            y: 30,
        });

        // 切到该 target 时工作区会从 blocks 数据重建，定义帽应能被加载出来
        const ws = new Blockly.Workspace();
        Blockly.serialization.workspaces.load(target.blocks._workspace, ws);
        const loaded = ws.getTopBlocks(true)[0];
        expect(loaded.type).toBe(OPCODES.FUNCTION_DEFINITION);
        expect(loaded.getRelativeToSurfaceXY()).toEqual({ x: 40, y: 30 });
        const loadedSignature = loaded
            .getInput('NAME')
            ?.connection?.targetBlock() as Blockly.Block | null;
        expect(loadedSignature?.type).toBe(OPCODES.FUNCTION_VALUE);
        expect(loadedSignature?.getInput('ARG1')?.connection?.targetBlock()?.type).toBe(
            OPCODES.FUNCTION_PARAM,
        );
        expect(loadedSignature?.getInput('ARG1')?.connection?.targetBlock()?.getFieldValue('NAME')).toBe(
            'name',
        );
    });
});
