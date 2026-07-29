import * as Blockly from 'blockly/core';
import { BlocksColor, OPCODES } from '../../../types/blocks';

/**
 * 注册基础 reporter 积木（数字、文本、颜色等）
 * 这些积木只有 output + 一个字段，无前导文本
 */
export function initPrimitiveBlocks(blockly: typeof Blockly) {
    blockly.Blocks[OPCODES.math_number] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [{ type: 'field_number', name: 'NUM', value: 0 }],
                output: 'Number',
                colour: BlocksColor.textField,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.math_integer] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [{ type: 'field_number', name: 'NUM', value: 0, precision: 1 }],
                output: 'Number',
                colour: BlocksColor.textField,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.math_whole_number] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [{ type: 'field_number', name: 'NUM', value: 0, min: 0, precision: 1 }],
                output: 'Number',
                colour: BlocksColor.textField,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.math_positive_number] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [{ type: 'field_number', name: 'NUM', value: 0, min: 0 }],
                output: 'Number',
                colour: BlocksColor.textField,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.math_angle] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [{ type: 'field_angle', name: 'NUM', value: 90 }],
                output: 'Number',
                colour: BlocksColor.textField,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.text] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [{ type: 'field_input', name: 'TEXT' }],
                output: 'String',
                colour: BlocksColor.textField,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.colour_picker] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [{ type: 'field_colour', name: 'COLOUR', colour: '#ff0000' }],
                output: 'String',
                colour: BlocksColor.textField,
            });
        },
    } as Blockly.Block;
}
