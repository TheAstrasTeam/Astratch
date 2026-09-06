/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 *
 * JIT 编译器：把块图直接翻译成 JS 源码再执行。
 *
 * 这里的 `new Function` 是 JIT 代码生成的核心（与 TurboWarp ir/compiler 一致），
 * 仅在编译自身闭包，不执行外部输入，故豁免 no-implied-eval。
 */
/* eslint-disable @typescript-eslint/no-implied-eval */

import { extraState, field, fieldString, inputBlock } from './state';
import { OPCODES } from '../types/vm/blocks';
import {
    applyBinary,
    applyCompare,
    applyScientific,
    cyclic,
    toBoolean,
    toNumber,
    toText,
} from './eval';
import type { IJitHost, TBlockState } from './types';

/**
 * JIT 编译失败：该脚本含编译不支持的结构 → 引擎回退到解释器，保证语义一致。
 */
export class JitUnsupportedError extends Error {
    readonly opcode: string;
    constructor(opcode: string) {
        super(`jit: unsupported opcode for compilation (${opcode})`);
        this.opcode = opcode;
    }
}

type ISink = (line: string) => void;

/**
 * 编译一个脚本为单异步闭包（真实 JS 源码生成）。
 * 遇到不支持的结构抛 {@link JitUnsupportedError}，由引擎回退解释器。
 */
export function compileScript(root: TBlockState): (host: IJitHost) => Promise<void> {
    const lines: string[] = [];
    const depth = { n: 0 };
    const push: ISink = line => lines.push('  '.repeat(depth.n) + line);

    const bodyStart = isHat(root) ? (root.next as TBlockState | undefined) : root;
    compileChain(bodyStart, push, depth);

    const factory = new Function(
        '_n',
        '_s',
        '_b',
        '_cy',
        '_bin',
        '_cm',
        '_sc',
        `return async (_ctx) => {\n${lines.join('\n')}\n};`,
    ) as (
        n: typeof toNumber,
        s: typeof toText,
        b: typeof toBoolean,
        cy: typeof cyclic,
        bin: typeof applyBinary,
        cm: typeof applyCompare,
        sc: typeof applyScientific,
    ) => (host: IJitHost) => Promise<void>;

    return factory(
        toNumber,
        toText,
        toBoolean,
        cyclic,
        applyBinary,
        applyCompare,
        applyScientific,
    );
}

function isHat(b: TBlockState): boolean {
    return b.type === OPCODES.EVENT_LIFECYCLE_ONSTART || b.type === OPCODES.EVENT_BROADCAST_LISTEN;
}

function compileChain(start: TBlockState | undefined, push: ISink, depth: { n: number }): void {
    let cur = start;
    while (cur && !isHat(cur)) {
        compileStatement(cur, push, depth);
        cur = cur.next as TBlockState | undefined;
    }
}

