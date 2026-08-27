// 此文件由AI生成

import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import i18next from 'i18next';
import * as Blockly from 'blockly/core';

import { initFunctionBlocks } from '../../src/lib/BlocklyAdapter/blocks/function';
import { AshConnectionChecker } from '../../src/lib/BlocklyAdapter/connectionRules';
import type { AshConnection } from '../../src/lib/BlocklyAdapter/connectionRules';
import type { ICustomFunction } from '../../src/types/blocks';
import { AllCheckers, OPCODES } from '../../src/types/blocks';

const makeFunction = (id: string): ICustomFunction => ({
    body: [{ type: 'text', text: `攻击-${id}` }],
    color: {},
    id,
    isValue: true,
});

const referencedFunction = makeFunction('fn-1');

const vmStub = {
    runtime: {
        getTargetByID: (targetId: string) =>
            targetId === 't1'
                ? {
                      getFunction: (functionId: string) =>
                          functionId === 'fn-1' ? referencedFunction : null,
                  }
                : null,
    },
};

interface HatState {
    type: string;
    extraState?: { functionRef?: { targetId: string; functionId: string } };
    inputs?: { NAME?: { block?: { type: string } } };
}

interface HatBlock {
    setFunctionRef(ref: unknown): void;
    functionRef: { targetId: string; functionId: string } | null;
    getInput(name: string): { connection: AshConnection | null } | undefined;
}

const newHat = (ws: Blockly.Workspace): HatBlock =>
    ws.newBlock(OPCODES.FUNCTION_DEFINITION) as never;

const slotOf = (hat: HatBlock): AshConnection => {
    const slot = hat.getInput('NAME')?.connection;
    if (!slot) throw new Error('定义帽缺少 NAME 槽');
    return slot;
};

describe('函数定义帽：数据持有、锁定槽与自动嵌入', () => {
    beforeAll(async () => {
        const strip = (path: string) => fs.readFileSync(path, 'utf-8').replace(/^\uFEFF/, '');
        const zhBlocks = JSON.parse(strip('src/i18n/locales/zh-CN/blocks.json')) as Record<
            string,
            string
        >;
        await i18next.init({
            lng: 'zh-CN',
            fallbackLng: 'en',
            resources: { 'zh-CN': { blocks: zhBlocks } },
        });
        initFunctionBlocks(Blockly, vmStub as never);
    });

    it('空帽在微任务后自动嵌入一枚函数值积木', async () => {
        const ws = new Blockly.Workspace();
        const hat = newHat(ws);
        // 同步阶段尚未嵌入（补块走微任务）。
        expect(slotOf(hat).targetBlock()).toBeNull();

        await Promise.resolve();
        const embedded = slotOf(hat).targetBlock();
        expect(embedded?.type).toBe(OPCODES.FUNCTION_VALUE);
    });

    it('锁定槽默认拒绝任何连接，宿主开锁后才放行', async () => {
        const checker = new AshConnectionChecker();
        const ws = new Blockly.Workspace();
        const donor = ws.newBlock(OPCODES.FUNCTION_PARAM);
        const out = donor.outputConnection;
        expect(out).not.toBeNull();
        if (!out) return;

        const hat = newHat(ws);
        // init 先开锁、微任务里锁回；等它锁回后再验证拒绝语义。
        await Promise.resolve();

        const slot = hat.getInput('NAME')?.connection;
        expect(slot).not.toBeNull();
        if (!slot) return;

        // 未开锁：拒绝。
        expect(checker.doTypeChecks(slot, out)).toBe(false);

        // 宿主临时开锁：放行。
        slot.allowScopedSource = true;
        expect(checker.doTypeChecks(slot, out)).toBe(true);
        slot.allowScopedSource = false;
        expect(checker.doTypeChecks(slot, out)).toBe(false);
    });

    it('序列化携带 extraState.functionRef 与嵌入的函数值', () => {
        const ws = new Blockly.Workspace();
        const hat = newHat(ws);
        hat.setFunctionRef({ targetId: 't1', functionId: 'fn-1' });

        return Promise.resolve().then(() => {
            const state = Blockly.serialization.blocks.save(
                hat as never as Blockly.Block,
            ) as unknown as HatState;

            expect(state.extraState?.functionRef).toEqual({
                targetId: 't1',
                functionId: 'fn-1',
            });
            expect(state.inputs?.NAME?.block?.type).toBe(OPCODES.FUNCTION_VALUE);
        });
    });

    it('加载后引用恢复；存档自带签名时不重复嵌入', async () => {
        const savedHat: HatState = {
            type: OPCODES.FUNCTION_DEFINITION,
            extraState: { functionRef: { targetId: 't1', functionId: 'fn-1' } },
            inputs: {
                NAME: {
                    block: { type: OPCODES.FUNCTION_VALUE },
                },
            },
        };
        const ws = new Blockly.Workspace();
        Blockly.serialization.workspaces.load(
            { blocks: { languageVersion: 0, blocks: [savedHat] } },
            ws,
        );
        await Promise.resolve();

        const values = ws.getAllBlocks(false).filter(b => b.type === OPCODES.FUNCTION_VALUE);
        expect(values).toHaveLength(1);

        const loaded = ws.getTopBlocks(true)[0] as unknown as HatBlock;
        expect(loaded.functionRef).toEqual({ targetId: 't1', functionId: 'fn-1' });
    });

    it('修改函数参数后同步已拖出的参数积木；删除参数时销毁副本', async () => {
        referencedFunction.body = [
            { type: 'text', text: '函数' },
            { type: AllCheckers.STRING, text: '旧参数' },
        ];

        const ws = new Blockly.Workspace();
        const hat = newHat(ws);
        hat.setFunctionRef({ targetId: 't1', functionId: 'fn-1' });
        await Promise.resolve();
        await Promise.resolve();

        const value = slotOf(hat).targetBlock() as Blockly.Block & {
            refreshFromFunctionData(): void;
        };
        const slot = value.getInput('ARG1')?.connection;
        const floating = slot?.targetBlock();
        expect(floating?.type).toBe(OPCODES.FUNCTION_PARAM);
        floating?.unplug();

        referencedFunction.body = [
            { type: 'text', text: '函数' },
            { type: AllCheckers.NUMBER, text: '新参数' },
        ];
        value.refreshFromFunctionData();

        expect(floating?.getFieldValue('NAME')).toBe('新参数');
        expect(floating?.outputConnection?.getCheck()).toEqual([AllCheckers.NUMBER]);

        referencedFunction.body = [{ type: 'text', text: '函数' }];
        value.refreshFromFunctionData();
        expect(floating?.isDeadOrDying()).toBe(true);
    });
});
