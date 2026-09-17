// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import * as Blockly from 'blockly';
import { initBlocks } from '../../src/lib/BlocklyAdapter/blocks';
import { registerAstratchRenderer } from '../../src/lib/BlocklyAdapter/renderer';
import type { IBlockDefinition, IFieldSlot, IValueSlot } from '../../src/utils/ash-DSLToBlocks';
import type { IVM } from '../../src/types/vm/vm';

// 变量菜单在 field 构造时就会读 vm.runtime，这里给一个最小可用替身
const fakeVm = {
    runtime: new Proxy(
        { targets: new Map(), editingTargetID: '' },
        {
            get: (target, prop) =>
                Reflect.has(target, prop)
                    ? (Reflect.get(target, prop) as unknown)
                    : () => undefined,
        },
    ),
} as unknown as IVM;

type TDSL = typeof import('../../src/utils/ash-DSLToBlocks');
let dsl: TDSL;
let definitions: Record<string, IBlockDefinition | undefined>;

beforeAll(async () => {
    registerAstratchRenderer();
    initBlocks(Blockly, fakeVm);
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
            slot.check === null || slot.check.includes('Action') ? '{ @debug_breakpoint; }' : '{}',
        ),
    ];
    return args.length > 0 ? `@${type}(${args.join(', ')});` : `@${type};`;
};

/** 沿 next 链收集积木类型。 */
const chainTypes = (state: Blockly.serialization.blocks.State | undefined): string[] => {
    const types: string[] = [];
    let current = state;
    while (current) {
        types.push(current.type);
        current = current.next?.block;
    }
    return types;
};

/** 取 next 链上第 index 个积木（0 起）。 */
const chainAt = (
    state: Blockly.serialization.blocks.State | undefined,
    index: number,
): Blockly.serialization.blocks.State | undefined => {
    let current = state;
    for (let step = 0; step < index && current; step++) current = current.next?.block;
    return current;
};

const inputOf = (
    ast: Blockly.serialization.blocks.State | undefined,
    name: string,
): Blockly.serialization.blocks.ConnectionState | undefined => ast?.inputs?.[name];

const renderOk = async (ast: Blockly.serialization.blocks.State | undefined): Promise<void> => {
    if (!ast) throw new Error('no AST');
    const svg = await dsl.spawnBlocksSvg(ast);
    expect(svg).toContain('<svg');
};

describe('base form：@ 与 []', () => {
    it('@ 标记积木，字面量落到 value 输入的默认 shadow', async () => {
        const ast = await dsl.spawnBlockAST('@entity_transform_position_moveStep(10);');
        expect(ast?.type).toBe('entity_transform_position_moveStep');
        expect(inputOf(ast, 'STEPS')?.shadow).toMatchObject({
            type: 'math_number',
            fields: { NUM: 10 },
        });
    });

    it('<> 落到 field，裸参数落到 value', async () => {
        const ast = await dsl.spawnBlockAST('@data_variable_set(<score>, 10);');
        expect(ast?.fields?.NAME).toBe('score');
        expect(inputOf(ast, 'VALUE')?.shadow).toBeDefined();
    });

    it('菜单原子按 options 转成对应值', async () => {
        const ast = await dsl.spawnBlockAST('@operator_math_op(1, +, 2);');
        expect(inputOf(ast, 'OPERATOR')?.shadow).toMatchObject({
            type: 'math_operator_menu',
            fields: { ASH_BLOCKMENU: '_ADD_' },
        });
    });

    it('嵌套调用生成 block 而不是 shadow', async () => {
        const ast = await dsl.spawnBlockAST(
            '@control_flow_waitUntil(@operator_logic_compare(1, <, 2));',
        );
        expect(inputOf(ast, 'CONDITION')?.block?.type).toBe('operator_logic_compare');
    });

    it('嵌套积木类型不符时报清晰的 DSL 错误', async () => {
        await expect(
            dsl.spawnBlockAST('@control_flow_waitUntil(@operator_math_op(1, 2));'),
        ).rejects.toThrow(/DSL type error/);
    });

    it('[] 逃逸舱直接写入任意序列化状态', async () => {
        const ast = await dsl.spawnBlockAST(
            `@data_variable_set["{ fields: { NAME: 'score' }, extraState: { dataId: 'v1' } }"]();`,
        );
        expect(ast).toMatchObject({
            type: 'data_variable_set',
            fields: { NAME: 'score' },
            extraState: { dataId: 'v1' },
        });
    });

    it('[] 与 () 合并时 () 优先', async () => {
        const ast = await dsl.spawnBlockAST(
            `@data_variable_set["{ fields: { NAME: 'fromPayload' } }"](<fromArgs>, 1);`,
        );
        expect(ast?.fields?.NAME).toBe('fromArgs');
    });

    it('[] 支持宽松对象语法（无引号键/单引号/尾逗号/注释/嵌套）', async () => {
        const ast = await dsl.spawnBlockAST(
            `@whatever["{ a: 1, b: 'two', c: [1, 2,], d: { e: true }, // 注释\n }"]();`,
        );
        expect(ast).toMatchObject({
            type: 'whatever',
            a: 1,
            b: 'two',
            c: [1, 2],
            d: { e: true },
        });
    });
});

