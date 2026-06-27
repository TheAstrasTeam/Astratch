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
                        type: OPCODE.motion_goto,
                        inputs: {
                            TO: {
                                shadow: {
                                    type: OPCODE.motion_goto_menu,
                                },
                            },
                        },
                    },
                ],
            },
            {
                kind: 'category',
                name: LOOKS,
                colour: BlocksColor.looks.primary,
                contents: [],
            },
            {
                kind: 'category',
                name: SOUND,
                colour: BlocksColor.sounds.primary,
                contents: [],
            },
            {
                kind: 'category',
                name: EVENTS,
                colour: BlocksColor.event.primary,
                contents: [],
            },
            {
                kind: 'category',
                name: CONTROL,
                colour: BlocksColor.control.primary,
                contents: [],
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
