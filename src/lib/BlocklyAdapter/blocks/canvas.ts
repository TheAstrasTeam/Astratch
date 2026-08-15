/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import { connections } from './helpers';

export function initCanvasBlocks(blockly: typeof Blockly) {
    // 基础内容
    blockly.Blocks[OPCODES.CANVAS_COLOR] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.color'),
                args0: [{ type: 'input_value', name: 'COLOR' }],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_POINT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.point'),
                args0: [
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', chekc: 'Number' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    };

    blockly.Blocks[OPCODES.CANVAS_LINESET] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.lineset'),
                args0: [{ type: 'input_value', name: 'TYPE' }],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_LINE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.line'),
                args0: [
                    { type: 'input_value', name: 'X1', check: 'Number' },
                    { type: 'input_value', name: 'Y1', check: 'Number' },
                    { type: 'input_value', name: 'X2', check: 'Number' },
                    { type: 'input_value', name: 'Y2', check: 'Number' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_CIRCLE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.circle'),
                args0: [
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', check: 'Number' },
                    { type: 'input_value', name: 'RADIUS', check: 'Number' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_RECTANGLE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.rectangle'),
                args0: [
                    { type: 'input_value', name: 'X1', check: 'Number' },
                    { type: 'input_value', name: 'Y1', check: 'Number' },
                    { type: 'input_value', name: 'X2', check: 'Number' },
                    { type: 'input_value', name: 'Y2', check: 'Number' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_TRIANGLE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.triangle'),
                args0: [
                    { type: 'input_value', name: 'X1', check: 'Number' },
                    { type: 'input_value', name: 'Y1', check: 'Number' },
                    { type: 'input_value', name: 'X2', check: 'Number' },
                    { type: 'input_value', name: 'Y2', check: 'Number' },
                    { type: 'input_value', name: 'X3', check: 'Number' },
                    { type: 'input_value', name: 'Y3', check: 'Number' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_STAMP] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.stamp'),
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_STAMPPLUS] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.stampPlus'),
                args0: [
                    { type: 'input_value', name: 'IMG', check: 'String' },
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', check: 'Number' },
                    { type: 'input_value', name: 'SIZE', check: 'Number' },
                    { type: 'input_value', name: 'ANGLE' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_TEXT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.text'),
                args0: [
                    { type: 'input_value', name: 'TXT', check: 'String' },
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', check: 'Number' },
                    { type: 'input_value', name: 'ALIGN', check: 'String' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_TEXTFONT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.textFont'),
                args0: [{ type: 'input_value', name: 'FONT', check: 'String' }],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    // 高级渲染
    // TODO: KOSHINO 想做，给了。
}