describe('语法糖：$ 与 !', () => {
    it('$变量 生成变量取值积木（符号名，不要求已存在）', async () => {
        const ast = await dsl.spawnBlockAST('$score;');
        expect(ast).toMatchObject({
            type: 'data_variable_get',
            fields: { NAME: 'score' },
            extraState: { dataId: 'score' },
        });
    });

    it('$变量 可作为 value 使用', async () => {
        const ast = await dsl.spawnBlockAST('@entity_transform_position_moveStep($score);');
        expect(inputOf(ast, 'STEPS')?.block).toMatchObject({
            type: 'data_variable_get',
            fields: { NAME: 'score' },
        });
    });

    it('!true 走 block，!s_false 走 shadow', async () => {
        const asBlock = await dsl.spawnBlockAST('@control_flow_waitUntil(!true);');
        expect(inputOf(asBlock, 'CONDITION')?.block).toMatchObject({
            type: 'operator_logic_boolean',
            extraState: { value: true },
        });
        expect(inputOf(asBlock, 'CONDITION')?.shadow).toBeUndefined();

        const asShadow = await dsl.spawnBlockAST('@control_flow_waitUntil(!s_false);');
        expect(inputOf(asShadow, 'CONDITION')?.shadow).toMatchObject({
            type: 'operator_logic_boolean',
            extraState: { value: false },
        });
        expect(inputOf(asShadow, 'CONDITION')?.block).toBeUndefined();
    });

    it('!s_false 继承父块颜色，而不是 operator.tertiary', async () => {
        const ast = await dsl.spawnBlockAST('@control_flow_waitUntil(!s_false);');
        if (!ast) throw new Error('no AST');
        const svg = await dsl.spawnBlocksSvg(ast);
        expect(svg).not.toContain('#3D963D'); // operator.tertiary：没继承父色
        expect(svg).toContain('#ffab19'); // control.primary，父块颜色
    });
});

describe('符号变量与函数执行', () => {
    it('变量 set/add 支持符号名', async () => {
        const ast = await dsl.spawnBlockAST('@data_variable_set(<score>, 1);');
        expect(ast?.fields?.NAME).toBe('score');
        if (!ast) throw new Error('no AST');
        const svg = await dsl.spawnBlocksSvg(ast);
        expect(svg).toContain('score');
    });

    it('!f_execute 手动参数渲染出提示文字', async () => {
        const ast = await dsl.spawnBlockAST(
            '!f_execute(!false, !f_use("#6cf", "ABC"), !f_param("String", "Test"));',
        );
        if (!ast) throw new Error('no AST');
        const svg = await dsl.spawnBlocksSvg(ast);
        expect(svg).toContain('Test');
    });
});

describe('注释', () => {
    it('// 与 /* */ 注释被忽略', async () => {
        const ast = await dsl.spawnBlockAST(`
// 行注释
@entity_transform_position_moveStep(/* 块注释 */ 10);
`);
        expect(ast?.type).toBe('entity_transform_position_moveStep');
        expect(inputOf(ast, 'STEPS')?.shadow).toMatchObject({
            type: 'math_number',
            fields: { NUM: 10 },
        });
    });
});

