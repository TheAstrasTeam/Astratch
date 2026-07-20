import { t } from 'i18next';
import * as Blockly from 'blockly/core';
import { BlocksColor, OPCODE } from '../../types/blocks';

import turnLeft from './images/turnLeft.svg';
import turnRight from './images/turnRight.svg';
import greenFlag from './images/green-flag.svg';
import repeatIcon from './images/repeat.svg';

import { dropdownWithInput } from '../../../plugins/fieldDropdown';
import { FieldAngle } from '../../../plugins/field-angle/src';
import { FieldColourHsvSliders } from '../../../plugins/field-colour-hsv-sliders/src';
import { registerScratchComment, ScratchCommentBubble } from '../../../plugins/scratch-comment';
import { installCBlockWrap } from '../../../plugins/cBlockWrap';
import { modal } from '../../components/Modal/modal';
import { AlertModal } from '../../components/modal_alert';
import { ConfirmModal } from '../../components/modal_confirm';
import { PromptModal } from '../../components/modal_prompt';

/**
 * 对于链接积木的配置项
 */
const connections = {
    nextStatement: 'Action',
    previousStatement: 'Action',
    inputsInline: true,
} as const;

/**
 * 帽子积木配置项
 */
const hatConnections = {
    nextStatement: 'Action',
    hat: 'cap',
} as const;

/**
 * 结束积木配置项
 */
const endConnections = {
    previousStatement: 'Action',
} as const;

/**
 * 对于返回值
 */
const returnConnections = {
    inputsInline: true,
} as const;

export const collectOptions = (focusedNode: Blockly.IFocusableNode | null, e: Event) => {
    // 此函数由 Ai 生成
    let options: Blockly.ContextMenuRegistry.ContextMenuOption[] = [];

    if (focusedNode instanceof ScratchCommentBubble) {
        options = (
            focusedNode as unknown as {
                getContextMenuOptions(): Blockly.ContextMenuRegistry.ContextMenuOption[];
            }
        ).getContextMenuOptions();
    } else if (focusedNode instanceof Blockly.BlockSvg) {
        options = Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
            { block: focusedNode, focusedNode },
            e,
        );
    } else if (focusedNode instanceof Blockly.icons.Icon) {
        const block = focusedNode.getSourceBlock() as Blockly.BlockSvg;
        options = Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
            { block, focusedNode: block },
            e,
        );
    } else if (focusedNode instanceof Blockly.comments.RenderedWorkspaceComment) {
        options = Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
            { comment: focusedNode, focusedNode },
            e,
        );
    } else if (focusedNode instanceof Blockly.WorkspaceSvg) {
        options = Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
            { workspace: focusedNode, focusedNode },
            e,
        );
    }

    return options;
};

