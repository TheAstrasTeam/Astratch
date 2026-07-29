import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import { connections } from './helpers';

/**
 * 注册控制类积木
 * 涵盖：流程、条件、循环、匹配
 */
export function initControlBlocks(blockly: typeof Blockly) {
    // - 流程
    blockly.Blocks[OPCODES.CONTROL_FLOW_WAIT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.flow.wait'),
                colour: BlocksColor.control.primary,
                args0: [{ type: 'input_value', name: 'DURATION', check: 'Number' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_FLOW_WAITUNTIL] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.flow.waitUntil'),
                colour: BlocksColor.control.primary,
                args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_FLOW_BREAK] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.flow.break'),
                colour: BlocksColor.control.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_FLOW_STOPSCRIPT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.flow.stopScript'),
                colour: BlocksColor.control.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_FLOW_STOPPROJECT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.flow.stopProject'),
                colour: BlocksColor.control.primary,
            });
        },
    } as Blockly.Block;

    // - 条件
    blockly.Blocks[OPCODES.CONTROL_CONDITION_IF] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                colour: BlocksColor.control.secondary,
                message0: t('blocks:control.condition.if'),
                message1: '%1',
                args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;

    // - 循环
    blockly.Blocks[OPCODES.CONTROL_LOOP_WHILE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.loop.while'),
                message1: '%1',
                colour: BlocksColor.control.tertiary,
                args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_LOOP_REPEAT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.loop.repeat'),
                message1: '%1',
                colour: BlocksColor.control.tertiary,
                args0: [{ type: 'input_value', name: 'TIMES', check: 'Number' }],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_LOOP_FOREACH] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.loop.forEach'),
                message1: '%1',
                colour: BlocksColor.control.tertiary,
                args0: [
                    { type: 'input_value', name: 'ARRAY', check: 'Array' },
                    { type: 'input_value', name: 'ITEM_NAME', check: 'String' },
                ],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;

    // - 匹配
    blockly.Blocks[OPCODES.CONTROL_MATCH_MATCH] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.match.match'),
                message1: '%1',
                colour: BlocksColor.control.secondary,
                args0: [{ type: 'input_value', name: 'VALUE' }],
                args1: [{ type: 'input_statement', name: 'CASES', check: 'Action' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_MATCH_CASE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.match.case'),
                message1: '%1',
                colour: BlocksColor.control.secondary,
                args0: [{ type: 'input_value', name: 'VALUE' }],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_MATCH_DEFAULT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.match.default'),
                message1: '%1',
                colour: BlocksColor.control.secondary,
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;
}
