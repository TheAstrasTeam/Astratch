/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AST → Blockly 序列化状态
 *
 * 核心规则：三类参数（field / value / statement）各自按出现顺序填到同类槽位；
 * 静态槽用完后剩下的参数交给 {@link _BlockOverrides} 的 dynamic 适配器
 */

import type * as Blockly from 'blockly';
import { OPCODES } from '../../types/vm/blocks';
import { _BlockOverrides, _BlocksDefinitions } from './definitions';
import type { IFieldSlot, TAtom, TNode, TState, TValueExpr } from './types';

/** 把原子按 field 的类型 / 选项转成可写入序列化的值 */
export const coerceField = (slot: IFieldSlot, atom: TAtom): unknown => {
    if (slot.options) {
        for (const option of slot.options) {
            if (option === 'separator') continue;
            const [label, value] = option;
            if (label === atom || value === atom) return value;
        }
    }
    if (slot.numeric) {
        const number = Number(atom);
        if (Number.isFinite(number)) return number;
    }
    return atom;
};

/** 两个 check 有交集即兼容；任一方为空表示不限 */
export const isCompatible = (output: string[] | null, check: string[] | null): boolean => {
    if (!check || check.length === 0) return true;
    if (!output || output.length === 0) return true;
    return check.some(item => output.includes(item));
};

export const formatCheck = (check: string[] | null): string =>
    check && check.length > 0 ? check.join(' | ') : 'any';

/** 原子 → shadow 状态：优先用 toolbox 给的 shadow 类型，再按类型把原子写进它的 field */
export const atomToShadow = (shadowType: string | null, atom: TAtom): TState => {
    const type =
        shadowType ??
        (typeof atom === 'number'
            ? OPCODES.math_number
            : typeof atom === 'boolean'
              ? OPCODES.OPERATOR_LOGIC_BOOLEAN
              : OPCODES.text);
    const slot = _BlocksDefinitions[type]?.fields[0];
    if (slot) return { type, fields: { [slot.name]: coerceField(slot, atom) } };
    if (typeof atom === 'boolean') return { type, extraState: { value: atom } };
    return { type };
};

/** 取数组指定下标，越界返回 undefined（槽位用完后忽略多余参数） */
export const pick = <T>(items: T[], index: number): T | undefined => items[index];

/** 一串语句 → 用 next 串起来的积木栈，返回栈顶 */
export function buildScript(nodes: TNode[]): TState | undefined {
    if (nodes.length === 0) return undefined;
    const head = buildNode(nodes[0]);
    let tail = head;
    for (let index = 1; index < nodes.length; index++) {
        const next = buildNode(nodes[index]);
        tail.next = { block: next };
        tail = next;
    }
    return head;
}

/** 单个积木 → 序列化状态 */
export function buildNode(node: TNode): TState {
    const payload = node.state ?? {};
    // 读不到定义也继续：[] 逃逸舱和 _BlockOverrides 可能自带全部信息
    const definition = _BlocksDefinitions[node.opcode] ?? {
        fields: [],
        values: [],
        statements: [],
        output: null,
    };
    const state = { ...payload, type: node.opcode } as TState;

    let fieldIndex = 0;
    let valueIndex = 0;
    let statementIndex = 0;
    let filledValues = 0;
    let filledStatements = 0;
    const fields: Record<string, unknown> = {};
    const inputs: Record<string, Blockly.serialization.blocks.ConnectionState> = {};
    const leftoverValues: TValueExpr[] = [];
    const leftoverStatements: TNode[][] = [];

    /** 把一个 value 表达式写进某个输入 */
    const assignValue = (
        name: string,
        check: string[] | null,
        shadowType: string | null,
        expr: TValueExpr,
    ): void => {
        if (expr.kind === 'skip') return;
        if (expr.kind === 'state') {
            inputs[name] = expr.shadow ? { shadow: expr.state } : { block: expr.state };
            return;
        }
        if (expr.kind === 'call') {
            const nested = _BlocksDefinitions[expr.node.opcode];
            if (!isCompatible(nested?.output ?? null, check)) {
                throw new Error(
                    `DSL type error: '${expr.node.opcode}' outputs ${formatCheck(nested?.output ?? null)}, ` +
                        `but '${node.opcode}.${name}' requires ${formatCheck(check)}`,
                );
            }
            inputs[name] = { block: buildNode(expr.node) };
        } else {
            inputs[name] = { shadow: atomToShadow(shadowType, expr.value) };
        }
    };

    for (const arg of node.args) {
        if (arg.kind === 'field') {
            const slot = pick(definition.fields, fieldIndex++);
            if (slot) fields[slot.name] = coerceField(slot, arg.value);
        } else if (arg.kind === 'statement') {
            const slot = pick(definition.statements, statementIndex++);
            const head = buildScript(arg.body);
            if (slot && head) {
                inputs[slot.name] = { block: head };
                filledStatements++;
            } else if (!slot) {
                leftoverStatements.push(arg.body);
            }
        } else {
            const slot = pick(definition.values, valueIndex++);
            if (!slot) {
                leftoverValues.push(arg.expr);
                continue;
            }
            assignValue(slot.name, slot.check, slot.shadowType, arg.expr);
            filledValues++;
        }
    }

    // 静态槽之外剩下的参数交给动态积木适配器（mutation / updateShape）
    const dynamic = _BlockOverrides[node.opcode]?.dynamic;
    if (dynamic && (leftoverValues.length > 0 || leftoverStatements.length > 0)) {
        const extra = dynamic({
            values: leftoverValues,
            statements: leftoverStatements,
            consumed: { values: filledValues, statements: filledStatements },
        });
        if (extra) {
            (extra.values ?? []).forEach((slot, index) => {
                const expr = leftoverValues.at(index);
                if (expr) assignValue(slot.name, slot.check, slot.shadowType, expr);
            });
            (extra.statements ?? []).forEach((slot, index) => {
                const body = leftoverStatements.at(index);
                const head = body ? buildScript(body) : undefined;
                if (head) inputs[slot.name] = { block: head };
            });
            if (extra.extraState !== undefined) state.extraState = extra.extraState;
        }
    }

    // [] 逃逸舱的状态作为底，() 派生的字段 / 输入覆盖其上
    const baseFields = (payload.fields ?? {}) as Record<string, unknown>;
    const baseInputs = (payload.inputs ?? {}) as Record<
        string,
        Blockly.serialization.blocks.ConnectionState
    >;
    const mergedFields = { ...baseFields, ...fields };
    const mergedInputs = { ...baseInputs, ...inputs };
    if (Object.keys(mergedFields).length > 0) state.fields = mergedFields;
    if (Object.keys(mergedInputs).length > 0) state.inputs = mergedInputs;
    return state;
}
