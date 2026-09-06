/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { extraState, field, fieldString, inputBlock } from './state';
import { OPCODES } from '../types/vm/blocks';
import type { IJitHost, TBlockState } from './types';

/** 基础数值，Scratch 式：非数值转 0 */
export function toNumber(v: unknown): number {
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
}

/** 真值判定 */
export function toBoolean(v: unknown): boolean {
    return !!(v && v !== 'false');
}

/** 字符串化 */
export function toText(v: unknown): string {
    if (typeof v === 'string') return v;
    if (v === null || v === undefined) return '';
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
    return JSON.stringify(v);
}

/** 读一个输入连接到的"菜单块"选中的值（ASH_BLOCKMENU 字段） */
export function menuOf(block: TBlockState, inputName: string): string {
    const child = inputBlock(block, inputName);
    return child ? fieldString(child, 'ASH_BLOCKMENU') : '';
}

/** 数值取模（Scratch 风格，结果回 [0, mod)） */
export function cyclic(v: number, mod: number): number {
    if (mod === 0) return 0;
    let r = v % mod;
    if (r < 0) r += mod;
    return r;
}

/** 运算符值字符串 → 实际二元运算 */
export function applyBinary(op: string, a: unknown, b: unknown): number {
    const x = toNumber(a);
    const y = toNumber(b);
    switch (op) {
        case '_ADD_':
        case '+':
            return x + y;
        case '_SUBTRACT_':
        case '-':
            return x - y;
        case '_MULTIPLY_':
        case '*':
            return x * y;
        case '_DIVIDE_':
        case '/':
            return x / y;
        case '_MODULO_':
        case '%':
            return cyclic(x, y);
        case '_POWER_':
        case '^':
            return Math.pow(x, y);
        default:
            return 0;
    }
}

/** 比较运算符值字符串 → 结果 */
export function applyCompare(op: string, a: unknown, b: unknown): boolean {
    switch (op) {
        case '_EQUALS_':
        case '=':
            return toText(a) === toText(b);
        case '_NOT_EQUALS_':
        case '!=':
            return toText(a) !== toText(b);
        case '_LESS_THAN_':
        case '<':
            return toNumber(a) < toNumber(b);
        case '_GREATER_THAN_':
        case '>':
            return toNumber(a) > toNumber(b);
        case '_LESS_THAN_OR_EQUAL_':
        case '<=':
            return toNumber(a) <= toNumber(b);
        case '_GREATER_THAN_OR_EQUAL_':
        case '>=':
            return toNumber(a) >= toNumber(b);
        default:
            return false;
    }
}

/** 科学函数 */
export function applyScientific(fn: string, v: unknown): number {
    const n = toNumber(v);
    switch (fn) {
        case '_SIN_':
        case 'sin':
            return Math.sin((n * Math.PI) / 180);
        case '_COS_':
        case 'cos':
            return Math.cos((n * Math.PI) / 180);
        case '_TAN_':
        case 'tan':
            return Math.tan((n * Math.PI) / 180);
        case '_ABS_':
        case 'abs':
            return Math.abs(n);
        case '_LOG_':
        case 'ln':
            return Math.log(n);
        case '_FLOOR_':
        case 'floor':
            return Math.floor(n);
        case '_CEILING_':
        case 'ceil':
            return Math.ceil(n);
        case '_SQRT_':
        case 'sqrt':
            return Math.sqrt(n);
        case '_EXP_':
        case 'exp':
            return Math.exp(n);
        case '_ROUND_':
        case 'round':
            return Math.round(n);
        default:
            return 0;
    }
}

/**
 * 求值一个"取值块"（reporter / 表达式），这是解释器与 JIT 共享的运行时语义。
 */
