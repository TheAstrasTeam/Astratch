/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `!f_*` 语法糖用到的纯工具：类型映射、配色、签名/实参形状
 */

import { OPCODES } from '../../types/vm/blocks';
import type { TNode, TSugarArg } from './types';

/** MODE → Blockly check；Unknown 映射为“不限”（null） */
export const modeToCheck = (mode: string): unknown => {
    const normalized = mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase();
    if (normalized === 'Unknown') return null;
    if (normalized === 'None') return 'none';
    return normalized;
};

/** 把十六进制色按比例压暗 */
export const darken = (hex: string, factor: number): string => {
    const short = /^#?([0-9a-fA-F]{3})$/.exec(hex.trim());
    const normalized = short ? `#${short[1].replace(/(.)/g, '$1$1')}` : hex;
    const match = /^#?([0-9a-fA-F]{6})$/.exec(normalized.trim());
    if (!match) return hex;
    const value = parseInt(match[1], 16);
    const channel = (shift: number): string =>
        Math.round(((value >> shift) & 0xff) * factor)
            .toString(16)
            .padStart(2, '0');
    return `#${channel(16)}${channel(8)}${channel(0)}`;
};

/** 单个十六进制色 → IBlockColor 四档 */
export const colorSet = (hex: string) => ({
    primary: hex,
    secondary: darken(hex, 0.9),
    tertiary: darken(hex, 0.8),
    quaternary: darken(hex, 0.8),
});

/** 签名组件 → TPreviewFunctionData */
export const previewData = (arg: TSugarArg): Record<string, unknown> => {
    if (arg.kind === 'atom') return { type: 'text', text: String(arg.value) };
    if (arg.kind === 'param') return { type: modeToCheck(arg.mode), text: arg.name };
    if (arg.kind === 'dropdown') {
        return {
            type: { type: 'dropdown', options: [], allowBlocks: arg.allowBlocks },
            text: arg.name,
        };
    }
    throw new Error(
        'DSL syntax error: function signature only accepts text, !f_param or !p_dropdown',
    );
};

/** 函数值（签名）积木的状态definitionMode 决定它是否作为定义帽的签名 */
export const functionValueState = (
    color: string,
    commands: TSugarArg[],
    returnType: unknown,
    definitionMode: boolean,
): Record<string, unknown> => ({
    type: OPCODES.FUNCTION_VALUE,
    extraState: {
        definitionMode,
        params: commands.map(previewData),
        colors: colorSet(color),
        returnType,
        isValue: true,
    },
});

/** 从函数节点推出 caller 的实参槽，和运行时 readParamsFromFunctionInput 对齐 */
export const functionArgsFor = (node: TNode): Record<string, unknown>[] => {
    const extra = (node.state?.extraState ?? {}) as { params?: unknown[] };
    const params = extra.params ?? [];
    if (node.opcode === OPCODES.FUNCTION_INLINE) {
        return params.map(param => {
            const item = param as { id?: unknown; name?: unknown; type?: unknown };
            return {
                id: typeof item.id === 'string' ? item.id : '',
                name: typeof item.name === 'string' ? item.name : '',
                type: item.type ?? null,
            };
        });
    }
    if (node.opcode === OPCODES.FUNCTION_VALUE) {
        const result: Record<string, unknown>[] = [];
        params.forEach((param, index) => {
            const item = param as { type?: unknown; text?: unknown };
            // 文本标签不占实参槽
            if (item.type === 'text') return;
            // 下拉参数交给运行时同步（带选项配置）
            if (typeof item.type === 'object' && item.type !== null) return;
            result.push({
                id: `arg-${String(index)}`,
                name: typeof item.text === 'string' ? item.text : '',
                type: item.type ?? null,
            });
        });
        return result;
    }
    return [];
};