function compileStatement(b: TBlockState, push: ISink, depth: { n: number }): void {
    switch (b.type) {
        case OPCODES.CONTROL_FLOW_WAIT:
            push(`await _ctx.wait(_n(${genExpr(inputBlock(b, 'DURATION'))}) * 1000);`);
            return;
        case OPCODES.CONTROL_FLOW_STOPSCRIPT:
            push('return;');
            return;
        case OPCODES.CONTROL_FLOW_STOPPROJECT:
            push('_ctx.stopAll();');
            push('return;');
            return;

        case OPCODES.CONTROL_CONDITION_IF: {
            const es = extraState(b);
            const elseIfCount = es.elseIfCount ?? 0;
            const hasElse = es.hasElse === true;

            push(`if (_b(${genExpr(inputBlock(b, 'CONDITION'))})) {`);
            depth.n++;
            compileChain(inputBlock(b, 'DO'), push, depth);
            depth.n--;
            for (let i = 0; i < elseIfCount; i++) {
                push(`} else if (_b(${genExpr(inputBlock(b, 'ELSE_IF_CONDITION_' + String(i)))})) {`);
                depth.n++;
                compileChain(inputBlock(b, 'ELSE_IF_DO_' + String(i)), push, depth);
                depth.n--;
            }
            if (hasElse) {
                push('} else {');
                depth.n++;
                compileChain(inputBlock(b, 'ELSE_DO'), push, depth);
                depth.n--;
            }
            push('}');
            return;
        }

        case OPCODES.CONTROL_LOOP_REPEAT:
            push(`for (let _i = 0, _t = _n(${genExpr(inputBlock(b, 'TIMES'))}); _i < _t; _i++) {`);
            depth.n++;
            push('if (_ctx.shouldStop()) break;');
            compileChain(inputBlock(b, 'DO'), push, depth);
            depth.n--;
            push('}');
            return;

        case OPCODES.CONTROL_LOOP_WHILE:
            push(`while (_b(${genExpr(inputBlock(b, 'CONDITION'))})) {`);
            depth.n++;
            push('if (_ctx.shouldStop()) break;');
            compileChain(inputBlock(b, 'DO'), push, depth);
            depth.n--;
            push('}');
            return;

        case OPCODES.EVENT_BROADCAST_SEND:
            push(
                `await _ctx.broadcast(_s(${genExpr(inputBlock(b, 'CHANNEL'))}), ${genExpr(inputBlock(b, 'DATA'))});`,
            );
            return;

        case OPCODES.ENTITY_TRANSFORM_POSITION_MOVESTEP: {
            const steps = genExpr(inputBlock(b, 'STEPS'));
            push(
                `{ const _p = _ctx.readPortal(); const _r = _cy(_p.direction, 360) * Math.PI / 180; _ctx.patchPortal({ x: _p.x + Math.sin(_r) * _n(${steps}), y: _p.y + Math.cos(_r) * _n(${steps}) }); }`,
            );
            return;
        }
        case OPCODES.ENTITY_TRANSFORM_DIRECTION_SETDIRECTION:
            push(`_ctx.patchPortal({ direction: _cy(_n(${genExpr(inputBlock(b, 'UNIT'))}), 360) });`);
            return;
        case OPCODES.ENTITY_TRANSFORM_SCALE_SETSCALE:
            push(`_ctx.patchPortal({ size: _n(${genExpr(inputBlock(b, 'UNIT'))}) });`);
            return;
        case OPCODES.ENTITY_APPEARANCE_VISIBILITY_SET:
            push(
                `_ctx.patchPortal({ visible: _s(${genExpr(inputBlock(b, 'VISIBILITY'))}) === '_SHOW_' });`,
            );
            return;

        case OPCODES.DATA_VARIABLE_SET:
            push(
                `_ctx.writeVariable(${JSON.stringify(resolveDataId(b))}, ${genExpr(inputBlock(b, 'VALUE'))});`,
            );
            return;
        case OPCODES.DATA_VARIABLE_ADD:
            push(
                `{ const _id = ${JSON.stringify(resolveDataId(b))}; _ctx.writeVariable(_id, _n(_ctx.readVariable(_id)) + _n(${genExpr(inputBlock(b, 'VALUE'))})); }`,
            );
            return;
        case OPCODES.DATA_VARIABLE_COMPUTE:
            push(
                `{ const _id = ${JSON.stringify(resolveDataId(b))}; _ctx.writeVariable(_id, _bin(${JSON.stringify(menuLiteral(inputBlock(b, 'OPERATOR')))}, _n(_ctx.readVariable(_id)), _n(${genExpr(inputBlock(b, 'VALUE'))}))); }`,
            );
            return;

        default:
            // 任何未被编译支持的语句 → 回退解释器
            throw new JitUnsupportedError(b.type);
    }
}

/** 计算变量 id：data_variable_* 的字段 NAME 存变量菜单选中的值 */
function resolveDataId(b: TBlockState): string {
    const name = fieldString(b, 'NAME');
    return name || (extraState(b).dataId ?? '');
}

/** 从输入连接到的块里取菜单选中值 */
function menuLiteral(connected: TBlockState | undefined): string {
    return connected ? fieldString(connected, 'ASH_BLOCKMENU') : '';
}

