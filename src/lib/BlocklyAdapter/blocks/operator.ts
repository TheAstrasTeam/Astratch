import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import { returnConnections } from './helpers';

/**
 * 注册运算类积木
 * 涵盖：数学、逻辑、科学
 */
export function initOperatorBlocks(blockly: typeof Blockly) {
    // - 数学
    blockly.Blocks[OPCODES.OPERATOR_MATH_OP] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.math.op'),
                colour: BlocksColor.operator.primary,
                output: 'Number',
                args0: [
                    { type: 'input_value', name: 'LEFT', check: 'Number' },
                    { type: 'input_value', name: 'OPERATOR', check: 'String' },
                    { type: 'input_value', name: 'RIGHT', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.OPERATOR_MATH_RANDOM] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.math.random'),
                colour: BlocksColor.operator.primary,
                output: 'Number',
                args0: [
                    { type: 'input_value', name: 'FROM', check: 'Number' },
                    { type: 'input_value', name: 'TO', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;

    // - 逻辑
    blockly.Blocks[OPCODES.OPERATOR_LOGIC_COMPARE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.logic.compare'),
                colour: BlocksColor.operator.secondary,
                output: 'Boolean',
                args0: [
                    { type: 'input_value', name: 'LEFT' },
                    { type: 'input_value', name: 'OPERATOR', check: 'String' },
                    { type: 'input_value', name: 'RIGHT' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.OPERATOR_LOGIC_NOT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.logic.not'),
                colour: BlocksColor.operator.secondary,
                output: 'Boolean',
                args0: [{ type: 'input_value', name: 'VALUE', check: 'Boolean' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.OPERATOR_LOGIC_BOOLEAN] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.logic.boolean'),
                colour: BlocksColor.operator.secondary,
                output: 'Boolean',
                args0: [{ type: 'input_value', name: 'VALUE', check: 'Boolean' }],
            });
        },
    } as Blockly.Block;

    // - 科学
    blockly.Blocks[OPCODES.OPERATOR_SCIENTIFIC_FUNC] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.scientific.func'),
                colour: BlocksColor.operator.tertiary,
                output: 'Number',
                args0: [
                    { type: 'input_value', name: 'FUNCTION', check: 'String' },
                    { type: 'input_value', name: 'VALUE', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;
}
