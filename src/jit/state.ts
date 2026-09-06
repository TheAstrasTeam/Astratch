/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TBlockState } from './types';

/** 解释器/JIT 需要读取的 extraState 形状（Blockly 其它 extraState 字段忽略） */
export interface IJitExtraState {
    elseIfCount?: number;
    hasElse?: boolean;
    itemCount?: number;
    dataId?: string;
    value?: boolean;
}

function asRecord(v: unknown): Record<string, unknown> {
    return v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

/** 读取一个序列化字段；新格式 { value } 与旧格式原值都兼容 */
export function field(block: TBlockState, name: string): unknown {
    const fields = block.fields;
    if (!fields) return undefined;
    const raw = asRecord(fields)[name];
    if (raw === undefined) return undefined;
    if (raw !== null && typeof raw === 'object' && 'value' in raw) {
        return raw.value;
    }
    return raw;
}

/** 字段 → 字符串（数值/布尔自动转） */
export function fieldString(block: TBlockState, name: string): string {
    const v = field(block, name);
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    return '';
}

/** 字段 → 数值 */
export function fieldNumber(block: TBlockState, name: string): number {
    const n = Number(field(block, name));
    return Number.isNaN(n) ? 0 : n;
}

/** 读取（安全化后的）extraState */
export function extraState(block: TBlockState): IJitExtraState {
    return asRecord(block.extraState);
}

/** 返回接入某输入的块（真实连接优先，其次影子积木）；没有则 undefined */
export function inputBlock(block: TBlockState, name: string): TBlockState | undefined {
    const inputs = asRecord(block.inputs);
    const connection = inputs[name] as { block?: TBlockState; shadow?: TBlockState } | undefined;
    if (!connection) return undefined;
    return connection.block ?? connection.shadow;
}