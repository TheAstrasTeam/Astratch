/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DSL 的类型定义，按职责分三组：槽位表、AST、动态积木适配器
 */

import type * as Blockly from 'blockly';

export type TState = Blockly.serialization.blocks.State;

/** 下拉选项（宽松版，避免依赖 Blockly 的具体类型） */
export type TMenuOption = [unknown, string] | 'separator';

//  槽位表：从积木定义反推出来的字段 / 输入

/** field 槽（下拉 / 数字 / 文本） */
export interface IFieldSlot {
    name: string;
    /** 下拉选项；非下拉为 null */
    options: TMenuOption[] | null;
    /** 是否数值型 field，用于把原子转成 number */
    numeric: boolean;
    /** 默认值 */
    value: unknown;
}

/** value 输入槽 */
export interface IValueSlot {
    name: string;
    /** toolbox 里该输入的默认 shadow 积木类型 */
    shadowType: string | null;
    /** 连接的 check（如 ['Number']）；null 表示不限 */
    check: string[] | null;
}

/** statement 输入槽 */
export interface IStatementSlot {
    name: string;
    check: string[] | null;
}

/** 一个积木的完整槽位表 */
export interface IBlockDefinition {
    fields: IFieldSlot[];
    values: IValueSlot[];
    statements: IStatementSlot[];
    /** 输出连接的 check（reporter 积木）；null 表示没有输出或不限 */
    output: string[] | null;
}

//  DSL AST

/** 字面量 */
export type TAtom = number | string | boolean;

/** value 位置的表达式 */
export type TValueExpr =
    | { kind: 'atom'; value: TAtom }
    | { kind: 'call'; node: TNode }
    | { kind: 'state'; state: TState; shadow: boolean }
    | { kind: 'skip' };

/** `(...)` 里的一个参数 */
export type TArg =
    | { kind: 'field'; value: TAtom }
    | { kind: 'statement'; body: TNode[] }
    | { kind: 'value'; expr: TValueExpr };

/** 一个积木节点 */
export interface TNode {
    opcode: string;
    args: TArg[];
    /** 来自 `[]` 逃逸舱的原始序列化状态，会合并进最终 state */
    state?: Record<string, unknown>;
}

/** `!f_*` / `!p_dropdown` 参数列表里的一个项 */
export type TSugarArg =
    | { kind: 'atom'; value: TAtom }
    | { kind: 'bool'; value: boolean; shadow: boolean }
    | { kind: 'param'; mode: string; name: string }
    | { kind: 'dropdown'; allowBlocks: boolean; name: string }
    | { kind: 'node'; node: TNode };

//  动态积木（mutation / updateShape）

/** 静态槽填完后剩下的参数 */
export interface IDynamicContext {
    values: TValueExpr[];
    statements: TNode[][];
    /** 已经填掉的静态槽数量，动态槽从这里接着编号 */
    consumed: { values: number; statements: number };
}

/** 动态槽位补充结果 */
export interface IDynamicResult {
    values?: IValueSlot[];
    statements?: IStatementSlot[];
    /** mutation 的 extraState，加载时让积木长出这些槽 */
    extraState?: unknown;
}

/** mutation 积木的手动适配器 */
export interface IBlockOverride extends Partial<IBlockDefinition> {
    dynamic?: (leftover: IDynamicContext) => IDynamicResult | undefined;
}
