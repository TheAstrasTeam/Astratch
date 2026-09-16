// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import * as Blockly from 'blockly';
import { initBlocks } from '../../src/lib/BlocklyAdapter/blocks';
import { registerAstratchRenderer } from '../../src/lib/BlocklyAdapter/renderer';
import type { IBlockDefinition, IFieldSlot, IValueSlot } from '../../src/utils/ash-DSLToBlocks';
import type { IVM } from '../../src/types/vm/vm';

// 变量菜单在 field 构造时就会读 vm.runtime，这里给一个最小可用替身
const fakeVm = {
    runtime: {
        targets: new Map(),
        editingTargetID: '',
    },
} as unknown as IVM;

type TDSL = typeof import('../../src/utils/ash-DSLToBlocks');
let dsl: TDSL;
let definitions: Record<string, IBlockDefinition | undefined>;

beforeAll(async () => {
    registerAstratchRenderer();
    initBlocks(Blockly, fakeVm);
    // 动态导入：refreshBlocksDefinitions 在 spawnBlockAST 首次调用时才构建
    dsl = await import('../../src/utils/ash-DSLToBlocks');
    await dsl.refreshBlocksDefinitions();
    definitions = dsl.getBlocksDefinitions();
});

const blocks = (): [string, IBlockDefinition][] =>
    Object.entries(definitions).filter(
        (entry): entry is [string, IBlockDefinition] => entry[1] !== undefined,
    );

const atomLiteral = (value: unknown): string => {
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(String(value));
};

const firstOptionValue = (options: IFieldSlot['options']): unknown => {
    if (!options) return undefined;
    for (const option of options) {
        if (option === 'separator') continue;
        return option[1];
    }
    return undefined;
};

const fieldArg = (field: IFieldSlot): string => {
    const option = firstOptionValue(field.options);
    if (option !== undefined) return atomLiteral(option);
    if (field.numeric) return '0';
    return atomLiteral('text');
};

const isCompatible = (output: string[] | null | undefined, check: string[] | null): boolean => {
    if (!check || check.length === 0) return true;
    if (!output || output.length === 0) return true;
    return check.some(item => output.includes(item));
};

const valueArg = (slot: IValueSlot): string => {
    const shadow = slot.shadowType ? definitions[slot.shadowType] : undefined;
    if (shadow && isCompatible(shadow.output, slot.check)) {
        const field = shadow.fields.at(0);
        if (field) return fieldArg(field);
        if (slot.shadowType === 'operator_logic_boolean') return 'true';
    }
    if (slot.check?.includes('Boolean')) return 'true';
    if (slot.check?.includes('Number')) return '0';
    if (slot.check?.includes('String')) return atomLiteral('text');
    // 特殊类型（Array/Object/Function…）没有通用默认值，用 _ 留空
    if (slot.check && slot.check.length > 0) return '_';
    return '0';
};

/** 把一个积木的所有槽位用合法默认值填满，生成对应 DSL。 */
const buildDSL = (type: string, definition: IBlockDefinition): string => {
    const args = [
        ...definition.fields.map(field => `<${fieldArg(field)}>`),
        ...definition.values.map(valueArg),
        ...definition.statements.map(slot =>
            slot.check === null || slot.check.includes('Action') ? '{ debug_breakpoint; }' : '{}',
        ),
    ];
    return args.length > 0 ? `${type}(${args.join(', ')});` : `${type};`;
};

