import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import type { IVM } from '../../../types/vm';
import { createEntitiesMenu } from './helpers';

/**
 * 注册所有"菜单"类 reporter 积木
 * 这些积木只有 output + 一个 dropdown 字段
 *
 * 静态选项菜单用 jsonInit 直接定义；
 * 动态实体菜单（DIRECTION_SETFACE_MENU / COLLISION_MENU）需要 vm 在 init 时构建选项，
 * 故用 appendField(createEntitiesMenu(vm), ...) 方式。
 */
export function initMenuBlocks(blockly: typeof Blockly, vm: IVM) {
    blockly.Blocks[OPCODES.POSITION_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            ['x', 'X'],
                            ['y', 'Y'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.position.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.POSITION_ADDORSET_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:set'), '_SET_'],
                            [t('blocks:add'), '_ADD_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.position.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.SCALE_ADDORSET_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:set'), '_SET_'],
                            [t('blocks:add'), '_ADD_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.scale.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DIRECTION_SETWHERE_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:set'), '_SET_'],
                            [t('blocks:toLeft'), '_TOLEFT_'],
                            [t('blocks:toRight'), '_TORIGHT_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.direction.primary,
            });
        },
    } as Blockly.Block;

    // 动态：实体选择菜单
    blockly.Blocks[OPCODES.DIRECTION_SETFACE_MENU] = {
        init(this: Blockly.Block) {
            this.appendDummyInput().appendField(createEntitiesMenu(vm), 'ASH_BLOCKMENU');
            this.setOutput(true, 'String');
            this.setColour(BlocksColor.direction.primary);
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.LAYER_ADDORSET_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:set'), '_SET_'],
                            [t('blocks:addLayer'), '_ADDLAYER_'],
                            [t('blocks:subLayer'), '_SUBLAYER_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.layer.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.IMAGES_STRETCH_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:xPos'), '_X_'],
                            [t('blocks:yPos'), '_Y_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.IMAGES_IMAGES_ADDORSET_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:set'), '_SET_'],
                            [t('blocks:add'), '_ADD_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.IMAGES_GRID_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            ['%%', '_SET_'],
                            [t('blocks:unit'), '_UNIT_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.IMAGES_GRID_SIZE_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            ['2x2', '_TWO_'],
                            ['3x3', '_THREE_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EFFECTS_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:transparent'), '_TRANSPARENT_'],
                            [t('blocks:light'), '_LIGHT_'],
                            [t('blocks:saturation'), '_SATURATION_'],
                            [t('blocks:contrast'), '_CONTRAST_'],
                            [t('blocks:fisheye'), '_FISHEYE_'],
                            [t('blocks:whirl'), '_WHIRL_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.effects.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EFFECTS_ADDORSET_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:set'), '_SET_'],
                            [t('blocks:add'), '_ADD_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.effects.primary,
            });
        },
    } as Blockly.Block;

    // 动态：实体选择菜单
    blockly.Blocks[OPCODES.COLLISION_MENU] = {
        init(this: Blockly.Block) {
            this.appendDummyInput().appendField(createEntitiesMenu(vm), 'ASH_BLOCKMENU');
            this.setOutput(true, 'String');
            this.setColour(BlocksColor.collision.primary);
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_THEN_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:blockThread'), '_BLOCK_'],
                            [t('blocks:continue'), '_CONTINUE_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.audio.primary,
            });
        },
    };

    blockly.Blocks[OPCODES.AUDIO_CONTROL_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:continue'), '_CONTINUE_'],
                            [t('blocks:pause'), '_PAUSE_'],
                            [t('blocks:stop'), '_STOP_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.audio.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_ADDORSET_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:set'), '_SET_'],
                            [t('blocks:add'), '_ADD_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.audio.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_GET_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:duration'), '_DURATION_'],
                            [t('blocks:nowDuration'), '_NOWDURATION_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.audio.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_GET_IS_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:isPause'), '_ISPAUSE_'],
                            [t('blocks:isExist'), '_ISEXIST_'],
                        ],
                    },
                ],
                output: 'Boolean',
                colour: BlocksColor.audio.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.MATH_OPERATOR_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            ['+', '_ADD_'],
                            ['-', '_SUBTRACT_'],
                            ['*', '_MULTIPLY_'],
                            ['/', '_DIVIDE_'],
                            ['%', '_MODULO_'],
                            ['^', '_POWER_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.operator.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.LOGIC_COMPARE_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            ['=', '_EQUAL_'],
                            ['!=', '_NOT_EQUAL_'],
                            ['>', '_GREATER_THAN_'],
                            ['>=', '_GREATER_OR_EQUAL_'],
                            ['<', '_LESS_THAN_'],
                            ['<=', '_LESS_OR_EQUAL_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.operator.secondary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.SCIENTIFIC_FUNCTION_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            ['sin', '_SIN_'],
                            ['cos', '_COS_'],
                            ['tan', '_TAN_'],
                            ['asin', '_ASIN_'],
                            ['acos', '_ACOS_'],
                            ['atan', '_ATAN_'],
                            [t('blocks:mathFunction.absolute'), '_ABS_'],
                            [t('blocks:mathFunction.ceil'), '_CEIL_'],
                            [t('blocks:mathFunction.floor'), '_FLOOR_'],
                            [t('blocks:mathFunction.sqrt'), '_SQRT_'],
                            ['ln', '_LN_'],
                            ['log₁₀', '_LOG10_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.operator.tertiary,
            });
        },
    } as Blockly.Block;

    // TODO: 加入具体的定义
    blockly.Blocks[OPCODES.DATA_NAME_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [['', '_EMPTY_']],
                    },
                ],
                output: 'String',
                colour: BlocksColor.data.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_COMPUTE_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [
                            [t('blocks:dataOperation.increment'), '_INCREMENT_'],
                            [t('blocks:dataOperation.decrement'), '_DECREMENT_'],
                            [t('blocks:dataOperation.multiply'), '_MULTIPLY_'],
                            [t('blocks:dataOperation.divide'), '_DIVIDE_'],
                            [t('blocks:dataOperation.modulo'), '_MODULO_'],
                        ],
                    },
                ],
                output: 'String',
                colour: BlocksColor.data.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.FUNCTION_BRANCH_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [['', '_EMPTY_']],
                    },
                ],
                output: 'String',
                colour: BlocksColor.function.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.FUNCTION_PARAMETER_MENU] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        type: 'field_dropdown_with_block',
                        name: 'ASH_BLOCKMENU',
                        options: [['', '_EMPTY_']],
                    },
                ],
                output: 'String',
                colour: BlocksColor.function.primary,
            });
        },
    } as Blockly.Block;
}