describe('#define / #()', () => {
    it('宏替换到值位置', async () => {
        const ast = await dsl.spawnBlockAST(`
#define(ten, 10);
@entity_transform_position_moveStep(#(ten));
`);
        expect(ast?.type).toBe('entity_transform_position_moveStep');
        expect(inputOf(ast, 'STEPS')?.shadow).toMatchObject({
            type: 'math_number',
            fields: { NUM: 10 },
        });
    });

    it('宏替换到语句位置', async () => {
        const ast = await dsl.spawnBlockAST(`
#define(move, @entity_transform_position_moveStep(10));
#(move);
`);
        expect(ast?.type).toBe('entity_transform_position_moveStep');
    });

    it('宏可拼接参数（token 替换）', async () => {
        const ast = await dsl.spawnBlockAST(`
#define(move, @entity_transform_position_moveStep);
#(move)(10);
`);
        expect(ast?.type).toBe('entity_transform_position_moveStep');
        expect(inputOf(ast, 'STEPS')?.shadow).toMatchObject({
            type: 'math_number',
            fields: { NUM: 10 },
        });
    });

    it('undefined macro errors', async () => {
        await expect(
            dsl.spawnBlockAST('@entity_transform_position_moveStep(#(nope));'),
        ).rejects.toThrow(/is not defined/);
    });
});

describe('函数族 !f_*', () => {
    it('!f_use 生成带签名的函数值', async () => {
        const ast = await dsl.spawnBlockAST(
            '!f_use("#0099ff", "Let", !f_param("String", "a"), "To", !p_dropdown(!false, "UPPER"));',
        );
        expect(ast?.type).toBe('function_value');
        const extra = ast?.extraState as { params?: unknown[] };
        expect(extra.params).toHaveLength(4);
        if (!ast) throw new Error('no AST');
        const svg = await dsl.spawnBlocksSvg(ast);
        // 函数值模式的参数渲染成提示文字样式
        expect(svg).toContain('blockly-function-value-shadow');
    });

    it('!f_define 生成定义帽 + 嵌套签名', async () => {
        const ast = await dsl.spawnBlockAST('!f_define("#0099ff", "do", !f_param("String", "a"));');
        expect(ast?.type).toBe('function_definition');
        expect(inputOf(ast, 'NAME')?.block?.type).toBe('function_value');
        await renderOk(ast);
    });

    it('!f_inline 生成行内函数', async () => {
        const ast = await dsl.spawnBlockAST('!f_inline("None", !f_param("String", "content"));');
        expect(ast?.type).toBe('function_inline');
        await renderOk(ast);
    });

    it('!f_execute 接入函数值并自动同步参数', async () => {
        const ast = await dsl.spawnBlockAST(
            '!f_execute(!true, !f_use("#ff6680", "do", !f_param("String", "a")));',
        );
        expect(ast?.type).toBe('function_execute');
        expect(inputOf(ast, 'FUNCTION')?.block?.type).toBe('function_value');
        await renderOk(ast);
    });

    it('!f_inline 后面的 {} 是函数体', async () => {
        const ast = await dsl.spawnBlockAST(
            '!f_inline("None", !f_param("String", "x")) { @debug_breakpoint; }',
        );
        expect(ast?.type).toBe('function_inline');
        expect(inputOf(ast, 'DO')?.block?.type).toBe('debug_breakpoint');
        await renderOk(ast);
    });

    it('!f_execute 自动适配 !f_inline 的参数', async () => {
        const ast = await dsl.spawnBlockAST(
            '!f_execute(!true, !f_inline("None", !f_param("Object", "Hello")));',
        );
        expect(ast?.extraState).toMatchObject({
            autoSync: true,
            args: [{ id: 'dsl_p0', name: 'Hello', type: 'Object' }],
        });
        if (!ast) throw new Error('no AST');
        const svg = await dsl.spawnBlocksSvg(ast);
        // Hello 出现两次：inline 签名里的参数 + caller 实参槽的提示
        expect((svg.match(/Hello/g) ?? []).length).toBeGreaterThanOrEqual(2);
    });

    it('!f_rexecute 生成 function_call', async () => {
        const ast = await dsl.spawnBlockAST(
            '!f_rexecute(!true, "Number", !f_use("#ff6680", "do", !f_param("Number", "a")));',
        );
        expect(ast?.type).toBe('function_call');
        await renderOk(ast);
    });
});

