/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DSL 模块入口：对外只暴露四个函数
 *
 * - spawnBlockAST：DSL → 序列化状态（首次调用会构建槽位表）
 * - spawnBlocksSvg：序列化状态 → SVG
 * - refreshBlocksDefinitions：手动重建槽位表（一般不用）
 * - getBlocksDefinitions：只读槽位表
 */

import { buildScript } from './builder';
import { getBlocksDefinitions, refreshBlocksDefinitions } from './definitions';
import { parseDSL } from './parser';
import { spawnBlocksSvg } from './render';
import type { TState } from './types';

let _definitionsPromise: Promise<void> | undefined;

/** 槽位表首次使用时构建一次；spawnBlockAST 会等它就绪，避免拿到空表 */
const ensureDefinitions = (): Promise<void> => (_definitionsPromise ??= refreshBlocksDefinitions());

/** DSL 源码 → Blockly 序列化状态（顶层积木栈） */
export const spawnBlockAST = async (content: string): Promise<TState | undefined> => {
    await ensureDefinitions();
    return buildScript(parseDSL(content));
};

export { refreshBlocksDefinitions, spawnBlocksSvg, getBlocksDefinitions };
export type { IBlockDefinition, IFieldSlot, IStatementSlot, IValueSlot } from './types';
