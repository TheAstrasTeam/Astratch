// 此文件由AI生成

import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import i18next from 'i18next';
import * as Blockly from 'blockly/core';

import { initFunctionBlocks } from '../../src/lib/BlocklyAdapter/blocks/function';
import type { ICustomFunction } from '../../src/types/blocks';
import { OPCODES } from '../../src/types/blocks';

const flush = async () => {
    for (let i = 0; i < 5; i++) {
        await Promise.resolve();
        await new Promise(resolve => setTimeout(resolve, 0));
    }
};

const makeFunction = (id: string): ICustomFunction => ({
    // 显示名取签名里第一段文字
    body: [{ type: 'text', text: `攻击-${id}` }],
    color: {},
    id,
    isValue: true,
});

/** 认识 fn-1 的 VM 桩。 */
const vmKnowsFn1 = {
    runtime: {
        getTargetByID: (targetId: string) =>
            targetId === 't1'
                ? {
                      getFunction: (functionId: string) =>
                          functionId === 'fn-1' ? makeFunction('fn-1') : null,
                  }
                : null,
    },
};

/** 对一切都装作不认识的 VM 桩。 */
const vmOblivious = {
    runtime: { getTargetByID: () => null },
};

interface HatState {
    type: string;
    fields?: { FUNC_NAME?: string };
    extraState?: { functionRef?: { targetId: string; functionId: string } };
}

describe('函数定义帽：数据持有与持久化', () => {
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
        initFunctionBlocks(Blockly, vmKnowsFn1 as never);
    });

    it('setFunctionRef 后帽面显示函数名', async () => {
        const ws = new Blockly.Workspace();
        interface Def {
            setFunctionRef(ref: unknown): void;
            getFieldValue(name: string): string;
        }
        const hat = ws.newBlock(OPCODES.FUNCTION_DEFINITION) as never as Def;
        hat.setFunctionRef({ targetId: 't1', functionId: 'fn-1' });
        await flush();

        expect(hat.getFieldValue('FUNC_NAME')).toBe('攻击-fn-1');
    });

    it('序列化包含 extraState.functionRef 与函数名', () => {
        const ws = new Blockly.Workspace();
        interface Def {
            setFunctionRef(ref: unknown): void;
            getFieldValue(name: string): string;
        }
        const hat = ws.newBlock(OPCODES.FUNCTION_DEFINITION) as never as Def;
        hat.setFunctionRef({ targetId: 't1', functionId: 'fn-1' });

        const state = Blockly.serialization.blocks.save(
            hat as never as Blockly.Block,
        ) as never as HatState;

        expect(state.extraState?.functionRef).toEqual({
            targetId: 't1',
            functionId: 'fn-1',
        });
        expect(state.fields?.FUNC_NAME).toBe('攻击-fn-1');
    });

    it('加载后帽子恢复引用，并从 VM 刷新显示名', async () => {
        const savedHat: HatState = {
            type: OPCODES.FUNCTION_DEFINITION,
            fields: { FUNC_NAME: '攻击-fn-1' },
            extraState: { functionRef: { targetId: 't1', functionId: 'fn-1' } },
        };
        const ws = new Blockly.Workspace();
        Blockly.serialization.workspaces.load(
            { blocks: { languageVersion: 0, blocks: [savedHat] } },
            ws,
        );
        await flush();

        const loaded = ws.getTopBlocks(true)[0] as unknown as {
            type: string;
            functionRef: { targetId: string; functionId: string } | null;
            getFieldValue(name: string): string;
        };
        expect(loaded.type).toBe(OPCODES.FUNCTION_DEFINITION);
        expect(loaded.functionRef).toEqual({ targetId: 't1', functionId: 'fn-1' });
        expect(loaded.getFieldValue('FUNC_NAME')).toBe('攻击-fn-1');

        // 再走一次序列化，引用应稳定往返。
        const state = Blockly.serialization.blocks.save(
            loaded as never as Blockly.Block,
        ) as never as HatState;
        expect(state.extraState?.functionRef).toEqual({
            targetId: 't1',
            functionId: 'fn-1',
        });
    });

    it('VM 中函数缺失时保留存档里的旧名且不崩溃', async () => {
        // 用"什么都不认识"的 VM 重新注册，模拟加载旧档但函数已被删的场景。
        initFunctionBlocks(Blockly, vmOblivious as never);

        const savedHat: HatState = {
            type: OPCODES.FUNCTION_DEFINITION,
            fields: { FUNC_NAME: '旧名字' },
            extraState: { functionRef: { targetId: 'gone', functionId: 'gone' } },
        };
        const ws = new Blockly.Workspace();
        Blockly.serialization.workspaces.load(
            { blocks: { languageVersion: 0, blocks: [savedHat] } },
            ws,
        );
        await flush();

        const loaded = ws.getTopBlocks(true)[0] as unknown as {
            functionRef: unknown;
            getFieldValue(name: string): string;
        };
        expect(loaded.functionRef).toEqual({ targetId: 'gone', functionId: 'gone' });
        expect(loaded.getFieldValue('FUNC_NAME')).toBe('旧名字');
    });
});
