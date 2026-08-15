/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Blockly from 'blockly/core';
import type { IVM } from '../../../types/vm';
import { clearRegisteredBlocks } from './helpers';
import { initPrimitiveBlocks } from './primitives';
import { initMenuBlocks } from './menus';
import { initEntityBlocks } from './entity';
import { initAudioBlocks } from './audio';
import { initResourceBlocks } from './resources';
import { initEventBlocks } from './event';
import { initControlBlocks } from './control';
import { initOperatorBlocks } from './operator';
import { initDataBlocks } from './data';
import { initFunctionBlocks } from './function';
import { initCanvasBlocks } from './canvas';
import { initDebugBlocks } from './debug';

export { connections, hatConnections, endConnections, returnConnections } from './helpers';

/**
 * 初始化所有 ASH 自定义积木
 *
 * 先清空 Blockly 已注册的积木，再按类别依次注册。
 * 注册顺序通常无关紧要，但 primitives（数字/文本/颜色）应先于其他积木，
 * 因为它们的字段类型会被其他积木的输入连接引用。
 */
export const initBlocks = (blockly: typeof Blockly, vm: IVM) => {
    clearRegisteredBlocks(blockly);

    initPrimitiveBlocks(blockly);
    initMenuBlocks(blockly, vm);
    initEntityBlocks(blockly);
    initAudioBlocks(blockly);
    initResourceBlocks(blockly);
    initEventBlocks(blockly);
    initControlBlocks(blockly);
    initOperatorBlocks(blockly);
    initDataBlocks(blockly, vm);
    initFunctionBlocks(blockly);
    initCanvasBlocks(blockly);
    initDebugBlocks(blockly);
};
