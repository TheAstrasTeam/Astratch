/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由 Ai 生成

/**
 * 插槽连接规则：决定「什么能插进什么」。
 *
 * Blockly 原生只按 `check` 字符串匹配，ASH 还需要三条额外规则：
 *
 * 1. **作用域源插槽**——由宿主自动填充（foreach 的项、行内函数的参数……），
 *    对用户完全锁死，只有宿主自己 connect 的那一瞬间放行。
 * 2. **opcode 白名单**——`output` 为 null 的积木是「万能牌」，
 *    靠 check 挡不住，需要按 opcode 限定。
 * 3. **结构性类型**——`MatchBranch` 这类不是值，不能进普通万能插槽。
 *
 * 一个工作区只能挂一个 ConnectionChecker，所以 C 型积木的拖拽放行
 * 也在这里汇合，但具体判断委托给 cBlockWrap.ts。
 */

import * as Blockly from 'blockly/core';
import { allowCBlockWrapDrag } from './cBlockWrap';

/** 携带 ASH 扩展标记的连接。 */
export interface AshConnection extends Blockly.Connection {
    /**
     * 作用域源插槽（foreach 的项、重复的计数、广播的数据、函数的参数……）。
     * 这些插槽由宿主积木自动填充源积木，默认锁死，用户无法拖入任何东西。
     */
    isScopedSourceSlot?: boolean;
    /** 仅在宿主自己 connect 的那一瞬间置为 true，随后立刻复位。 */
    allowScopedSource?: boolean;
    /** 只接受这些 opcode 的积木；用于 output 为 null（万能）却需要限定来源的插槽。 */
    acceptOnlyBlockTypes?: string[];
}

/**
 * 结构性类型：它们描述积木在结构中的位置，而不是一个可以传递的值。
 *
 * `Function` 刻意不在此列——函数在 ASH 中是一等值，
 * 既要能存进变量、当参数传递，也要能插进「执行函数」，
 * 限制它反而会挡住这些正当用法。
 */
const STRUCTURAL_TYPES = ['MatchBranch'];

/**
 * ASH 的连接检查器。
 */
export class AshConnectionChecker extends Blockly.ConnectionChecker {
    override doTypeChecks(a: Blockly.Connection, b: Blockly.Connection): boolean {
        // 规则 1：作用域源插槽默认锁死。
        const scopedSourceSlot = [a, b]
            .map(connection => connection as AshConnection)
            .find(connection => connection.isScopedSourceSlot);
        if (scopedSourceSlot && !scopedSourceSlot.allowScopedSource) return false;

        // 规则 2：opcode 白名单。
        for (const [self, other] of [
            [a, b],
            [b, a],
        ] as const) {
            const whitelist = (self as AshConnection).acceptOnlyBlockTypes;
            if (whitelist && !whitelist.includes(other.getSourceBlock().type)) return false;
        }

        // 规则 3：结构性类型不能借「未声明类型」进入万能插槽。
        // Blockly 默认允许有一侧未声明类型的连接接收任意值。
        const checksA = a.getCheck();
        const checksB = b.getCheck();
        if (!checksA || !checksB) {
            const declaredChecks = checksA ?? checksB;
            if (declaredChecks?.some(check => STRUCTURAL_TYPES.includes(check))) return false;
        }

        return super.doTypeChecks(a, b);
    }

    override doDragChecks(
        a: Blockly.RenderedConnection,
        b: Blockly.RenderedConnection,
        distance: number,
    ): boolean {
        if (super.doDragChecks(a, b, distance)) return true;

        // super 否决后，terminal C 块的包围场景仍需放行。
        return allowCBlockWrapDrag(a, b, distance);
    }
}
