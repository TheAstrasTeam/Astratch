// 来自 Cyberexplorer 的积木箱配置
import * as Blockly from 'blockly/core';
import { BlocksColor, OPCODE } from '../../types/blocks';
import { t } from 'i18next';
import i18nReady from '../../i18n';

const getToolbox = async (): Promise<Blockly.utils.toolbox.ToolboxInfo> => {
    await i18nReady;
    const MOTION = t('blocks:motion');
    const LOOKS = t('blocks:looks');
    const SOUND = t('blocks:sound');
    const EVENTS = t('blocks:events');
    const CONTROL = t('blocks:control');
    const SENSING = t('blocks:sensing');
    const OPERATORS = t('blocks:operators');
    const VARIABLES = t('blocks:variables');
    const MY_BLOCKS = t('blocks:my_blocks');
    return {
        kind: 'categoryToolbox',
        contents: [
            {
                kind: 'category',
                name: MOTION,
                colour: BlocksColor.motion.primary,
                contents: [
                    {
                        kind: 'block',
                        type: OPCODE.motion_movesteps,
                    },
                    {
                        kind: 'block',
                        type: OPCODE.motion_turnleft,
                    },
                    {
                        kind: 'block',
                        type: OPCODE.motion_turnright,
                    },
                    {
                        kind: 'block',
                        type: 'logic_negate',
                    },
                    {
                        kind: 'block',
                        type: 'logic_boolean',
                    },
                    {
                        kind: 'block',
                        type: 'logic_null',
                    },
                    {
                        kind: 'block',
                        type: 'logic_ternary',
                    },
                ],
            },
            {
                kind: 'category',
                name: LOOKS,
                colour: BlocksColor.looks.primary,
                contents: [
                    {
                        kind: 'block',
                        type: 'controls_repeat_ext',
                        inputs: {
                            TIMES: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 10,
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'controls_whileUntil',
                    },
                    {
                        kind: 'block',
                        type: 'controls_for',
                        inputs: {
                            FROM: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 1,
                                    },
                                },
                            },
                            TO: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 10,
                                    },
                                },
                            },
                            BY: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 1,
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'controls_forEach',
                    },
                    {
                        kind: 'block',
                        type: 'controls_flow_statements',
                    },
                ],
            },
            {
                kind: 'category',
                name: SOUND,
                colour: BlocksColor.sounds.primary,
                contents: [
                    {
                        kind: 'block',
                        type: 'math_number',
                        fields: {
                            NUM: 0,
                        },
                    },
                    {
                        kind: 'block',
                        type: 'math_arithmetic',
                        inputs: {
                            A: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 1,
                                    },
                                },
                            },
                            B: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 1,
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'math_single',
                        inputs: {
                            NUM: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 9,
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'math_trig',
                        inputs: {
                            NUM: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 45,
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'math_constant',
                    },
                    {
                        kind: 'block',
                        type: 'math_number_property',
                        inputs: {
                            NUMBER_TO_CHECK: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 0,
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'math_round',
                        inputs: {
                            NUM: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 3.5,
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'math_modulo',
                        inputs: {
                            DIVIDEND: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 64,
                                    },
                                },
                            },
                            DIVISOR: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 10,
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'math_constrain',
                        inputs: {
                            VALUE: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 50,
                                    },
                                },
                            },
                            LOW: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 1,
                                    },
                                },
                            },
                            HIGH: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 100,
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'math_random_int',
                        inputs: {
                            FROM: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 1,
                                    },
                                },
                            },
                            TO: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 100,
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'math_random_float',
                    },
                ],
            },
            {
                kind: 'category',
                name: EVENTS,
                colour: BlocksColor.event.primary,
                contents: [
                    {
                        kind: 'block',
                        type: 'text',
                    },
                    {
                        kind: 'block',
                        type: 'text_join',
                    },
                    {
                        kind: 'block',
                        type: 'text_append',
                        inputs: {
                            TEXT: {
                                shadow: {
                                    type: 'text',
                                    fields: {
                                        TEXT: '',
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'text_length',
                        inputs: {
                            VALUE: {
                                shadow: {
                                    type: 'text',
                                    fields: {
                                        TEXT: 'abc',
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'text_isEmpty',
                        inputs: {
                            VALUE: {
                                shadow: {
                                    type: 'text',
                                    fields: {
                                        TEXT: '',
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'text_changeCase',
                        inputs: {
                            TEXT: {
                                shadow: {
                                    type: 'text',
                                    fields: {
                                        TEXT: 'abc',
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'text_trim',
                        inputs: {
                            TEXT: {
                                shadow: {
                                    type: 'text',
                                    fields: {
                                        TEXT: ' abc ',
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'text_print',
                        inputs: {
                            TEXT: {
                                shadow: {
                                    type: 'text',
                                    fields: {
                                        TEXT: 'abc',
                                    },
                                },
                            },
                        },
                    },
                ],
            },
            {
                kind: 'category',
                name: CONTROL,
                colour: BlocksColor.control.primary,
                contents: [
                    {
                        kind: 'block',
                        type: 'lists_create_with',
                    },
                    {
                        kind: 'block',
                        type: 'lists_create_empty',
                    },
                    {
                        kind: 'block',
                        type: 'lists_repeat',
                        inputs: {
                            NUM: {
                                shadow: {
                                    type: 'math_number',
                                    fields: {
                                        NUM: 5,
                                    },
                                },
                            },
                        },
                    },
                    {
                        kind: 'block',
                        type: 'lists_length',
                    },
                    {
                        kind: 'block',
                        type: 'lists_isEmpty',
                    },
                    {
                        kind: 'block',
                        type: 'lists_getIndex',
                    },
                    {
                        kind: 'block',
                        type: 'lists_setIndex',
                    },
                ],
            },
            {
                kind: 'category',
                name: SENSING,
                colour: BlocksColor.sensing.primary,
            },
            {
                kind: 'category',
                name: OPERATORS,
                colour: BlocksColor.operators.primary,
            },
            {
                kind: 'category',
                name: VARIABLES,
                colour: BlocksColor.data.primary,
                custom: 'VARIABLE',
            },
            {
                kind: 'category',
                name: MY_BLOCKS,
                colour: BlocksColor.more.primary,
                custom: 'PROCEDURE',
            },
        ],
    };
};

export default getToolbox;
