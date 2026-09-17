/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 槽位表：遍历已注册积木，把每个积木的 field / value / statement 拍平成有序列
 * mutation 积木静态读不到的部分在 _BlockOverrides 里手动补
 */

import * as Blockly from 'blockly';
import { OPCODES } from '../../types/vm/blocks';
import getToolbox from '../../lib/BlocklyAdapter/toolbox';
import type {
    IBlockDefinition,
    IBlockOverride,
    IFieldSlot,
    IStatementSlot,
    IValueSlot,
    TMenuOption,
} from './types';

/** 由积木定义反推出来的槽位表，由 {@link refreshBlocksDefinitions} 填充 */
export let _BlocksDefinitions: Record<string, IBlockDefinition | undefined> = {};

/**
 * mutation 积木（updateShape 生成的槽）静态读不到，需要手动补
 * `dynamic` 在静态槽填完后用剩余参数补齐动态槽，并给出 extraState
 */
export const _BlockOverrides: Record<string, IBlockOverride | undefined> = {
    [OPCODES.CONTROL_CONDITION_IF]: {
        dynamic: ({ values, statements }) => {
            const elseIfCount = values.length;
            const hasElse = statements.length === elseIfCount + 1;
            if (statements.length !== elseIfCount && !hasElse) {
                throw new Error(
                    `control_condition_if：${String(values.length)} 个 else if 条件配了 ${String(statements.length)} 个 {}，数量不匹配`,
                );
            }
            const extraValues: IValueSlot[] = [];
            const extraStatements: IStatementSlot[] = [];
            for (let index = 0; index < elseIfCount; index++) {
                extraValues.push({
                    name: `ELSE_IF_CONDITION_${String(index)}`,
                    shadowType: OPCODES.OPERATOR_LOGIC_BOOLEAN,
                    check: ['Boolean'],
                });
                extraStatements.push({ name: `ELSE_IF_DO_${String(index)}`, check: ['Action'] });
            }
            if (hasElse) extraStatements.push({ name: 'ELSE_DO', check: ['Action'] });
            return {
                values: extraValues,
                statements: extraStatements,
                extraState: { elseIfCount, hasElse },
            };
        },
    },
    // 字符串拼接：多出来的 value 就是各个 DATAi
    [OPCODES.DATA_STRING_JOIN]: {
        dynamic: ({ values, consumed }) => {
            const start = consumed.values;
            return {
                values: values.map((_, index) => ({
                    name: `DATA${String(start + index)}`,
                    shadowType: null,
                    check: ['Number', 'String'],
                })),
                extraState: { itemCount: start + values.length },
            };
        },
    },
    // 克隆：每两个 value 是一行（DATAi / DATAi_CONTENT）
    [OPCODES.ENTITY_LIFECYCLE_CLONE]: {
        dynamic: ({ values, consumed }) => {
            const existingRows = Math.floor(consumed.values / 2);
            const rows = Math.ceil(values.length / 2);
            const slots: IValueSlot[] = [];
            for (let index = 0; index < rows; index++) {
                const row = existingRows + index;
                slots.push({ name: `DATA${String(row)}`, shadowType: null, check: null });
                slots.push({ name: `DATA${String(row)}_CONTENT`, shadowType: null, check: null });
            }
            return { values: slots, extraState: { itemCount: existingRows + rows } };
        },
    },
};

/** 收集 toolbox 里每个积木各 value 输入的默认 shadow 类型 */
const collectShadowTypes = async (): Promise<Map<string, Map<string, string>>> => {
    const toolbox = await getToolbox();
    const result = new Map<string, Map<string, string>>();

    const walk = (items: readonly unknown[]) => {
        for (const item of items) {
            const node = item as {
                kind?: string;
                type?: string;
                inputs?: Record<string, { shadow?: { type?: string } }>;
                contents?: unknown[];
            };
            if (node.kind === 'block' && typeof node.type === 'string') {
                let entry = result.get(node.type);
                if (!entry) {
                    entry = new Map<string, string>();
                    result.set(node.type, entry);
                }
                for (const [name, value] of Object.entries(node.inputs ?? {})) {
                    const shadowType = value.shadow?.type;
                    if (shadowType !== undefined && !entry.has(name)) entry.set(name, shadowType);
                }
            }
            walk(node.contents ?? []);
        }
    };

    walk(toolbox.contents);
    return result;
};

/** 读取下拉 field 的选项；动态菜单可能依赖运行时状态，读不到就返回 null */
const readOptions = (field: Blockly.Field): TMenuOption[] | null => {
    const dropdown = field as Blockly.Field & {
        getOptions?: (useCache?: boolean) => TMenuOption[];
    };
    if (typeof dropdown.getOptions !== 'function') return null;
    try {
        return dropdown.getOptions(false);
    } catch {
        return null;
    }
};

/** 重建整个槽位表（先清空，避免已注销的积木留下陈旧槽位） */
export const refreshBlocksDefinitions = async (): Promise<void> => {
    const shadowTypes = await collectShadowTypes();
    const workspace = new Blockly.Workspace();

    _BlocksDefinitions = {};

    try {
        for (const type of Object.keys(Blockly.Blocks)) {
            try {
                const block = workspace.newBlock(type);
                const fields: IFieldSlot[] = [];
                const values: IValueSlot[] = [];
                const statements: IStatementSlot[] = [];

                for (const input of block.inputList) {
                    // field：message0 里的文字是 FieldLabel，isSerializable() 会把它过滤掉
                    for (const field of input.fieldRow) {
                        if (!field.isSerializable() || !field.name) continue;
                        const value = field.getValue() as unknown;
                        fields.push({
                            name: field.name,
                            options: readOptions(field),
                            numeric: typeof value === 'number',
                            value,
                        });
                    }

                    // connection：DUMMY / END_ROW 没有 connection，天然被跳过
                    const connection = input.connection;
                    if (!connection) continue;
                    if (input.type === Blockly.inputs.inputTypes.STATEMENT) {
                        statements.push({ name: input.name, check: connection.getCheck() });
                    } else {
                        values.push({
                            name: input.name,
                            shadowType: shadowTypes.get(type)?.get(input.name) ?? null,
                            check: connection.getCheck(),
                        });
                    }
                }

                const override = _BlockOverrides[type];
                if (override) {
                    for (const field of override.fields ?? []) {
                        if (!fields.some(exist => exist.name === field.name)) fields.push(field);
                    }
                    for (const value of override.values ?? []) {
                        if (!values.some(exist => exist.name === value.name)) values.push(value);
                    }
                    for (const statement of override.statements ?? []) {
                        if (!statements.some(exist => exist.name === statement.name)) {
                            statements.push(statement);
                        }
                    }
                }

                _BlocksDefinitions[type] = {
                    fields,
                    values,
                    statements,
                    output: block.outputConnection?.getCheck() ?? null,
                };
            } catch {
                // 少数动态积木 init 依赖运行时状态；读不到就跳过，用 _BlockOverrides 手动补
            }
        }
    } finally {
        workspace.dispose();
    }
};

/** 只读槽位表，供测试 / 调试枚举全部积木 */
export const getBlocksDefinitions = (): Record<string, IBlockDefinition | undefined> =>
    _BlocksDefinitions;