export function evalValue(block: TBlockState | undefined, ctx: IJitHost): unknown {
    if (!block) return undefined;
    const type = block.type;
    switch (type) {
        // ---- 原子：数值 / 文本 / 颜色 ----
        case OPCODES.math_number:
            return toNumber(field(block, 'NUM'));
        case OPCODES.text:
            return fieldString(block, 'TEXT');
        case OPCODES.colour_picker:
            return fieldString(block, 'COLOUR') || '#000000';

        // ---- 数学 ----
        case OPCODES.OPERATOR_MATH_OP:
            return applyBinary(
                menuOf(block, 'OPERATOR'),
                evalInput(block, 'LEFT', ctx),
                evalInput(block, 'RIGHT', ctx),
            );
        case OPCODES.OPERATOR_MATH_RANDOM: {
            const from = toNumber(evalInput(block, 'FROM', ctx));
            const to = toNumber(evalInput(block, 'TO', ctx));
            const low = Math.min(from, to);
            const high = Math.max(from, to);
            return Math.floor(low + Math.random() * (high - low + 1));
        }
        case OPCODES.OPERATOR_MATH_MIN:
            return Math.min(toNumber(evalInput(block, 'LEFT', ctx)), toNumber(evalInput(block, 'RIGHT', ctx)));
        case OPCODES.OPERATOR_MATH_MAX:
            return Math.max(toNumber(evalInput(block, 'LEFT', ctx)), toNumber(evalInput(block, 'RIGHT', ctx)));
        case OPCODES.OPERATOR_MATH_CLAMP: {
            const value = toNumber(evalInput(block, 'VALUE', ctx));
            const min = toNumber(evalInput(block, 'MIN', ctx));
            const max = toNumber(evalInput(block, 'MAX', ctx));
            return Math.min(Math.max(value, min), max);
        }

        // ---- 逻辑 ----
        case OPCODES.OPERATOR_LOGIC_COMPARE:
            return applyCompare(
                menuOf(block, 'OPERATOR'),
                evalInput(block, 'LEFT', ctx),
                evalInput(block, 'RIGHT', ctx),
            );
        case OPCODES.OPERATOR_LOGIC_OPERATION: {
            const operand = menuOf(block, 'OPERATOR');
            const a = toBoolean(evalInput(block, 'LEFT', ctx));
            const b = toBoolean(evalInput(block, 'RIGHT', ctx));
            return operand === '_AND_' ? a && b : a || b;
        }
        case OPCODES.OPERATOR_LOGIC_NOT:
            return !toBoolean(evalInput(block, 'VALUE', ctx));
        case OPCODES.OPERATOR_LOGIC_BOOLEAN:
            return extraState(block).value !== false;
        case OPCODES.OPERATOR_LOGIC_TERNARY:
            return toBoolean(evalInput(block, 'CONDITION', ctx))
                ? evalInput(block, 'THEN', ctx)
                : evalInput(block, 'ELSE', ctx);
        case OPCODES.OPERATOR_SCIENTIFIC_FUNC:
            return applyScientific(menuOf(block, 'FUNCTION'), evalInput(block, 'VALUE', ctx));

        // ---- 数据 ----
        case OPCODES.ENTITY_TRANSFORM_POSITION_GETPOSITION: {
            const portal = ctx.readPortal();
            return menuOf(block, 'POSITION') === 'y' ? portal.y : portal.x;
        }
        case OPCODES.DATA_VARIABLE_GET:
            return ctx.readVariable(extraState(block).dataId ?? '');
        case OPCODES.DATA_STRING_JOIN: {
            let out = '';
            const count = extraState(block).itemCount ?? 0;
            // Blockly 状态中 itemCount 可能缺失，退化到最大 8 个 DATA 槽
            const slots = count > 0 ? count : 8;
            for (let i = 0; i < slots; i++) {
                const slotBlock = inputBlock(block, 'DATA' + String(i));
                if (slotBlock) out += toText(evalValue(slotBlock, ctx));
                else break;
            }
            return out;
        }
        case OPCODES.DATA_STRING_LENGTH:
            return toText(evalInput(block, 'TEXT', ctx)).length;

        // ---- 广播数据源块：返回最近一次广播携带的数据 ----
        case OPCODES.EVENT_BROADCAST_DATA:
            return ctx.readBroadcastData();

        // ---- 菜单块：直接返回选中值 ----
        default: {
            const direct = field(block, 'ASH_BLOCKMENU');
            if (direct !== undefined) return toText(direct);
            return undefined;
        }
    }
}

/** 求值某个输入槽（表达式），无连接返回 undefined */
export function evalInput(block: TBlockState, name: string, ctx: IJitHost): unknown {
    const child = inputBlock(block, name);
    if (!child) return undefined;
    return evalValue(child, ctx);
}