/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import { connections, endConnections, returnConnections } from './helpers';

/**
 * 注册函数类积木
 */
export function initFunctionBlocks(blockly: typeof Blockly) {
    blockly.Blocks[OPCODES.FUNCTION_DEFINITION] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:function.definition'),
                message1: '%1',
                colour: BlocksColor.function.primary,
                args0: [{ type: 'input_value', name: 'NAME', check: 'String' }],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.FUNCTION_CALL] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:function.call'),
                message1: '%1',
                colour: BlocksColor.function.primary,
                output: null,
                args1: [{ type: 'input_value', name: 'FUNCTION', check: 'Function' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.FUNCTION_EXECUTE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:function.execute'),
                message1: '%1',
                colour: BlocksColor.function.secondary,
                args1: [{ type: 'input_value', name: 'FUNCTION', check: 'Function' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.FUNCTION_RETURN] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:function.return'),
                colour: BlocksColor.function.primary,
                args0: [{ type: 'input_value', name: 'VALUE' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.FUNCTION_INLINE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:function.inline'),
                message1: '%1',
                colour: BlocksColor.function.primary,
                output: 'Function',
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.FUNCTION_RUNBRANCH] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:function.runBranch'),
                colour: BlocksColor.function.primary,
                args0: [{ type: 'input_value', name: 'BRANCH', check: 'String' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.FUNCTION_SETDATAVALUE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:function.setDataValue'),
                colour: BlocksColor.function.primary,
                args0: [
                    { type: 'input_value', name: 'NAME', check: 'String' },
                    { type: 'input_value', name: 'VALUE' },
                ],
            });
        },
    } as Blockly.Block;
}