describe('spawnBlockAST', () => {
    it('字面量落到 value 输入的默认 shadow', async () => {
        const ast = await dsl.spawnBlockAST('entity_transform_position_moveStep(10);');
        expect(ast?.type).toBe('entity_transform_position_moveStep');
        const steps = ast?.inputs?.STEPS;
        expect(steps?.shadow).toMatchObject({ type: 'math_number', fields: { NUM: 10 } });
    });

    it('<> 落到 field，裸参数落到 value', async () => {
        const ast = await dsl.spawnBlockAST('data_variable_set(<score>, 10);');
        expect(ast?.fields?.NAME).toBe('score');
        const value = ast?.inputs?.VALUE;
        expect(value?.shadow).toBeDefined();
    });

    it('菜单原子按 options 转成对应值', async () => {
        const ast = await dsl.spawnBlockAST('operator_math_op(1, +, 2);');
        const operator = ast?.inputs?.OPERATOR;
        expect(operator?.shadow).toMatchObject({
            type: 'math_operator_menu',
            fields: { ASH_BLOCKMENU: '_ADD_' },
        });
    });

    it('嵌套调用生成 block 而不是 shadow', async () => {
        const ast = await dsl.spawnBlockAST(
            'control_flow_waitUntil(operator_logic_compare(1, <, 2));',
        );
        const conditionInput = ast?.inputs?.CONDITION;
        const condition = conditionInput?.block;
        expect(condition?.type).toBe('operator_logic_compare');
    });

    it('嵌套积木类型不符时报清晰的 DSL 错误', async () => {
        await expect(
            dsl.spawnBlockAST('control_flow_waitUntil(operator_math_op(1, 2));'),
        ).rejects.toThrow(/DSL 类型错误/);
    });

    it('{} 落到 statement，if 带 else 时写入 mutation 的 extraState', async () => {
        const ast = await dsl.spawnBlockAST(
            'control_condition_if(true, { debug_breakpoint; }, { debug_breakpoint; });',
        );
        const doInput = ast?.inputs?.DO;
        const elseInput = ast?.inputs?.ELSE_DO;
        expect(doInput?.block?.type).toBe('debug_breakpoint');
        expect(elseInput?.block?.type).toBe('debug_breakpoint');
        expect(ast?.extraState).toMatchObject({ elseIfCount: 0, hasElse: true });
        if (!ast) throw new Error('未生成 AST');
        expect(() => dsl.spawnBlocksSvg(ast)).not.toThrow();
    });

    it('if 带 else if 时展开 ELSE_IF_* 动态槽', async () => {
        const ast = await dsl.spawnBlockAST(
            'control_condition_if(true, { debug_breakpoint; }, false, { debug_breakpoint; }, { debug_breakpoint; });',
        );
        const conditionInput = ast?.inputs?.ELSE_IF_CONDITION_0;
        expect(conditionInput?.shadow).toMatchObject({ type: 'operator_logic_boolean' });
        const elseIfInput = ast?.inputs?.ELSE_IF_DO_0;
        expect(elseIfInput?.block?.type).toBe('debug_breakpoint');
        const elseInput = ast?.inputs?.ELSE_DO;
        expect(elseInput?.block?.type).toBe('debug_breakpoint');
        expect(ast?.extraState).toMatchObject({ elseIfCount: 1, hasElse: true });
        if (!ast) throw new Error('未生成 AST');
        expect(() => dsl.spawnBlocksSvg(ast)).not.toThrow();
    });

    it('完整样例可端到端渲染', async () => {
        const ast = await dsl.spawnBlockAST(`
event_lifecycle_onStart;
entity_transform_position_moveStep(10);
entity_appearance_images_showImage("hello world");
entity_transform_layer_setLayer(entity_transform_layer_getLayer);
control_flow_waitUntil(operator_logic_compare(1, <, 2));
control_condition_if(operator_logic_compare(1, <, 2), {
    entity_transform_position_moveStep(1);
    entity_appearance_images_showImage("hello world");
}, {
    entity_transform_position_moveStep(10);
});
`);
        if (!ast) throw new Error('未生成 AST');
        expect(() => dsl.spawnBlocksSvg(ast)).not.toThrow();
    });

    it('多条语句用 next 串成栈', async () => {
        const ast = await dsl.spawnBlockAST(
            'event_lifecycle_onStart; entity_transform_position_moveStep(10);',
        );
        expect(ast?.type).toBe('event_lifecycle_onStart');
        const next = ast?.next?.block;
        expect(next?.type).toBe('entity_transform_position_moveStep');
    });
});

describe('全部静态积木', () => {
    it('都能从 DSL 生成 AST', async () => {
        const failures: string[] = [];
        for (const [type, definition] of blocks()) {
            try {
                const ast = await dsl.spawnBlockAST(buildDSL(type, definition));
                if (ast?.type !== type) failures.push(`${type}: 得到 ${ast?.type ?? 'undefined'}`);
            } catch (error) {
                failures.push(`${type}: ${(error as Error).message}`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    });

    it('都能渲染成 SVG', async () => {
        const failures: string[] = [];
        for (const [type, definition] of blocks()) {
            try {
                const ast = await dsl.spawnBlockAST(buildDSL(type, definition));
                if (!ast) {
                    failures.push(`${type}: 未生成 AST`);
                    continue;
                }
                const svg = dsl.spawnBlocksSvg(ast);
                if (!svg.includes('<svg')) failures.push(`${type}: SVG 输出异常`);
            } catch (error) {
                failures.push(`${type}: ${(error as Error).message}`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    }, 60000);
});