const initBlocks = (blockly: typeof Blockly) => {
    try {
        // 源代码所示，Blockly的注册积木仅会加入到 Map 中，
        // 因此可以直接删除
        const blockTypes = Object.keys(blockly.Blocks);
        blockTypes.forEach(type => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete blockly.Blocks[type];
        });
    } catch {
        // 不需要管
    }

    // 关于注释
    try {
        // 注册注释选项（添加/删除注释右键菜单），在空白工作区也可用
        blockly.ContextMenuItems.registerCommentOptions();
        // 注册 Scratch 风格注释图标，替换 Blockly 原生 CommentIcon
        registerScratchComment(blockly);
        // 内联切换，这个不该让用户手动修改
        // todo: 确认是否需要禁用
        blockly.ContextMenuRegistry.registry.unregister('blockInline');
    } catch {
        // 不需要管
    }
    blockly.fieldRegistry.unregister('field_dropdown_with_block');
    blockly.fieldRegistry.unregister('field_angle');
    blockly.fieldRegistry.unregister('field_colour');

    installCBlockWrap(blockly);
    blockly.fieldRegistry.register('field_dropdown_with_block', dropdownWithInput);
    blockly.fieldRegistry.register('field_angle', FieldAngle);
    blockly.fieldRegistry.register('field_colour', FieldColourHsvSliders);

    // 替换 blockly 自己的modal
    blockly.dialog.setAlert((message, callback) => {
        void modal.open(AlertModal, {
            message,
            callback,
        });
    });
    blockly.dialog.setConfirm((message, callback) => {
        void modal.open(ConfirmModal, {
            message,
            callback,
        });
    });
    blockly.dialog.setPrompt((message, defaultValue, callback) => {
        void modal.open(PromptModal, {
            message,
            defaultValue,
            callback
        })
    });

    // 事实上对于如下的`message0`在blockly都是无效的
    // i18next 不支持在消息id中填入空格
    // 对于实际上的名称需要参考 i18n/locales/*/blocks.json

    blockly.common.defineBlocksWithJsonArray([
        {
            type: OPCODE.math_number,
            colour: BlocksColor.textField,
            output: 'Number',
            message0: '%1',
            args0: [{ type: 'field_number', name: 'NUM', value: 0 }],
        },
        {
            type: OPCODE.math_integer,
            colour: BlocksColor.textField,
            output: 'Number',
            message0: '%1',
            args0: [{ type: 'field_number', name: 'NUM', precision: 1 }],
        },
        {
            type: OPCODE.math_whole_number,
            colour: BlocksColor.textField,
            output: 'Number',
            message0: '%1',
            args0: [{ type: 'field_number', name: 'NUM', min: 0, precision: 1 }],
        },
        {
            type: OPCODE.math_positive_number,
            colour: BlocksColor.textField,
            output: 'Number',
            message0: '%1',
            args0: [{ type: 'field_number', name: 'NUM', min: 0 }],
        },
        {
            type: OPCODE.math_angle,
            colour: BlocksColor.textField,
            output: 'Number',
            message0: '%1',
            args0: [{ type: 'field_angle', name: 'NUM', value: 90 }],
        },
        {
            type: OPCODE.text,
            colour: BlocksColor.textField,
            output: 'String',
            message0: '%1',
            args0: [{ type: 'field_input', name: 'TEXT' }],
        },
        {
            type: OPCODE.colour_picker,
            colour: BlocksColor.textField,
            output: 'String',
            message0: '%1',
            args0: [{ type: 'field_colour', name: 'COLOUR', colour: '#ff0000' }],
        },
        {
            ...connections,
            type: OPCODE.motion_movesteps,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_MOVESTEPS'),
            args0: [{ type: 'input_value', name: 'STEPS' }],
        },
        {
            ...connections,
            type: OPCODE.motion_turnright,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_TURNRIGHT'),
            args0: [
                {
                    type: 'field_image',
                    src: turnRight,
                    width: 24,
                    height: 24,
                    alt: t('blocks:MOTION_TURNRIGHT_ALT'),
                },
                { type: 'input_value', name: 'DEGREES' },
            ],
        },
        {
            ...connections,
            type: OPCODE.motion_turnleft,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_TURNLEFT'),
            args0: [
                {
                    type: 'field_image',
                    src: turnLeft,
                    width: 24,
                    height: 24,
                    alt: t('blocks:MOTION_TURNLEFT_ALT'),
                },
                { type: 'input_value', name: 'DEGREES' },
            ],
        },
        {
            ...connections,
            type: OPCODE.motion_pointindirection,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_POINTINDIRECTION'),
            args0: [{ type: 'input_value', name: 'DIRECTION' }],
        },
        {
            type: OPCODE.motion_pointtowards_menu,
            colour: BlocksColor.motion.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown_with_block',
                    name: 'TOWARDS',
                    options: () => {
                        // todo: 增加 targets 的 name, id
                        return [
                            [t('blocks:MOTION_POINTER'), '_mouse_'],
                            [t('blocks:MOTION_RANDOM'), '_random_'],
                        ];
                    },
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.motion_pointtowards,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_POINTTOWARDS'),
            args0: [{ type: 'input_value', name: 'TOWARDS' }],
        },
        {
            ...connections,
            type: OPCODE.motion_gotoxy,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_GOTOXY'),
            args0: [
                { type: 'input_value', name: 'X' },
                { type: 'input_value', name: 'Y' },
            ],
        },
        {
            ...connections,
            type: OPCODE.motion_goto,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_GOTO'),
            args0: [{ type: 'input_value', name: 'TO' }],
        },
        {
            type: OPCODE.motion_goto_menu,
            colour: BlocksColor.motion.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown_with_block',
                    name: 'TO',
                    options: () => {
                        // todo: 增加 targets 的 name, id
                        return [
                            [t('blocks:MOTION_RANDOM'), '_random_'],
                            [t('blocks:MOTION_POINTER'), '_mouse_'],
                        ];
                    },
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.motion_glidesecstoxy,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_GLIDESECSTOXY'),
            args0: [
                { type: 'input_value', name: 'SECS' },
                { type: 'input_value', name: 'X' },
                { type: 'input_value', name: 'Y' },
            ],
        },
        {
            ...connections,
            type: OPCODE.motion_glideto,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_GLIDETO'),
            args0: [
                { type: 'input_value', name: 'SECS' },
                { type: 'input_value', name: 'TO' },
            ],
        },
        {
            type: OPCODE.motion_glideto_menu,
            colour: BlocksColor.motion.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown_with_block',
                    name: 'TO',
                    options: () => {
                        // todo: 增加 targets 的 name, id
                        return [
                            [t('blocks:MOTION_POINTER'), '_mouse_'],
                            [t('blocks:MOTION_RANDOM'), '_random_'],
                        ];
                    },
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.motion_changexby,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_CHANGEXBY'),
            args0: [{ type: 'input_value', name: 'DX' }],
        },
        {
            ...connections,
            type: OPCODE.motion_setx,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_SETX'),
            args0: [{ type: 'input_value', name: 'X' }],
        },
        {
            ...connections,
            type: OPCODE.motion_changeyby,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_CHANGEYBY'),
            args0: [{ type: 'input_value', name: 'DY' }],
        },
        {
            ...connections,
            type: OPCODE.motion_sety,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_SETY'),
            args0: [{ type: 'input_value', name: 'Y' }],
        },
        {
            ...connections,
            type: OPCODE.motion_ifonedgebounce,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_IFONEDGEBOUNCE'),
        },
        {
            ...connections,
            type: OPCODE.motion_setrotationstyle,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_SETROTATIONSTYLE'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'STYLE',
                    options: [
                        [t('blocks:MOTION_SETROTATIONSTYLE_LEFTRIGHT'), 'left-right'],
                        [t('blocks:MOTION_SETROTATIONSTYLE_DONTROTATE'), "don't rotate"],
                        [t('blocks:MOTION_SETROTATIONSTYLE_ALLAROUND'), 'all around'],
                    ],
                },
            ],
        },
        {
            type: OPCODE.motion_xposition,
            colour: BlocksColor.motion.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:MOTION_XPOSITION'),
        },
        {
            type: OPCODE.motion_yposition,
            colour: BlocksColor.motion.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:MOTION_YPOSITION'),
        },
        {
            type: OPCODE.motion_direction,
            colour: BlocksColor.motion.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:MOTION_DIRECTION'),
        },
        {
            ...connections,
            type: OPCODE.motion_scroll_right,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_SCROLLRIGHT'),
            args0: [{ type: 'input_value', name: 'DISTANCE' }],
        },
        {
            ...connections,
            type: OPCODE.motion_scroll_up,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_SCROLLUP'),
            args0: [{ type: 'input_value', name: 'DISTANCE' }],
        },
        {
            ...connections,
            type: OPCODE.motion_align_scene,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:MOTION_ALIGNSCENE'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'ALIGNMENT',
                    options: [
                        [t('blocks:MOTION_ALIGNSCENE_BOTTOMLEFT'), 'bottom-left'],
                        [t('blocks:MOTION_ALIGNSCENE_BOTTOMRIGHT'), 'bottom-right'],
                        [t('blocks:MOTION_ALIGNSCENE_MIDDLE'), 'middle'],
                        [t('blocks:MOTION_ALIGNSCENE_TOPLEFT'), 'top-left'],
                        [t('blocks:MOTION_ALIGNSCENE_TOPRIGHT'), 'top-right'],
                    ],
                },
            ],
        },
        {
            type: OPCODE.motion_xscroll,
            colour: BlocksColor.motion.primary,
            output: 'Number',
            message0: t('blocks:MOTION_XSCROLL'),
        },
        {
            type: OPCODE.motion_yscroll,
            colour: BlocksColor.motion.primary,
            output: 'Number',
            message0: t('blocks:MOTION_YSCROLL'),
        },
        {
            ...connections,
            type: OPCODE.looks_sayforsecs,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_SAYFORSECS'),
            args0: [
                { type: 'input_value', name: 'MESSAGE' },
                { type: 'input_value', name: 'SECS' },
            ],
        },
        {
            ...connections,
            type: OPCODE.looks_say,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_SAY'),
            args0: [{ type: 'input_value', name: 'MESSAGE' }],
        },
        {
            ...connections,
            type: OPCODE.looks_thinkforsecs,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_THINKFORSECS'),
            args0: [
                { type: 'input_value', name: 'MESSAGE' },
                { type: 'input_value', name: 'SECS' },
            ],
        },
        {
            ...connections,
            type: OPCODE.looks_think,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_THINK'),
            args0: [{ type: 'input_value', name: 'MESSAGE' }],
        },
        {
            ...connections,
            type: OPCODE.looks_show,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_SHOW'),
        },
        {
            ...connections,
            type: OPCODE.looks_hide,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_HIDE'),
        },
        {
            ...connections,
            type: OPCODE.looks_hideallsprites,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_HIDEALLSPRITES'),
        },
        {
            ...connections,
            type: OPCODE.looks_changeeffectby,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_CHANGEEFFECTBY'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'EFFECT',
                    options: [
                        [t('blocks:LOOKS_EFFECT_COLOR'), 'COLOR'],
                        [t('blocks:LOOKS_EFFECT_FISHEYE'), 'FISHEYE'],
                        [t('blocks:LOOKS_EFFECT_WHIRL'), 'WHIRL'],
                        [t('blocks:LOOKS_EFFECT_PIXELATE'), 'PIXELATE'],
                        [t('blocks:LOOKS_EFFECT_MOSAIC'), 'MOSAIC'],
                        [t('blocks:LOOKS_EFFECT_BRIGHTNESS'), 'BRIGHTNESS'],
                        [t('blocks:LOOKS_EFFECT_GHOST'), 'GHOST'],
                    ],
                },
                { type: 'input_value', name: 'CHANGE' },
            ],
        },
        {
            ...connections,
            type: OPCODE.looks_seteffectto,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_SETEFFECTTO'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'EFFECT',
                    options: [
                        [t('blocks:LOOKS_EFFECT_COLOR'), 'COLOR'],
                        [t('blocks:LOOKS_EFFECT_FISHEYE'), 'FISHEYE'],
                        [t('blocks:LOOKS_EFFECT_WHIRL'), 'WHIRL'],
                        [t('blocks:LOOKS_EFFECT_PIXELATE'), 'PIXELATE'],
                        [t('blocks:LOOKS_EFFECT_MOSAIC'), 'MOSAIC'],
                        [t('blocks:LOOKS_EFFECT_BRIGHTNESS'), 'BRIGHTNESS'],
                        [t('blocks:LOOKS_EFFECT_GHOST'), 'GHOST'],
                    ],
                },
                { type: 'input_value', name: 'VALUE' },
            ],
        },
        {
            ...connections,
            type: OPCODE.looks_cleargraphiceffects,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_CLEARGRAPHICEFFECTS'),
        },
        {
            ...connections,
            type: OPCODE.looks_changesizeby,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_CHANGESIZEBY'),
            args0: [{ type: 'input_value', name: 'CHANGE' }],
        },
        {
            ...connections,
            type: OPCODE.looks_setsizeto,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_SETSIZETO'),
            args0: [{ type: 'input_value', name: 'SIZE' }],
        },
        {
            type: OPCODE.looks_size,
            colour: BlocksColor.looks.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:LOOKS_SIZE'),
        },
        {
            ...connections,
            type: OPCODE.looks_changestretchby,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_CHANGESTRETCHBY'),
            args0: [{ type: 'input_value', name: 'CHANGE' }],
        },
        {
            ...connections,
            type: OPCODE.looks_setstretchto,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_SETSTRETCHTO'),
            args0: [{ type: 'input_value', name: 'STRETCH' }],
        },
        {
            type: OPCODE.looks_costume,
            colour: BlocksColor.looks.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown_with_block',
                    name: 'COSTUME',
                    options: () => {
                        // todo: 动态获取当前角色的造型列表
                        return [
                            ['costume1', 'COSTUME1'],
                            ['costume2', 'COSTUME2'],
                        ];
                    },
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.looks_switchcostumeto,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_SWITCHCOSTUMETO'),
            args0: [{ type: 'input_value', name: 'COSTUME' }],
        },
        {
            ...connections,
            type: OPCODE.looks_nextcostume,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_NEXTCOSTUME'),
        },
        {
            type: OPCODE.looks_backdrops,
            colour: BlocksColor.looks.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown_with_block',
                    name: 'BACKDROP',
                    options: () => {
                        // todo: 动态获取背景列表
                        return [['backdrop1', 'BACKDROP1']];
                    },
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.looks_switchbackdropto,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_SWITCHBACKDROPTO'),
            args0: [{ type: 'input_value', name: 'BACKDROP' }],
        },
        {
            ...connections,
            type: OPCODE.looks_switchbackdroptoandwait,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_SWITCHBACKDROPTOANDWAIT'),
            args0: [{ type: 'input_value', name: 'BACKDROP' }],
        },
        {
            ...connections,
            type: OPCODE.looks_nextbackdrop,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_NEXTBACKDROP'),
        },
        {
            ...connections,
            type: OPCODE.looks_gotofrontback,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_GOTOFRONTBACK'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'FRONT_BACK',
                    options: [
                        [t('blocks:LOOKS_GOTOFRONTBACK_FRONT'), 'front'],
                        [t('blocks:LOOKS_GOTOFRONTBACK_BACK'), 'back'],
                    ],
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.looks_goforwardbackwardlayers,
            colour: BlocksColor.looks.primary,
            message0: t('blocks:LOOKS_GOFORWARDBACKWARDLAYERS'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'FORWARD_BACKWARD',
                    options: [
                        [t('blocks:LOOKS_GOFORWARDBACKWARDLAYERS_FORWARD'), 'forward'],
                        [t('blocks:LOOKS_GOFORWARDBACKWARDLAYERS_BACKWARD'), 'backward'],
                    ],
                },
                { type: 'input_value', name: 'NUM' },
            ],
        },
        {
            type: OPCODE.looks_costumenumbername,
            colour: BlocksColor.looks.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:LOOKS_COSTUMENUMBERNAME'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'NUMBER_NAME',
                    options: [
                        [t('blocks:LOOKS_NUMBERNAME_NUMBER'), 'number'],
                        [t('blocks:LOOKS_NUMBERNAME_NAME'), 'name'],
                    ],
                },
            ],
        },
        {
            type: OPCODE.looks_backdropnumbername,
            colour: BlocksColor.looks.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:LOOKS_BACKDROPNUMBERNAME'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'NUMBER_NAME',
                    options: [
                        [t('blocks:LOOKS_NUMBERNAME_NUMBER'), 'number'],
                        [t('blocks:LOOKS_NUMBERNAME_NAME'), 'name'],
                    ],
                },
            ],
        },
        {
            type: OPCODE.sound_sounds_menu,
            colour: BlocksColor.sounds.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown_with_block',
                    name: 'SOUND_MENU',
                    options: () => {
                        // todo: 动态获取当前角色的声音列表
                        return [
                            ['1', '0'],
                            ['2', '1'],
                            ['3', '2'],
                            ['4', '3'],
                            ['5', '4'],
                            ['6', '5'],
                            ['7', '6'],
                            ['8', '7'],
                            ['9', '8'],
                            ['10', '9'],
                        ];
                    },
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.sound_play,
            colour: BlocksColor.sounds.primary,
            message0: t('blocks:SOUND_PLAY'),
            args0: [{ type: 'input_value', name: 'SOUND_MENU' }],
        },
        {
            ...connections,
            type: OPCODE.sound_playuntildone,
            colour: BlocksColor.sounds.primary,
            message0: t('blocks:SOUND_PLAYUNTILDONE'),
            args0: [{ type: 'input_value', name: 'SOUND_MENU' }],
        },
        {
            ...connections,
            type: OPCODE.sound_stopallsounds,
            colour: BlocksColor.sounds.primary,
            message0: t('blocks:SOUND_STOPALLSOUNDS'),
        },
        {
            ...connections,
            type: OPCODE.sound_seteffectto,
            colour: BlocksColor.sounds.primary,
            message0: t('blocks:SOUND_SETEFFECTO'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'EFFECT',
                    options: [
                        [t('blocks:SOUND_EFFECTS_PITCH'), 'PITCH'],
                        [t('blocks:SOUND_EFFECTS_PAN'), 'PAN'],
                    ],
                },
                { type: 'input_value', name: 'VALUE' },
            ],
        },
        {
            ...connections,
            type: OPCODE.sound_changeeffectby,
            colour: BlocksColor.sounds.primary,
            message0: t('blocks:SOUND_CHANGEEFFECTBY'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'EFFECT',
                    options: [
                        [t('blocks:SOUND_EFFECTS_PITCH'), 'PITCH'],
                        [t('blocks:SOUND_EFFECTS_PAN'), 'PAN'],
                    ],
                },
                { type: 'input_value', name: 'VALUE' },
            ],
        },
        {
            ...connections,
            type: OPCODE.sound_cleareffects,
            colour: BlocksColor.sounds.primary,
            message0: t('blocks:SOUND_CLEAREFFECTS'),
        },
        {
            ...connections,
            type: OPCODE.sound_changevolumeby,
            colour: BlocksColor.sounds.primary,
            message0: t('blocks:SOUND_CHANGEVOLUMEBY'),
            args0: [{ type: 'input_value', name: 'VOLUME' }],
        },
        {
            ...connections,
            type: OPCODE.sound_setvolumeto,
            colour: BlocksColor.sounds.primary,
            message0: t('blocks:SOUND_SETVOLUMETO'),
            args0: [{ type: 'input_value', name: 'VOLUME' }],
        },
        {
            type: OPCODE.sound_volume,
            colour: BlocksColor.sounds.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:SOUND_VOLUME'),
        },
        // todo: sound_beats_menu, sound_effects_menu 需扩展积木支持
        {
            type: OPCODE.sound_beats_menu,
            colour: BlocksColor.sounds.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'BEAT',
                    options: [
                        ['0.25', '0.25'],
                        ['0.5', '0.5'],
                        ['1', '1'],
                        ['2', '2'],
                        ['4', '4'],
                    ],
                },
            ],
        },
        {
            type: OPCODE.sound_effects_menu,
            colour: BlocksColor.sounds.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'EFFECT',
                    options: [
                        [t('blocks:SOUND_EFFECTS_PITCH'), 'PITCH'],
                        [t('blocks:SOUND_EFFECTS_PAN'), 'PAN'],
                    ],
                },
            ],
        },
        {
            ...hatConnections,
            type: OPCODE.event_whenflagclicked,
            colour: BlocksColor.event.primary,
            message0: t('blocks:EVENT_WHENFLAGCLICKED'),
            args0: [{ type: 'field_image', src: greenFlag, width: 24, height: 24, alt: 'flag' }],
        },
        {
            ...hatConnections,
            type: OPCODE.event_whenkeypressed,
            colour: BlocksColor.event.primary,
            message0: t('blocks:EVENT_WHENKEYPRESSED'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'KEY_OPTION',
                    options: [
                        [t('blocks:EVENT_WHENKEYPRESSED_SPACE'), 'space'],
                        ['↑', 'up arrow'],
                        ['↓', 'down arrow'],
                        ['→', 'right arrow'],
                        ['←', 'left arrow'],
                        [t('blocks:EVENT_WHENKEYPRESSED_ANY'), 'any'],
                        ...'abcdefghijklmnopqrstuvwxyz0123456789'.split('').map(k => [k, k]),
                    ],
                },
            ],
        },
        {
            ...hatConnections,
            type: OPCODE.event_whenthisspriteclicked,
            colour: BlocksColor.event.primary,
            message0: t('blocks:EVENT_WHENTHISSPRITECLICKED'),
        },
        {
            ...hatConnections,
            type: OPCODE.event_whenstageclicked,
            colour: BlocksColor.event.primary,
            message0: t('blocks:EVENT_WHENSTAGECLICKED'),
        },
        {
            ...hatConnections,
            type: OPCODE.event_whenbackdropswitchesto,
            colour: BlocksColor.event.primary,
            message0: t('blocks:EVENT_WHENBACKDROPSWITCHESTO'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'BACKDROP',
                    options: () => {
                        // todo: 动态获取背景列表
                        return [['backdrop1', 'BACKDROP1']];
                    },
                },
            ],
        },
        {
            ...hatConnections,
            type: OPCODE.event_whengreaterthan,
            colour: BlocksColor.event.primary,
            message0: t('blocks:EVENT_WHENGREATERTHAN'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'WHENGREATERTHANMENU',
                    options: [
                        [t('blocks:SENSING_LOUDNESS'), 'LOUDNESS'],
                        [t('blocks:SENSING_TIMER'), 'TIMER'],
                    ],
                },
                { type: 'input_value', name: 'VALUE' },
            ],
        },
        {
            ...hatConnections,
            type: OPCODE.event_whenbroadcastreceived,
            colour: BlocksColor.event.primary,
            message0: t('blocks:EVENT_WHENBROADCASTRECEIVED'),
            args0: [
                // todo: 使用广播变量类型 (broadcast message variable type)
                { type: 'field_variable', name: 'BROADCAST_OPTION', variable: 'message1' },
            ],
        },
        {
            type: OPCODE.event_broadcast_menu,
            colour: BlocksColor.event.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                // todo: 使用广播变量类型
                { type: 'field_variable', name: 'BROADCAST_OPTION', variable: 'message1' },
            ],
        },
        {
            type: OPCODE.event_touchingobjectmenu,
            colour: BlocksColor.event.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown_with_block',
                    name: 'TOUCHINGOBJECTMENU',
                    options: () => {
                        // todo: 增加 targets 的 name, id
                        return [
                            [t('blocks:MOTION_POINTER'), '_mouse_'],
                            [t('blocks:SENSING_TOUCHINGOBJECT_EDGE'), '_edge_'],
                        ];
                    },
                },
            ],
        },
        {
            ...hatConnections,
            type: OPCODE.event_whentouchingobject,
            colour: BlocksColor.event.primary,
            message0: t('blocks:EVENT_WHENTOUCHINGOBJECT'),
            args0: [{ type: 'input_value', name: 'TOUCHINGOBJECTMENU' }],
        },
        {
            ...connections,
            type: OPCODE.event_broadcast,
            colour: BlocksColor.event.primary,
            message0: t('blocks:EVENT_BROADCAST'),
            args0: [{ type: 'input_value', name: 'BROADCAST_INPUT' }],
        },
        {
            ...connections,
            type: OPCODE.event_broadcastandwait,
            colour: BlocksColor.event.primary,
            message0: t('blocks:EVENT_BROADCASTANDWAIT'),
            args0: [{ type: 'input_value', name: 'BROADCAST_INPUT' }],
        },
        {
            ...connections,
            type: OPCODE.control_wait,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_WAIT'),
            args0: [{ type: 'input_value', name: 'DURATION' }],
        },
        {
            ...connections,
            type: OPCODE.control_repeat,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_REPEAT'),
            message1: '%1',
            lastDummyAlign2: 'RIGHT',
            args0: [{ type: 'input_value', name: 'TIMES' }],
            args1: [{ type: 'input_statement', name: 'SUBSTACK' }],
            message2: '%1',
            args2: [
                {
                    type: 'field_image',
                    src: repeatIcon,
                    width: 24,
                    height: 24,
                    alt: '*',
                    flipRtl: true,
                },
            ],
        },
        {
            ...endConnections,
            type: OPCODE.control_forever,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_FOREVER'),
            message1: '%1',
            lastDummyAlign2: 'RIGHT',
            args1: [{ type: 'input_statement', name: 'SUBSTACK' }],
            message2: '%1',
            args2: [
                {
                    type: 'field_image',
                    src: repeatIcon,
                    width: 24,
                    height: 24,
                    alt: '*',
                    flipRtl: true,
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.control_if,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_IF'),
            message1: '%1',
            args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
            args1: [{ type: 'input_statement', name: 'SUBSTACK' }],
        },
        {
            ...connections,
            type: OPCODE.control_if_else,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_IF'),
            message1: '%1',
            message2: t('blocks:CONTROL_ELSE'),
            message3: '%1',
            args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
            args1: [{ type: 'input_statement', name: 'SUBSTACK' }],
            args3: [{ type: 'input_statement', name: 'SUBSTACK2' }],
        },
        {
            ...connections,
            type: OPCODE.control_wait_until,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_WAITUNTIL'),
            args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
        },
        {
            ...connections,
            type: OPCODE.control_repeat_until,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_REPEATUNTIL'),
            message1: '%1',
            lastDummyAlign2: 'RIGHT',
            args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
            args1: [{ type: 'input_statement', name: 'SUBSTACK' }],
            message2: '%1',
            args2: [
                {
                    type: 'field_image',
                    src: repeatIcon,
                    width: 24,
                    height: 24,
                    alt: '*',
                    flipRtl: true,
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.control_while,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_WHILE'),
            message1: '%1',
            lastDummyAlign2: 'RIGHT',
            args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
            args1: [{ type: 'input_statement', name: 'SUBSTACK' }],
            message2: '%1',
            args2: [
                {
                    type: 'field_image',
                    src: repeatIcon,
                    width: 24,
                    height: 24,
                    alt: '*',
                    flipRtl: true,
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.control_for_each,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_FOREACH'),
            message1: '%1',
            args0: [
                { type: 'field_variable', name: 'VARIABLE' },
                { type: 'input_value', name: 'VALUE' },
            ],
            args1: [{ type: 'input_statement', name: 'SUBSTACK' }],
        },
        {
            ...endConnections,
            type: OPCODE.control_stop,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_STOP'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'STOP_OPTION',
                    options: [
                        [t('blocks:CONTROL_STOP_ALL'), 'all'],
                        [t('blocks:CONTROL_STOP_THIS'), 'this script'],
                        [t('blocks:CONTROL_STOP_OTHER'), 'other scripts in sprite'],
                    ],
                },
            ],
            // todo: control_stop 在 Scratch 中会根据选项动态切换 nextStatement (选 "other scripts" 时无 next)
        },
        {
            ...hatConnections,
            type: OPCODE.control_start_as_clone,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_STARTASCLONE'),
        },
        {
            type: OPCODE.control_create_clone_of_menu,
            colour: BlocksColor.control.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown_with_block',
                    name: 'CLONE_OPTION',
                    options: () => {
                        // todo: 增加 targets 的 name, id
                        return [[t('blocks:CONTROL_CREATECLONEOF_MYSELF'), '_myself_']];
                    },
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.control_create_clone_of,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_CREATECLONEOF'),
            args0: [{ type: 'input_value', name: 'CLONE_OPTION' }],
        },
        {
            ...endConnections,
            type: OPCODE.control_delete_this_clone,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_DELETETHISCLONE'),
        },
        {
            type: OPCODE.control_get_counter,
            colour: BlocksColor.control.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:CONTROL_COUNTER'),
        },
        {
            ...connections,
            type: OPCODE.control_incr_counter,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_INCRCOUNTER'),
        },
        {
            ...connections,
            type: OPCODE.control_clear_counter,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_CLEARCOUNTER'),
        },
        {
            ...connections,
            type: OPCODE.control_all_at_once,
            colour: BlocksColor.control.primary,
            message0: t('blocks:CONTROL_ALLATONCE'),
            message1: '%1',
            args1: [{ type: 'input_statement', name: 'SUBSTACK' }],
        },
        {
            type: OPCODE.sensing_touchingobjectmenu,
            colour: BlocksColor.sensing.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown_with_block',
                    name: 'TOUCHINGOBJECTMENU',
                    options: () => {
                        // todo: 增加 targets 的 name, id
                        return [
                            [t('blocks:MOTION_POINTER'), '_mouse_'],
                            [t('blocks:SENSING_TOUCHINGOBJECT_EDGE'), '_edge_'],
                        ];
                    },
                },
            ],
        },
        {
            type: OPCODE.sensing_touchingobject,
            colour: BlocksColor.sensing.primary,
            output: 'Boolean',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_TOUCHINGOBJECT'),
            args0: [{ type: 'input_value', name: 'TOUCHINGOBJECTMENU' }],
        },
        {
            type: OPCODE.sensing_touchingcolor,
            colour: BlocksColor.sensing.primary,
            output: 'Boolean',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_TOUCHINGCOLOR'),
            args0: [{ type: 'input_value', name: 'COLOR' }],
        },
        {
            type: OPCODE.sensing_coloristouchingcolor,
            colour: BlocksColor.sensing.primary,
            output: 'Boolean',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_COLORISTOUCHINGCOLOR'),
            args0: [
                { type: 'input_value', name: 'COLOR' },
                { type: 'input_value', name: 'COLOR2' },
            ],
        },
        {
            type: OPCODE.sensing_distancetomenu,
            colour: BlocksColor.sensing.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown_with_block',
                    name: 'DISTANCETOMENU',
                    options: () => {
                        // todo: 增加 targets 的 name, id
                        return [[t('blocks:MOTION_POINTER'), '_mouse_']];
                    },
                },
            ],
        },
        {
            type: OPCODE.sensing_distanceto,
            colour: BlocksColor.sensing.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_DISTANCETO'),
            args0: [{ type: 'input_value', name: 'DISTANCETOMENU' }],
        },
        {
            ...connections,
            type: OPCODE.sensing_askandwait,
            colour: BlocksColor.sensing.primary,
            message0: t('blocks:SENSING_ASKANDWAIT'),
            args0: [{ type: 'input_value', name: 'QUESTION' }],
        },
        {
            type: OPCODE.sensing_answer,
            colour: BlocksColor.sensing.primary,
            output: 'String',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_ANSWER'),
        },
        {
            type: OPCODE.sensing_keyoptions,
            colour: BlocksColor.sensing.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'KEY_OPTION',
                    options: [
                        [t('blocks:EVENT_WHENKEYPRESSED_SPACE'), 'space'],
                        [t('blocks:EVENT_WHENKEYPRESSED_UP'), 'up arrow'],
                        [t('blocks:EVENT_WHENKEYPRESSED_DOWN'), 'down arrow'],
                        [t('blocks:EVENT_WHENKEYPRESSED_RIGHT'), 'right arrow'],
                        [t('blocks:EVENT_WHENKEYPRESSED_LEFT'), 'left arrow'],
                        [t('blocks:EVENT_WHENKEYPRESSED_ANY'), 'any'],
                        ...'abcdefghijklmnopqrstuvwxyz'.split('').map(k => [k, k]),
                        ...'0123456789'.split('').map(k => [k, k]),
                    ],
                },
            ],
        },
        {
            type: OPCODE.sensing_keypressed,
            colour: BlocksColor.sensing.primary,
            output: 'Boolean',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_KEYPRESSED'),
            args0: [{ type: 'input_value', name: 'KEY_OPTION' }],
        },
        {
            type: OPCODE.sensing_mousedown,
            colour: BlocksColor.sensing.primary,
            output: 'Boolean',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_MOUSEDOWN'),
        },
        {
            type: OPCODE.sensing_mousex,
            colour: BlocksColor.sensing.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_MOUSEX'),
        },
        {
            type: OPCODE.sensing_mousey,
            colour: BlocksColor.sensing.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_MOUSEY'),
        },
        {
            ...connections,
            type: OPCODE.sensing_setdragmode,
            colour: BlocksColor.sensing.primary,
            message0: t('blocks:SENSING_SETDRAGMODE'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'DRAG_MODE',
                    options: [
                        [t('blocks:SENSING_SETDRAGMODE_DRAGGABLE'), 'draggable'],
                        [t('blocks:SENSING_SETDRAGMODE_NOTDRAGGABLE'), 'not draggable'],
                    ],
                },
            ],
        },
        {
            type: OPCODE.sensing_loudness,
            colour: BlocksColor.sensing.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_LOUDNESS'),
        },
        {
            type: OPCODE.sensing_loud,
            colour: BlocksColor.sensing.primary,
            output: 'Boolean',
            message0: t('blocks:SENSING_LOUD'),
        },
        {
            type: OPCODE.sensing_timer,
            colour: BlocksColor.sensing.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_TIMER'),
        },
        {
            ...connections,
            type: OPCODE.sensing_resettimer,
            colour: BlocksColor.sensing.primary,
            message0: t('blocks:SENSING_RESETTIMER'),
        },
        {
            type: OPCODE.sensing_of_object_menu,
            colour: BlocksColor.sensing.secondary,
            output: 'String',
            checkboxInFlyout: true,
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown_with_block',
                    name: 'OBJECT',
                    options: () => {
                        // todo: 动态获取角色列表
                        return [
                            ['Sprite1', 'Sprite1'],
                            ['Stage', '_stage_'],
                        ];
                    },
                },
            ],
        },
        {
            type: OPCODE.sensing_of,
            colour: BlocksColor.sensing.primary,
            output: 'String',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_OF'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'PROPERTY',
                    options: [
                        [t('blocks:MOTION_XPOSITION'), 'x position'],
                        [t('blocks:MOTION_YPOSITION'), 'y position'],
                        [t('blocks:MOTION_DIRECTION'), 'direction'],
                        [t('blocks:SENSING_OF_COSTUMENUMBER'), 'costume #'],
                        [t('blocks:SENSING_OF_COSTUMENAME'), 'costume name'],
                        [t('blocks:LOOKS_SIZE'), 'size'],
                        [t('blocks:SOUND_VOLUME'), 'volume'],
                        [t('blocks:SENSING_OF_BACKDROPNUMBER'), 'backdrop #'],
                        [t('blocks:SENSING_OF_BACKDROPNAME'), 'backdrop name'],
                    ],
                },
                { type: 'input_value', name: 'OBJECT' },
            ],
        },
        {
            type: OPCODE.sensing_current,
            colour: BlocksColor.sensing.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_CURRENT'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'CURRENTMENU',
                    options: [
                        [t('blocks:SENSING_CURRENT_YEAR'), 'YEAR'],
                        [t('blocks:SENSING_CURRENT_MONTH'), 'MONTH'],
                        [t('blocks:SENSING_CURRENT_DATE'), 'DATE'],
                        [t('blocks:SENSING_CURRENT_DAYOFWEEK'), 'DAYOFWEEK'],
                        [t('blocks:SENSING_CURRENT_HOUR'), 'HOUR'],
                        [t('blocks:SENSING_CURRENT_MINUTE'), 'MINUTE'],
                        [t('blocks:SENSING_CURRENT_SECOND'), 'SECOND'],
                    ],
                },
            ],
        },
        {
            type: OPCODE.sensing_dayssince2000,
            colour: BlocksColor.sensing.primary,
            output: 'Number',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_DAYSSINCE2000'),
        },
        {
            type: OPCODE.sensing_username,
            colour: BlocksColor.sensing.primary,
            output: 'String',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_USERNAME'),
        },
        {
            type: OPCODE.sensing_userid,
            colour: BlocksColor.sensing.primary,
            output: 'Number',
            message0: t('blocks:SENSING_USERID'),
        },
        {
            type: OPCODE.sensing_online,
            colour: BlocksColor.sensing.primary,
            output: 'Boolean',
            checkboxInFlyout: true,
            message0: t('blocks:SENSING_ONLINE'),
        },
        {
            ...returnConnections,
            type: OPCODE.operator_add,
            colour: BlocksColor.operators.primary,
            output: 'Number',
            message0: t('blocks:OPERATORS_ADD'),
            args0: [
                { type: 'input_value', name: 'NUM1' },
                { type: 'input_value', name: 'NUM2' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_subtract,
            colour: BlocksColor.operators.primary,
            output: 'Number',
            message0: t('blocks:OPERATORS_SUBTRACT'),
            args0: [
                { type: 'input_value', name: 'NUM1' },
                { type: 'input_value', name: 'NUM2' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_multiply,
            colour: BlocksColor.operators.primary,
            output: 'Number',
            message0: t('blocks:OPERATORS_MULTIPLY'),
            args0: [
                { type: 'input_value', name: 'NUM1' },
                { type: 'input_value', name: 'NUM2' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_divide,
            colour: BlocksColor.operators.primary,
            output: 'Number',
            message0: t('blocks:OPERATORS_DIVIDE'),
            args0: [
                { type: 'input_value', name: 'NUM1' },
                { type: 'input_value', name: 'NUM2' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_random,
            colour: BlocksColor.operators.primary,
            output: 'Number',
            message0: t('blocks:OPERATORS_RANDOM'),
            args0: [
                { type: 'input_value', name: 'FROM' },
                { type: 'input_value', name: 'TO' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_lt,
            colour: BlocksColor.operators.primary,
            output: 'Boolean',
            message0: t('blocks:OPERATORS_LT'),
            args0: [
                { type: 'input_value', name: 'OPERAND1' },
                { type: 'input_value', name: 'OPERAND2' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_equals,
            colour: BlocksColor.operators.primary,
            output: 'Boolean',
            message0: t('blocks:OPERATORS_EQUALS'),
            args0: [
                { type: 'input_value', name: 'OPERAND1' },
                { type: 'input_value', name: 'OPERAND2' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_gt,
            colour: BlocksColor.operators.primary,
            output: 'Boolean',
            message0: t('blocks:OPERATORS_GT'),
            args0: [
                { type: 'input_value', name: 'OPERAND1' },
                { type: 'input_value', name: 'OPERAND2' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_and,
            colour: BlocksColor.operators.primary,
            output: 'Boolean',
            message0: t('blocks:OPERATORS_AND'),
            args0: [
                { type: 'input_value', name: 'OPERAND1', check: 'Boolean' },
                { type: 'input_value', name: 'OPERAND2', check: 'Boolean' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_or,
            colour: BlocksColor.operators.primary,
            output: 'Boolean',
            message0: t('blocks:OPERATORS_OR'),
            args0: [
                { type: 'input_value', name: 'OPERAND1', check: 'Boolean' },
                { type: 'input_value', name: 'OPERAND2', check: 'Boolean' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_not,
            colour: BlocksColor.operators.primary,
            output: 'Boolean',
            message0: t('blocks:OPERATORS_NOT'),
            args0: [{ type: 'input_value', name: 'OPERAND', check: 'Boolean' }],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_join,
            colour: BlocksColor.operators.primary,
            output: 'String',
            message0: t('blocks:OPERATORS_JOIN'),
            args0: [
                { type: 'input_value', name: 'STRING1' },
                { type: 'input_value', name: 'STRING2' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_letter_of,
            colour: BlocksColor.operators.primary,
            output: 'String',
            message0: t('blocks:OPERATORS_LETTEROF'),
            args0: [
                { type: 'input_value', name: 'LETTER' },
                { type: 'input_value', name: 'STRING' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_length,
            colour: BlocksColor.operators.primary,
            output: 'Number',
            message0: t('blocks:OPERATORS_LENGTH'),
            args0: [{ type: 'input_value', name: 'STRING' }],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_contains,
            colour: BlocksColor.operators.primary,
            output: 'Boolean',
            message0: t('blocks:OPERATORS_CONTAINS'),
            args0: [
                { type: 'input_value', name: 'STRING1' },
                { type: 'input_value', name: 'STRING2' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_mod,
            colour: BlocksColor.operators.primary,
            output: 'Number',
            message0: t('blocks:OPERATORS_MOD'),
            args0: [
                { type: 'input_value', name: 'NUM1' },
                { type: 'input_value', name: 'NUM2' },
            ],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_round,
            colour: BlocksColor.operators.primary,
            output: 'Number',
            message0: t('blocks:OPERATORS_ROUND'),
            args0: [{ type: 'input_value', name: 'NUM' }],
        },
        {
            ...returnConnections,
            type: OPCODE.operator_mathop,
            colour: BlocksColor.operators.primary,
            output: 'Number',
            message0: t('blocks:OPERATORS_MATHOP'),
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'OPERATOR',
                    options: [
                        [t('blocks:OPERATORS_MATHOP_ABS'), 'abs'],
                        [t('blocks:OPERATORS_MATHOP_FLOOR'), 'floor'],
                        [t('blocks:OPERATORS_MATHOP_CEILING'), 'ceiling'],
                        [t('blocks:OPERATORS_MATHOP_SQRT'), 'sqrt'],
                        [t('blocks:OPERATORS_MATHOP_SIN'), 'sin'],
                        [t('blocks:OPERATORS_MATHOP_COS'), 'cos'],
                        [t('blocks:OPERATORS_MATHOP_TAN'), 'tan'],
                        [t('blocks:OPERATORS_MATHOP_ASIN'), 'asin'],
                        [t('blocks:OPERATORS_MATHOP_ACOS'), 'acos'],
                        [t('blocks:OPERATORS_MATHOP_ATAN'), 'atan'],
                        [t('blocks:OPERATORS_MATHOP_LN'), 'ln'],
                        [t('blocks:OPERATORS_MATHOP_LOG'), 'log'],
                        [t('blocks:OPERATORS_MATHOP_EEXP'), 'e ^'],
                        [t('blocks:OPERATORS_MATHOP_10EXP'), '10 ^'],
                    ],
                },
                { type: 'input_value', name: 'NUM' },
            ],
        },
        {
            type: OPCODE.data_variable,
            colour: BlocksColor.data.primary,
            output: 'String',
            checkboxInFlyout: true,
            message0: '%1',
            args0: [
                // todo: scratch 使用 field_variable_getter (不可编辑的 getter), 这里暂用 field_variable
                { type: 'field_variable', name: 'VARIABLE', variable: 'my variable' },
            ],
        },
        {
            ...connections,
            type: OPCODE.data_setvariableto,
            colour: BlocksColor.data.primary,
            message0: t('blocks:DATA_SETVARIABLETO'),
            args0: [
                { type: 'field_variable', name: 'VARIABLE', variable: 'my variable' },
                { type: 'input_value', name: 'VALUE' },
            ],
        },
        {
            ...connections,
            type: OPCODE.data_changevariableby,
            colour: BlocksColor.data.primary,
            message0: t('blocks:DATA_CHANGEVARIABLEBY'),
            args0: [
                { type: 'field_variable', name: 'VARIABLE', variable: 'my variable' },
                { type: 'input_value', name: 'VALUE' },
            ],
        },
        {
            ...connections,
            type: OPCODE.data_showvariable,
            colour: BlocksColor.data.primary,
            message0: t('blocks:DATA_SHOWVARIABLE'),
            args0: [{ type: 'field_variable', name: 'VARIABLE', variable: 'my variable' }],
        },
        {
            ...connections,
            type: OPCODE.data_hidevariable,
            colour: BlocksColor.data.primary,
            message0: t('blocks:DATA_HIDEVARIABLE'),
            args0: [{ type: 'field_variable', name: 'VARIABLE', variable: 'my variable' }],
        },
        // 列表积木
        {
            type: OPCODE.data_listcontents,
            colour: BlocksColor.data_lists.primary,
            output: 'String',
            checkboxInFlyout: true,
            message0: '%1',
            args0: [
                // todo: scratch 使用 field_variable_getter + list variable type
                { type: 'field_variable', name: 'LIST', variable: 'my list' },
            ],
        },
        {
            ...connections,
            type: OPCODE.data_addtolist,
            colour: BlocksColor.data_lists.primary,
            message0: t('blocks:DATA_ADDTOLIST'),
            args0: [
                { type: 'input_value', name: 'ITEM' },
                { type: 'field_variable', name: 'LIST', variable: 'my list' },
            ],
        },
        {
            ...connections,
            type: OPCODE.data_deleteoflist,
            colour: BlocksColor.data_lists.primary,
            message0: t('blocks:DATA_DELETEOFLIST'),
            args0: [
                { type: 'input_value', name: 'INDEX' },
                { type: 'field_variable', name: 'LIST', variable: 'my list' },
            ],
        },
        {
            ...connections,
            type: OPCODE.data_deletealloflist,
            colour: BlocksColor.data_lists.primary,
            message0: t('blocks:DATA_DELETEALLOFLIST'),
            args0: [{ type: 'field_variable', name: 'LIST', variable: 'my list' }],
        },
        {
            ...connections,
            type: OPCODE.data_insertatlist,
            colour: BlocksColor.data_lists.primary,
            message0: t('blocks:DATA_INSERTATLIST'),
            args0: [
                { type: 'input_value', name: 'ITEM' },
                { type: 'input_value', name: 'INDEX' },
                { type: 'field_variable', name: 'LIST', variable: 'my list' },
            ],
        },
        {
            ...connections,
            type: OPCODE.data_replaceitemoflist,
            colour: BlocksColor.data_lists.primary,
            message0: t('blocks:DATA_REPLACEITEMOFLIST'),
            args0: [
                { type: 'input_value', name: 'INDEX' },
                { type: 'field_variable', name: 'LIST', variable: 'my list' },
                { type: 'input_value', name: 'ITEM' },
            ],
        },
        {
            type: OPCODE.data_itemoflist,
            colour: BlocksColor.data_lists.primary,
            output: 'String',
            message0: t('blocks:DATA_ITEMOFLIST'),
            args0: [
                { type: 'input_value', name: 'INDEX' },
                { type: 'field_variable', name: 'LIST', variable: 'my list' },
            ],
        },
        // todo: scratch 使用 field_numberdropdown (可编辑数字+下拉), 这里暂用 field_dropdown
        {
            type: OPCODE.data_listindexall,
            colour: BlocksColor.textField,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'INDEX',
                    options: [
                        ['1', '1'],
                        [t('blocks:DATA_INDEX_LAST'), 'last'],
                        [t('blocks:DATA_INDEX_ALL'), 'all'],
                    ],
                },
            ],
        },
        {
            type: OPCODE.data_listindexrandom,
            colour: BlocksColor.textField,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown',
                    name: 'INDEX',
                    options: [
                        ['1', '1'],
                        [t('blocks:DATA_INDEX_LAST'), 'last'],
                        [t('blocks:DATA_INDEX_RANDOM'), 'random'],
                    ],
                },
            ],
        },
        {
            type: OPCODE.data_itemnumoflist,
            colour: BlocksColor.data_lists.primary,
            output: 'Number',
            message0: t('blocks:DATA_ITEMNUMOFLIST'),
            args0: [
                { type: 'input_value', name: 'ITEM' },
                { type: 'field_variable', name: 'LIST', variable: 'my list' },
            ],
        },
        {
            type: OPCODE.data_lengthoflist,
            colour: BlocksColor.data_lists.primary,
            output: 'Number',
            message0: t('blocks:OPERATORS_LENGTH'),
            args0: [{ type: 'field_variable', name: 'LIST', variable: 'my list' }],
        },
        {
            type: OPCODE.data_listcontainsitem,
            colour: BlocksColor.data_lists.primary,
            output: 'Boolean',
            message0: t('blocks:OPERATORS_CONTAINS'),
            args0: [
                { type: 'field_variable', name: 'LIST', variable: 'my list' },
                { type: 'input_value', name: 'ITEM' },
            ],
        },
        {
            ...connections,
            type: OPCODE.data_showlist,
            colour: BlocksColor.data_lists.primary,
            message0: t('blocks:DATA_SHOWLIST'),
            args0: [{ type: 'field_variable', name: 'LIST', variable: 'my list' }],
        },
        {
            ...connections,
            type: OPCODE.data_hidelist,
            colour: BlocksColor.data_lists.primary,
            message0: t('blocks:DATA_HIDELIST'),
            args0: [{ type: 'field_variable', name: 'LIST', variable: 'my list' }],
        },
        // todo: 需要完整的 mutation 机制
        {
            ...hatConnections,
            type: OPCODE.procedures_definition,
            colour: BlocksColor.more.primary,
            message0: t('blocks:PROCEDURES_DEFINITION'),
            // todo: procedures_definition 需要一个 custom_block input_statement 来承载积木原型
        },
        {
            ...connections,
            type: OPCODE.procedures_call,
            colour: BlocksColor.more.primary,
            message0: t('blocks:PROCEDURES_CALL'),
            // todo: procedures_call 需要 mutation 机制来动态生成参数输入
        },
        {
            type: OPCODE.procedures_return,
            colour: BlocksColor.more.primary,
            output: 'String',
            message0: t('blocks:PROCEDURES_RETURN'),
            // todo: procedures_return 需要在自定义积木的 return 上下文中使用
        },
        {
            type: OPCODE.argument_reporter_string_number,
            colour: BlocksColor.more.primary,
            output: 'String',
            message0: '%1',
            args0: [{ type: 'field_label', name: 'VALUE', text: '' }],
            // todo: argument_reporter 需要从 procedures mutation 获取参数名
        },
        {
            type: OPCODE.argument_reporter_boolean,
            colour: BlocksColor.more.primary,
            output: 'Boolean',
            message0: '%1',
            args0: [{ type: 'field_label', name: 'VALUE', text: '' }],
            // todo: argument_reporter 需要从 procedures mutation 获取参数名
        },
    ]);
};
export { initBlocks, connections, hatConnections, endConnections };
