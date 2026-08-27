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
import type {
    IFunctionDropdownField,
    TPreviewFunctionData,
} from '../../src/components/modal_createFunction/functionPreview';
import { isDropdownField } from '../../src/components/modal_createFunction/functionPreview';

const makeFunction = (id: string): ICustomFunction => ({
    body: [{ type: 'text', text: `攻击-${id}` }],
    color: {},
    id,
    isValue: true,
});

const referencedFunction = makeFunction('fn-1');

const makeDropdownBody = (): TPreviewFunctionData[] => [
    { type: 'text', text: '设置难度' },
    {
        type: {
            type: 'dropdown',
            options: [
                { label: '简单', value: 'easy' },
                { label: '困难', value: 'hard' },
            ],
            allowBlocks: false,
            value: 'easy',
        },
        text: '难度',
    },
];

const dropdownFunction: ICustomFunction = {
    body: makeDropdownBody(),
    color: {},
    id: 'fn-drop',
    isValue: true,
};

const vmStub = {
    runtime: {
        getTargetByID: (targetId: string) =>
            targetId === 't1'
                ? {
                      getFunction: (functionId: string) =>
                          functionId === 'fn-1'
                              ? referencedFunction
                              : functionId === 'fn-drop'
                                ? dropdownFunction
                                : null,
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

// 此 describe 由AI生成：下拉参数的枚举槽（输入选择器）
describe('函数定义帽：下拉参数的枚举槽', () => {
    interface IDropdownValueBlock extends Blockly.Block {
        previewData: TPreviewFunctionData[];
        ensureScopedBlocks(): void;
        refreshFromFunctionData(): void;
    }

    interface IEnumBlock extends Blockly.Block {
        ownerId?: string;
        slotKey?: string;
    }

    const flush = async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
    };

    const setup = async () => {
        dropdownFunction.body = makeDropdownBody();
        const ws = new Blockly.Workspace();
        const hat = ws.newBlock(OPCODES.FUNCTION_DEFINITION) as HatBlock;
        hat.setFunctionRef({ targetId: 't1', functionId: 'fn-drop' });
        await flush();
        const value = slotOf(hat).targetBlock() as IDropdownValueBlock;
        return { ws, hat, value };
    };

    const enumSlotOf = (value: IDropdownValueBlock) => {
        const slot = value.getInput('ENUM_1')?.connection;
        if (!slot) throw new Error('签名缺少枚举槽 ENUM_1');
        return slot;
    };

    const configOf = (value: IDropdownValueBlock): IFunctionDropdownField => {
        const fieldData = value.previewData[1] as TPreviewFunctionData | undefined;
        if (!fieldData || !isDropdownField(fieldData))
            throw new Error('previewData[1] 不是下拉字段');
        return fieldData.type;
    };

    it('下拉参数同时发放参数积木与枚举积木', async () => {
        const { value } = await setup();

        expect(value.getInput('ARG1')?.connection?.targetBlock()?.type).toBe(
            OPCODES.FUNCTION_PARAM,
        );
        const enumBlock = enumSlotOf(value).targetBlock();
        expect(enumBlock?.type).toBe(OPCODES.FUNCTION_ENUM);
        expect(enumBlock?.getFieldValue('VALUE')).toBe('easy');
        expect((enumBlock as IEnumBlock).ownerId).toBe(value.id);
        expect((enumBlock as IEnumBlock).slotKey).toBe('enum-1');
    });

    it('枚举积木可无限拖出，槽内自动回补新块', async () => {
        const { value } = await setup();
        const slot = enumSlotOf(value);
        const first = slot.targetBlock() as IEnumBlock;
        first.unplug();
        value.ensureScopedBlocks();

        const second = slot.targetBlock();
        expect(second).not.toBe(first);
        expect(second?.type).toBe(OPCODES.FUNCTION_ENUM);
        // 拖出的副本保留宿主身份，选项变化时可继续同步。
        expect(first.ownerId).toBe(value.id);
        expect(first.getFieldValue('VALUE')).toBe('easy');
    });

    it('槽内改选写回默认值；拖出的副本互不影响', async () => {
        const { value } = await setup();
        const slot = enumSlotOf(value);
        const floating = slot.targetBlock() as IEnumBlock;
        floating.unplug();
        value.ensureScopedBlocks();

        // 副本改选不写默认值。
        floating.getField('VALUE')?.setValue('hard');
        expect(configOf(value).value).toBe('easy');

        // 槽内改选即默认值（与 Scratch 定义帽一致）。
        slot.targetBlock()?.getField('VALUE')?.setValue('hard');
        expect(configOf(value).value).toBe('hard');
    });

    it('宿主选项变化时同步槽内与副本；失效选择回退默认值', async () => {
        const { value } = await setup();
        const slot = enumSlotOf(value);
        const floating = slot.targetBlock() as IEnumBlock;
        floating.unplug();
        value.ensureScopedBlocks();
        floating.getField('VALUE')?.setValue('hard');

        dropdownFunction.body = [
            { type: 'text', text: '设置难度' },
            {
                type: {
                    type: 'dropdown',
                    options: [
                        { label: '普通', value: 'normal' },
                        { label: '困难', value: 'hard' },
                    ],
                    allowBlocks: false,
                    value: 'normal',
                },
                text: '难度',
            },
        ];
        value.refreshFromFunctionData();

        // 槽内显示新默认值。
        expect(slot.targetBlock()?.getFieldValue('VALUE')).toBe('normal');
        // 副本保留仍然有效的选择。
        expect(floating.getFieldValue('VALUE')).toBe('hard');
        const options = (
            floating.getField('VALUE') as unknown as {
                getOptions(): Blockly.MenuOption[];
            }
        ).getOptions(false);
        expect(options.map(([, optionValue]) => optionValue)).toEqual(['normal', 'hard']);
    });

    it('删除下拉参数时枚举槽与枚举积木一并销毁', async () => {
        const { value } = await setup();
        const slot = enumSlotOf(value);
        const floating = slot.targetBlock() as IEnumBlock;
        floating.unplug();
        value.ensureScopedBlocks();
        const inSlot = slot.targetBlock();
        expect(inSlot?.type).toBe(OPCODES.FUNCTION_ENUM);

        dropdownFunction.body = [{ type: 'text', text: '设置难度' }];
        value.refreshFromFunctionData();

        expect(value.getInput('ENUM_1')).toBeNull();
        expect(floating.isDeadOrDying()).toBe(true);
        expect(inSlot?.isDeadOrDying()).toBe(true);
    });

    it('序列化往返保留枚举副本的选择与槽内的回补', async () => {
        const { ws, value } = await setup();
        const slot = enumSlotOf(value);
        const floating = slot.targetBlock() as IEnumBlock;
        floating.unplug();
        value.ensureScopedBlocks();
        floating.getField('VALUE')?.setValue('hard');

        const state = Blockly.serialization.workspaces.save(ws);
        const ws2 = new Blockly.Workspace();
        Blockly.serialization.workspaces.load(state, ws2);
        await flush();

        const enums = ws2
            .getAllBlocks(false)
            .filter((block): block is IEnumBlock => block.type === OPCODES.FUNCTION_ENUM);
        expect(enums).toHaveLength(2);

        const reloadedFloating = enums.find(
            block => block.getParent()?.type !== OPCODES.FUNCTION_VALUE,
        );
        expect(reloadedFloating?.getFieldValue('VALUE')).toBe('hard');
        expect(reloadedFloating?.ownerId).toBeTruthy();

        const reloadedInSlot = enums.find(
            block => block.getParent()?.type === OPCODES.FUNCTION_VALUE,
        );
        expect(reloadedInSlot?.getFieldValue('VALUE')).toBe('easy');
    });
});