/** 生成一个取值块的 JS 表达式串；不支持则抛 {@link JitUnsupportedError} */
export function genExpr(b: TBlockState | undefined): string {
    if (!b) return 'undefined';
    const t = b.type;
    switch (t) {
        case OPCODES.math_number:
            return `_n(${JSON.stringify(toNumber(field(b, 'NUM')))})`;
        case OPCODES.text:
            return `_s(${JSON.stringify(fieldString(b, 'TEXT'))})`;
        case OPCODES.colour_picker:
            return `'#000000'`;

        case OPCODES.OPERATOR_MATH_OP:
            return `_bin(${JSON.stringify(menuLiteral(inputBlock(b, 'OPERATOR')))}, ${genExpr(inputBlock(b, 'LEFT'))}, ${genExpr(inputBlock(b, 'RIGHT'))})`;
        case OPCODES.OPERATOR_MATH_RANDOM: {
            const from = genExpr(inputBlock(b, 'FROM'));
            const to = genExpr(inputBlock(b, 'TO'));
            return `(() => { const _f = _n(${from}), _t = _n(${to}); const _lo = Math.min(_f, _t), _hi = Math.max(_f, _t); return Math.floor(_lo + Math.random() * (_hi - _lo + 1)); })()`;
        }
        case OPCODES.OPERATOR_MATH_MIN:
            return `Math.min(_n(${genExpr(inputBlock(b, 'LEFT'))}), _n(${genExpr(inputBlock(b, 'RIGHT'))}))`;
        case OPCODES.OPERATOR_MATH_MAX:
            return `Math.max(_n(${genExpr(inputBlock(b, 'LEFT'))}), _n(${genExpr(inputBlock(b, 'RIGHT'))}))`;
        case OPCODES.OPERATOR_MATH_CLAMP:
            return `Math.min(Math.max(_n(${genExpr(inputBlock(b, 'VALUE'))}), _n(${genExpr(inputBlock(b, 'MIN'))})), _n(${genExpr(inputBlock(b, 'MAX'))}))`;

        case OPCODES.OPERATOR_LOGIC_COMPARE:
            return `_cm(${JSON.stringify(menuLiteral(inputBlock(b, 'OPERATOR')))}, ${genExpr(inputBlock(b, 'LEFT'))}, ${genExpr(inputBlock(b, 'RIGHT'))})`;
        case OPCODES.OPERATOR_LOGIC_OPERATION: {
            const left = genExpr(inputBlock(b, 'LEFT'));
            const right = genExpr(inputBlock(b, 'RIGHT'));
            return menuLiteral(inputBlock(b, 'OPERATOR')) === '_AND_'
                ? `(_b(${left}) && _b(${right}))`
                : `(_b(${left}) || _b(${right}))`;
        }
        case OPCODES.OPERATOR_LOGIC_NOT:
            return `(!_b(${genExpr(inputBlock(b, 'VALUE'))}))`;
        case OPCODES.OPERATOR_LOGIC_BOOLEAN:
            return extraState(b).value === false ? 'false' : 'true';
        case OPCODES.OPERATOR_LOGIC_TERNARY:
            return `(_b(${genExpr(inputBlock(b, 'CONDITION'))}) ? ${genExpr(inputBlock(b, 'THEN'))} : ${genExpr(inputBlock(b, 'ELSE'))})`;
        case OPCODES.OPERATOR_SCIENTIFIC_FUNC:
            return `_sc(${JSON.stringify(menuLiteral(inputBlock(b, 'FUNCTION')))}, _n(${genExpr(inputBlock(b, 'VALUE'))}))`;

        case OPCODES.ENTITY_TRANSFORM_POSITION_GETPOSITION:
            return `_ctx.readPortal().${menuLiteral(inputBlock(b, 'POSITION')) === 'y' ? 'y' : 'x'}`;
        case OPCODES.DATA_VARIABLE_GET:
            return `_ctx.readVariable(${JSON.stringify(extraState(b).dataId ?? '')})`;
        case OPCODES.DATA_STRING_JOIN: {
            const count = extraState(b).itemCount ?? 0;
            const parts: string[] = [];
            for (let i = 0; i < count; i++) {
                parts.push(`_s(${genExpr(inputBlock(b, 'DATA' + String(i)))})`);
            }
            return parts.join(' + ') || "''";
        }
        case OPCODES.DATA_STRING_LENGTH:
            return `_s(${genExpr(inputBlock(b, 'TEXT'))}).length`;
        case OPCODES.EVENT_BROADCAST_DATA:
            return '_ctx.readBroadcastData()';

        default: {
            const menu = field(b, 'ASH_BLOCKMENU');
            if (menu !== undefined) return toText(menu);
            throw new JitUnsupportedError(t);
        }
    }
}