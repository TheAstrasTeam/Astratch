// 来自 Cyberexplorer 的积木箱配置
import * as Blockly from 'blockly/core';
import { BlocksColor, OPCODE } from '../../types/blocks';
import { t } from 'i18next';
import i18nReady from '../../i18n';

const num = (v: string | number) => ({
    shadow: {
        type: OPCODE.math_number,
        fields: { NUM: v },
    },
});
const numPos = (v: string | number) => ({
    shadow: {
        type: OPCODE.math_positive_number,
        fields: { NUM: v },
    },
});
const numWhole = (v: string | number) => ({
    shadow: {
        type: OPCODE.math_whole_number,
        fields: {
            NUM: v,
        },
    },
});
const numInt = (v: string | number) => ({
    shadow: {
        type: OPCODE.math_integer,
        fields: {
            NUM: v,
        },
    },
});
const numAngle = (v: string | number) => ({
    shadow: {
        type: OPCODE.math_angle,
        fields: { NUM: v },
    },
});
const txt = (v: string) => ({
    shadow: {
        type: OPCODE.text,
        fields: {
            TEXT: v,
        },
    },
});
const colour = (v = '#ff0000') => ({
    shadow: {
        type: OPCODE.colour_picker,
        fields: {
            COLOUR: v,
        },
    },
});
const menu = (type: string) => ({
    shadow: {
        type,
    },
});

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
                    { kind: 'block', type: OPCODE.motion_movesteps, inputs: { STEPS: num(10) } },
                    { kind: 'block', type: OPCODE.motion_turnright, inputs: { DEGREES: num(15) } },
                    { kind: 'block', type: OPCODE.motion_turnleft, inputs: { DEGREES: num(15) } },
                    {
                        kind: 'block',
                        type: OPCODE.motion_pointindirection,
                        inputs: { DIRECTION: numAngle(90) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.motion_pointtowards,
                        inputs: { TOWARDS: menu(OPCODE.motion_pointtowards_menu) },
                    },
                    { kind: 'block', type: OPCODE.motion_gotoxy, inputs: { X: num(0), Y: num(0) } },
                    {
                        kind: 'block',
                        type: OPCODE.motion_goto,
                        inputs: { TO: menu(OPCODE.motion_goto_menu) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.motion_glidesecstoxy,
                        inputs: { SECS: num(1), X: num(0), Y: num(0) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.motion_glideto,
                        inputs: { SECS: num(1), TO: menu(OPCODE.motion_glideto_menu) },
                    },
                    { kind: 'block', type: OPCODE.motion_changexby, inputs: { DX: num(10) } },
                    { kind: 'block', type: OPCODE.motion_setx, inputs: { X: num(0) } },
                    { kind: 'block', type: OPCODE.motion_changeyby, inputs: { DY: num(10) } },
                    { kind: 'block', type: OPCODE.motion_sety, inputs: { Y: num(0) } },
                    { kind: 'block', type: OPCODE.motion_ifonedgebounce },
                    { kind: 'block', type: OPCODE.motion_setrotationstyle },
                    { kind: 'block', type: OPCODE.motion_xposition },
                    { kind: 'block', type: OPCODE.motion_yposition },
                    { kind: 'block', type: OPCODE.motion_direction },
                ],
            },
            {
                kind: 'category',
                name: LOOKS,
                colour: BlocksColor.looks.primary,
                contents: [
                    {
                        kind: 'block',
                        type: OPCODE.looks_sayforsecs,
                        inputs: { MESSAGE: txt(t('blocks:hello')), SECS: num(2) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.looks_say,
                        inputs: { MESSAGE: txt(t('blocks:hello')) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.looks_thinkforsecs,
                        inputs: { MESSAGE: txt(t('blocks:hmm')), SECS: num(2) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.looks_think,
                        inputs: { MESSAGE: txt(t('blocks:hmm')) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.looks_switchcostumeto,
                        inputs: { COSTUME: menu(OPCODE.looks_costume) },
                    },
                    { kind: 'block', type: OPCODE.looks_nextcostume },
                    {
                        kind: 'block',
                        type: OPCODE.looks_switchbackdropto,
                        inputs: { BACKDROP: menu(OPCODE.looks_backdrops) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.looks_switchbackdroptoandwait,
                        inputs: { BACKDROP: menu(OPCODE.looks_backdrops) },
                    },
                    { kind: 'block', type: OPCODE.looks_nextbackdrop },
                    {
                        kind: 'block',
                        type: OPCODE.looks_changeeffectby,
                        inputs: { CHANGE: num(25) },
                    },
                    { kind: 'block', type: OPCODE.looks_seteffectto, inputs: { VALUE: num(0) } },
                    { kind: 'block', type: OPCODE.looks_cleargraphiceffects },
                    { kind: 'block', type: OPCODE.looks_changesizeby, inputs: { CHANGE: num(10) } },
                    { kind: 'block', type: OPCODE.looks_setsizeto, inputs: { SIZE: num(100) } },
                    { kind: 'block', type: OPCODE.looks_gotofrontback },
                    {
                        kind: 'block',
                        type: OPCODE.looks_goforwardbackwardlayers,
                        inputs: { NUM: numInt(1) },
                    },
                    { kind: 'block', type: OPCODE.looks_costumenumbername },
                    { kind: 'block', type: OPCODE.looks_backdropnumbername },
                    { kind: 'block', type: OPCODE.looks_size },
                    { kind: 'block', type: OPCODE.looks_show },
                    { kind: 'block', type: OPCODE.looks_hide },
                ],
            },
            {
                kind: 'category',
                name: SOUND,
                colour: BlocksColor.sounds.primary,
                contents: [
                    {
                        kind: 'block',
                        type: OPCODE.sound_play,
                        inputs: { SOUND_MENU: menu(OPCODE.sound_sounds_menu) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.sound_playuntildone,
                        inputs: { SOUND_MENU: menu(OPCODE.sound_sounds_menu) },
                    },
                    { kind: 'block', type: OPCODE.sound_stopallsounds },
                    {
                        kind: 'block',
                        type: OPCODE.sound_changeeffectby,
                        inputs: { VALUE: num(10) },
                    },
                    { kind: 'block', type: OPCODE.sound_seteffectto, inputs: { VALUE: num(100) } },
                    { kind: 'block', type: OPCODE.sound_cleareffects },
                    {
                        kind: 'block',
                        type: OPCODE.sound_changevolumeby,
                        inputs: { VOLUME: num(-10) },
                    },
                    { kind: 'block', type: OPCODE.sound_setvolumeto, inputs: { VOLUME: num(100) } },
                    { kind: 'block', type: OPCODE.sound_volume },
                ],
            },
            {
                kind: 'category',
                name: EVENTS,
                colour: BlocksColor.event.primary,
                contents: [
                    { kind: 'block', type: OPCODE.event_whenflagclicked },
                    { kind: 'block', type: OPCODE.event_whenkeypressed },
                    { kind: 'block', type: OPCODE.event_whenthisspriteclicked },
                    { kind: 'block', type: OPCODE.event_whenstageclicked },
                    { kind: 'block', type: OPCODE.event_whenbackdropswitchesto },
                    {
                        kind: 'block',
                        type: OPCODE.event_whengreaterthan,
                        inputs: { VALUE: num(10) },
                    },
                    { kind: 'block', type: OPCODE.event_whenbroadcastreceived },
                    {
                        kind: 'block',
                        type: OPCODE.event_broadcast,
                        inputs: { BROADCAST_INPUT: menu(OPCODE.event_broadcast_menu) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.event_broadcastandwait,
                        inputs: { BROADCAST_INPUT: menu(OPCODE.event_broadcast_menu) },
                    },
                ],
            },
            {
                kind: 'category',
                name: CONTROL,
                colour: BlocksColor.control.primary,
                contents: [
                    { kind: 'block', type: OPCODE.control_wait, inputs: { DURATION: numPos(1) } },
                    { kind: 'block', type: OPCODE.control_repeat, inputs: { TIMES: numWhole(10) } },
                    { kind: 'block', type: OPCODE.control_forever },
                    { kind: 'block', type: OPCODE.control_if },
                    { kind: 'block', type: OPCODE.control_if_else },
                    { kind: 'block', type: OPCODE.control_wait_until },
                    { kind: 'block', type: OPCODE.control_repeat_until },
                    { kind: 'block', type: OPCODE.control_stop },
                    { kind: 'block', type: OPCODE.control_start_as_clone },
                    {
                        kind: 'block',
                        type: OPCODE.control_create_clone_of,
                        inputs: { CLONE_OPTION: menu(OPCODE.control_create_clone_of_menu) },
                    },
                    { kind: 'block', type: OPCODE.control_delete_this_clone },
                ],
            },
            {
                kind: 'category',
                name: SENSING,
                colour: BlocksColor.sensing.primary,
                contents: [
                    {
                        kind: 'block',
                        type: OPCODE.sensing_touchingobject,
                        inputs: { TOUCHINGOBJECTMENU: menu(OPCODE.sensing_touchingobjectmenu) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.sensing_touchingcolor,
                        inputs: { COLOR: colour() },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.sensing_coloristouchingcolor,
                        inputs: { COLOR: colour(), COLOR2: colour() },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.sensing_distanceto,
                        inputs: { DISTANCETOMENU: menu(OPCODE.sensing_distancetomenu) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.sensing_keypressed,
                        inputs: { KEY_OPTION: menu(OPCODE.sensing_keyoptions) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.sensing_askandwait,
                        inputs: { QUESTION: txt(t('blocks:whatsyourname')) },
                    },
                    { kind: 'block', type: OPCODE.sensing_answer },
                    { kind: 'block', type: OPCODE.sensing_mousedown },
                    { kind: 'block', type: OPCODE.sensing_mousex },
                    { kind: 'block', type: OPCODE.sensing_mousey },
                    { kind: 'block', type: OPCODE.sensing_setdragmode },
                    { kind: 'block', type: OPCODE.sensing_loudness },
                    { kind: 'block', type: OPCODE.sensing_timer },
                    { kind: 'block', type: OPCODE.sensing_resettimer },
                    {
                        kind: 'block',
                        type: OPCODE.sensing_of,
                        inputs: { OBJECT: menu(OPCODE.sensing_of_object_menu) },
                    },
                    { kind: 'block', type: OPCODE.sensing_current },
                    { kind: 'block', type: OPCODE.sensing_dayssince2000 },
                    { kind: 'block', type: OPCODE.sensing_username },
                ],
            },
            {
                kind: 'category',
                name: OPERATORS,
                colour: BlocksColor.operators.primary,
                contents: [
                    {
                        kind: 'block',
                        type: OPCODE.operator_add,
                        inputs: { NUM1: num(''), NUM2: num('') },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.operator_subtract,
                        inputs: { NUM1: num(''), NUM2: num('') },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.operator_multiply,
                        inputs: { NUM1: num(''), NUM2: num('') },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.operator_divide,
                        inputs: { NUM1: num(''), NUM2: num('') },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.operator_random,
                        inputs: { FROM: num(1), TO: num(10) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.operator_lt,
                        inputs: { OPERAND1: txt(''), OPERAND2: txt('') },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.operator_equals,
                        inputs: { OPERAND1: txt(''), OPERAND2: txt('') },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.operator_gt,
                        inputs: { OPERAND1: txt(''), OPERAND2: txt('') },
                    },
                    { kind: 'block', type: OPCODE.operator_and },
                    { kind: 'block', type: OPCODE.operator_or },
                    { kind: 'block', type: OPCODE.operator_not },
                    {
                        kind: 'block',
                        type: OPCODE.operator_join,
                        inputs: {
                            STRING1: txt(t('blocks:apple_')),
                            STRING2: txt(t('blocks:banana')),
                        },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.operator_letter_of,
                        inputs: { LETTER: numWhole(1), STRING: txt(t('blocks:apple')) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.operator_length,
                        inputs: { STRING: txt(t('blocks:apple')) },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.operator_contains,
                        inputs: { STRING1: txt(t('blocks:apple')), STRING2: txt('a') },
                    },
                    {
                        kind: 'block',
                        type: OPCODE.operator_mod,
                        inputs: { NUM1: num(''), NUM2: num('') },
                    },
                    { kind: 'block', type: OPCODE.operator_round, inputs: { NUM: num('') } },
                    { kind: 'block', type: OPCODE.operator_mathop, inputs: { NUM: num('') } },
                ],
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
