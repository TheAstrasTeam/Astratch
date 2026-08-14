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
    blockly.Blocks[OPCODES.CANVAS_COLOR] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.color'),
                args0: [
                    {type: 'input_value', name: 'COLOR'},
                ],
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
                    {type: 'input_value', name: 'X1', check: 'Number'},
                    {type: 'input_value', name: 'Y1', check: 'Number'},
                    {type: 'input_value', name: 'X2', check: 'Number'},
                    {type: 'input_value', name: 'Y2', check: 'Number'},
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;
}