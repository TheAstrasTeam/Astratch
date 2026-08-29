/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/vm/blocks';
import { connections } from './helpers';

/**
 * 注册调试类积木
 */
export function initDebugBlocks(blockly: typeof Blockly) {
    blockly.Blocks[OPCODES.DEBUG_LOG] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:debug.log'),
                colour: BlocksColor.debug.primary,
                args0: [
                    { type: 'input_value', name: 'LEVEL', check: 'String' },
                    { type: 'input_value', name: 'MESSAGE', check: 'String' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DEBUG_CRASH] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:debug.crash'),
                colour: BlocksColor.debug.primary,
                args0: [{ type: 'input_value', name: 'MESSAGE', check: 'String' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DEBUG_BREAKPOINT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:debug.breakpoint'),
                colour: BlocksColor.debug.primary,
            });
        },
    } as Blockly.Block;
}