describe('动态积木', () => {
    it('if 带 else 写入 mutation 的 extraState', async () => {
        const ast = await dsl.spawnBlockAST(
            '@control_condition_if(true, { @debug_breakpoint; }, { @debug_breakpoint; });',
        );
        expect(inputOf(ast, 'DO')?.block?.type).toBe('debug_breakpoint');
        expect(inputOf(ast, 'ELSE_DO')?.block?.type).toBe('debug_breakpoint');
        expect(ast?.extraState).toMatchObject({ elseIfCount: 0, hasElse: true });
        await renderOk(ast);
    });

    it('if 带 else if 展开 ELSE_IF_* 动态槽', async () => {
        const ast = await dsl.spawnBlockAST(
            '@control_condition_if(true, { @debug_breakpoint; }, false, { @debug_breakpoint; }, { @debug_breakpoint; });',
        );
        expect(inputOf(ast, 'ELSE_IF_CONDITION_0')?.shadow).toMatchObject({
            type: 'operator_logic_boolean',
        });
        expect(inputOf(ast, 'ELSE_IF_DO_0')?.block?.type).toBe('debug_breakpoint');
        expect(inputOf(ast, 'ELSE_DO')?.block?.type).toBe('debug_breakpoint');
        expect(ast?.extraState).toMatchObject({ elseIfCount: 1, hasElse: true });
        await renderOk(ast);
    });
});

describe('其它动态积木', () => {
    it('字符串拼接按多余参数展开 DATAi', async () => {
        const ast = await dsl.spawnBlockAST('@data_string_join("a", "b", "c");');
        expect(ast?.extraState).toMatchObject({ itemCount: 3 });
        expect(inputOf(ast, 'DATA0')).toBeDefined();
        expect(inputOf(ast, 'DATA2')).toBeDefined();
        await renderOk(ast);
    });

    it('克隆按值对展开行', async () => {
        const ast = await dsl.spawnBlockAST('@entity_lifecycle_clone("hp", 10);');
        expect(ast?.extraState).toMatchObject({ itemCount: 1 });
        expect(inputOf(ast, 'DATA0')).toBeDefined();
        expect(inputOf(ast, 'DATA0_CONTENT')).toBeDefined();
        await renderOk(ast);
    });

    it('自动模式下实参值接进插槽', async () => {
        const ast = await dsl.spawnBlockAST(
            '!f_execute(!true, !f_inline("None", !f_param("String", "a")), $myVar);',
        );
        const argInput = inputOf(ast, 'ARG_dsl_p0');
        expect(argInput?.block).toMatchObject({ type: 'data_variable_get' });
        await renderOk(ast);
    });
});

describe('整簇 DSL', () => {
    const cluster = `
@event_lifecycle_onStart;
@entity_transform_position_moveStep(10);
@entity_appearance_images_showImage("hello world");
@entity_transform_layer_setLayer(@entity_transform_layer_getLayer);
@control_flow_waitUntil(@operator_logic_compare(1, <, 2));
@entity_transform_position_moveStep($score);
@control_condition_if(@operator_logic_compare(1, <, 2), {
    @entity_transform_position_moveStep(1);
    @entity_appearance_images_showImage("hello world");
}, {
    @control_flow_waitUntil(!s_false);
});
`;

    it('整簇能生成正确的 next 栈', async () => {
        const ast = await dsl.spawnBlockAST(cluster);
        expect(chainTypes(ast)).toEqual([
            'event_lifecycle_onStart',
            'entity_transform_position_moveStep',
            'entity_appearance_images_showImage',
            'entity_transform_layer_setLayer',
            'control_flow_waitUntil',
            'entity_transform_position_moveStep',
            'control_condition_if',
        ]);
    });

    it('整簇内部结构正确', async () => {
        const ast = await dsl.spawnBlockAST(cluster);
        const ifBlock = chainAt(ast, 6);
        expect(ifBlock?.type).toBe('control_condition_if');
        expect(inputOf(ifBlock, 'DO')?.block?.type).toBe('entity_transform_position_moveStep');
        expect(inputOf(ifBlock, 'ELSE_DO')?.block?.type).toBe('control_flow_waitUntil');
        expect(ifBlock?.extraState).toMatchObject({ elseIfCount: 0, hasElse: true });
        await renderOk(ast);
    });

    it('整簇能端到端渲染', async () => {
        const ast = await dsl.spawnBlockAST(cluster);
        await renderOk(ast);
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
                    failures.push(`${type}: no AST`);
                    continue;
                }
                const svg = await dsl.spawnBlocksSvg(ast);
                if (!svg.includes('<svg')) failures.push(`${type}: SVG 输出异常`);
            } catch (error) {
                failures.push(`${type}: ${(error as Error).message}`);
            }
        }
        expect(failures, failures.join('\n')).toEqual([]);
    }, 60000);
});
