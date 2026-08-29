/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/vm/blocks';
import { connections, returnConnections } from './helpers';

/**
 * 注册资源类积木
 */
export function initResourceBlocks(blockly: typeof Blockly) {
    blockly.Blocks[OPCODES.RESOURCES_ADDFROMURL] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:resources.addFromUrl'),
                colour: BlocksColor.resources.primary,
                args0: [
                    { type: 'input_value', name: 'URL' },
                    { type: 'input_value', name: 'NAME' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.RESOURCES_GET] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:resources.get'),
                colour: BlocksColor.resources.primary,
                args0: [{ type: 'input_value', name: 'NAME' }],
                output: 'String',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.RESOURCES_EXISTS] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:resources.exists'),
                colour: BlocksColor.resources.primary,
                args0: [{ type: 'input_value', name: 'NAME' }],
                output: 'Boolean',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.RESOURCES_RENAME] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:resources.rename'),
                colour: BlocksColor.resources.primary,
                args0: [
                    { type: 'input_value', name: 'OLD_NAME' },
                    { type: 'input_value', name: 'NEW_NAME' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.RESOURCES_DELETE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:resources.delete'),
                colour: BlocksColor.resources.primary,
                args0: [{ type: 'input_value', name: 'NAME' }],
            });
        },
    } as Blockly.Block;
}
