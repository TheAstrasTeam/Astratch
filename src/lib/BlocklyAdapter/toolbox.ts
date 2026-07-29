// 来自 Cyberexplorer 的积木箱配置
import * as Blockly from 'blockly/core';
import { BlocksColor, OPCODES } from '../../types/blocks';
import { t } from 'i18next';
import i18nReady from '../../i18n';

const num = (v: string | number) => ({
    shadow: {
        type: OPCODES.math_number,
        fields: { NUM: v },
    },
});
const numPos = (v: string | number) => ({
    shadow: {
        type: OPCODES.math_positive_number,
        fields: { NUM: v },
    },
});
const numWhole = (v: string | number) => ({
    shadow: {
        type: OPCODES.math_whole_number,
        fields: {
            NUM: v,
        },
    },
});
const numInt = (v: string | number) => ({
    shadow: {
        type: OPCODES.math_integer,
        fields: {
            NUM: v,
        },
    },
});
const numAngle = (v: string | number) => ({
    shadow: {
        type: OPCODES.math_angle,
        fields: { NUM: v },
    },
});
const txt = (v: string) => ({
    shadow: {
        type: OPCODES.text,
        fields: {
            TEXT: v,
        },
    },
});
const colour = (v = '#ff0000') => ({
    shadow: {
        type: OPCODES.colour_picker,
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

const sep = (gap = 36) => ({ kind: 'sep', gap });

const getToolbox = async (): Promise<Blockly.utils.toolbox.ToolboxInfo> => {
    await i18nReady;

    return {
        kind: 'categoryToolbox',
        contents: [
            {
                kind: 'category',
                id: 'entity',
                name: t('blocks:entity'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:transform'),
                        colour: BlocksColor.position.primary,
                        contents: [
                            {
                                kind: 'category',
                                name: t('blocks:position'),
                                colour: BlocksColor.position.secondary,
                                contents: [
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_TRANSFORM_POSITION_MOVESTEP,
                                        inputs: { STEPS: num(10) },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_TRANSFORM_POSITION_SETPOSITION,
                                        inputs: {
                                            POSITION: menu(OPCODES.POSITION_MENU),
                                            DO: menu(OPCODES.POSITION_ADDORSET_MENU),
                                            UNIT: num(10),
                                        },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_TRANSFORM_POSITION_GETPOSITION,
                                        inputs: {
                                            POSITION: menu(OPCODES.POSITION_MENU),
                                        },
                                    },
                                ],
                            },
                            {
                                kind: 'category',
                                name: t('blocks:scale'),
                                colour: BlocksColor.scale.primary,
                                contents: [
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_TRANSFORM_SCALE_SETSCALE,
                                        inputs: {
                                            DO: menu(OPCODES.SCALE_ADDORSET_MENU),
                                            UNIT: num(10),
                                        },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_TRANSFORM_SCALE_GETSCALE,
                                    },
                                ],
                            },
                            {
                                kind: 'category',
                                name: t('blocks:direction'),
                                colour: BlocksColor.direction.primary,
                                contents: [
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_TRANSFORM_DIRECTION_SETDIRECTION,
                                        inputs: {
                                            DO: menu(OPCODES.DIRECTION_SETWHERE_MENU),
                                            UNIT: numAngle(45),
                                        },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_TRANSFORM_DIRECTION_FACEDIRECTION,
                                        inputs: {
                                            TARGET: menu(OPCODES.DIRECTION_SETFACE_MENU),
                                        },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_TRANSFORM_DIRECTION_GETDIRECTION,
                                    },
                                ],
                            },
                            {
                                kind: 'category',
                                name: t('blocks:layer'),
                                colour: BlocksColor.layer.primary,
                                contents: [
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_TRANSFORM_LAYER_SETLAYER,
                                        inputs: {
                                            DO: menu(OPCODES.LAYER_ADDORSET_MENU),
                                            UNIT: num(1),
                                        },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_TRANSFORM_LAYER_GETLAYER,
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:appearance'),
                        colour: BlocksColor.Images.primary,
                        contents: [
                            {
                                kind: 'category',
                                name: t('blocks:images'),
                                colour: BlocksColor.Images.secondary,
                                contents: [
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_APPEARANCE_IMAGES_SHOWIMAGE,
                                        inputs: { IMAGE_NAME: txt(t('blocks:imageNameExample')) },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_APPEARANCE_IMAGES_SETSTRETCH,
                                        inputs: {
                                            POS: menu(OPCODES.IMAGES_STRETCH_MENU),
                                            SET: menu(OPCODES.IMAGES_IMAGES_ADDORSET_MENU),
                                            NUMBER: num(20),
                                        },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_APPEARANCE_IMAGES_GETSTRETCH,
                                        inputs: {
                                            POS: menu(OPCODES.IMAGES_STRETCH_MENU),
                                        },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_APPEARANCE_IMAGES_SETGRID,
                                        inputs: { POS: menu(OPCODES.IMAGES_GRID_SIZE_MENU) },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_APPEARANCE_IMAGES_SETGRIDDISTANCE,
                                        inputs: {
                                            POS: menu(OPCODES.IMAGES_STRETCH_MENU),
                                            SET: menu(OPCODES.IMAGES_IMAGES_ADDORSET_MENU),
                                            NUMBER: num(20),
                                            UNIT: menu(OPCODES.IMAGES_GRID_MENU),
                                        },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_APPEARANCE_IMAGES_GETGRID,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_APPEARANCE_IMAGES_GETGRIDDISTANCE,
                                        inputs: {
                                            UNIT: menu(OPCODES.IMAGES_GRID_MENU),
                                            POS: menu(OPCODES.IMAGES_STRETCH_MENU),
                                        },
                                    },
                                ],
                            },
                            {
                                kind: 'category',
                                name: t('blocks:effects'),
                                colour: BlocksColor.effects.primary,
                                contents: [
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_APPEARANCE_EFFECTS_SETEFFECT,
                                        inputs: {
                                            EFFECT: menu(OPCODES.EFFECTS_MENU),
                                            SET: menu(OPCODES.EFFECTS_ADDORSET_MENU),
                                            VALUE: num(25),
                                        },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_APPEARANCE_EFFECTS_GETEFFECT,
                                        inputs: {
                                            EFFECT: menu(OPCODES.EFFECTS_MENU),
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:collision'),
                        colour: BlocksColor.collision.primary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.ENTITY_COLLISION_ISTOUCHING,
                                inputs: { TARGETS: menu(OPCODES.COLLISION_MENU) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.ENTITY_COLLISION_WHENTOUCHING,
                                inputs: { TARGETS: menu(OPCODES.COLLISION_MENU) },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:lifecycle'),
                        colour: BlocksColor.lifecycle.primary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.ENTITY_LIFECYCLE_ONCREATED,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.ENTITY_LIFECYCLE_CLONE,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.ENTITY_LIFECYCLE_DELETECLONE,
                            },
                        ],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'audio',
                name: t('blocks:audio'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:play'),
                        colour: BlocksColor.audio.primary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_PLAY_PLAY,
                                inputs: {
                                    AUDIO: txt(t('blocks:audio.play.exampleAudioName')),
                                    NAME: txt(t('blocks:audio.play.exampleName')),
                                    DO: menu(OPCODES.AUDIO_THEN_MENU),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_PLAY_CONTROL,
                                inputs: {
                                    NAME: txt(t('blocks:audio.play.exampleName')),
                                    DO: menu(OPCODES.AUDIO_CONTROL_MENU),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_PLAY_SETTIME,
                                inputs: {
                                    NAME: txt(t('blocks:audio.play.exampleName')),
                                    DO: menu(OPCODES.AUDIO_ADDORSET_MENU),
                                    TIME: num(5),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_PLAY_CONTROLALL,
                                inputs: {
                                    DO: menu(OPCODES.AUDIO_CONTROL_MENU),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_PLAY_GETALLIDS,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_PLAY_GETINFO,
                                inputs: {
                                    NAME: txt(t('blocks:audio.play.exampleName')),
                                    DO: menu(OPCODES.AUDIO_GET_MENU),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_PLAY_ISINFO,
                                inputs: {
                                    NAME: txt(t('blocks:audio.play.exampleName')),
                                    DO: menu(OPCODES.AUDIO_GET_IS_MENU),
                                },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:effects'),
                        colour: BlocksColor.audio.secondary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_EFFECTS_SETEFFECT,
                                inputs: {
                                    NAME: txt(t('blocks:audio.play.exampleName')),
                                    EFFECT: txt(t('blocks:example.audioEffect')),
                                    VALUE: num(0),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_EFFECTS_RESETEFFECT,
                                inputs: {
                                    NAME: txt(t('blocks:audio.play.exampleName')),
                                    EFFECT: txt(t('blocks:example.audioEffect')),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_EFFECTS_RESETALLEFFECTS,
                                inputs: { NAME: txt(t('blocks:audio.play.exampleName')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_EFFECTS_RESETEFFECTALL,
                                inputs: { EFFECT: txt(t('blocks:example.audioEffect')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_EFFECTS_RESETALLEFFECTSALL,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_EFFECTS_GETEFFECT,
                                inputs: {
                                    NAME: txt(t('blocks:audio.play.exampleName')),
                                    EFFECT: txt(t('blocks:example.audioEffect')),
                                },
                            },
                        ],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'resources',
                name: t('blocks:resources'),
                contents: [
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.RESOURCES_ADDFROMURL,
                        inputs: { URL: txt('https://'), NAME: txt(t('blocks:example.resource')) },
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.RESOURCES_GET,
                        inputs: { NAME: txt(t('blocks:example.resource')) },
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.RESOURCES_EXISTS,
                        inputs: { NAME: txt(t('blocks:example.resource')) },
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.RESOURCES_RENAME,
                        inputs: {
                            OLD_NAME: txt(t('blocks:example.resource')),
                            NEW_NAME: txt(t('blocks:example.newResource')),
                        },
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.RESOURCES_DELETE,
                        inputs: { NAME: txt(t('blocks:example.resource')) },
                    },
                ],
            },
            {
                kind: 'category',
                id: 'events',
                name: t('blocks:events'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:broadcast'),
                        colour: BlocksColor.event.primary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_BROADCAST_SEND,
                                inputs: {
                                    CHANNEL: txt(t('blocks:example.channel')),
                                    DATA: txt(t('blocks:example.data')),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_BROADCAST_LISTEN,
                                inputs: { CHANNEL: txt(t('blocks:example.channel')) },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:lifecycle'),
                        colour: BlocksColor.event.primary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_LIFECYCLE_ONSTART,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_LIFECYCLE_ONSTOP,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_LIFECYCLE_ONRUNNINGFORMS,
                                inputs: { DURATION: numWhole(1000) },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:time'),
                        colour: BlocksColor.event.secondary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_TIME_RUNNINGDURATION,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_TIME_CREATETIMER,
                                inputs: { NAME: txt(t('blocks:example.timer')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_TIME_RESETTIMER,
                                inputs: { NAME: txt(t('blocks:example.timer')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_TIME_DELETETIMER,
                                inputs: { NAME: txt(t('blocks:example.timer')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_TIME_TIMERVALUE,
                                inputs: { NAME: txt(t('blocks:example.timer')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_TIME_WHENTIMEREXCEEDS,
                                inputs: {
                                    NAME: txt(t('blocks:example.timer')),
                                    DURATION: numWhole(1000),
                                },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:input'),
                        colour: BlocksColor.event.tertiary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_INPUT_GETMOUSEPOSITION,
                                inputs: { AXIS: txt('x') },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_INPUT_ISMOUSETOUCHING,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_INPUT_ISKEYPRESSED,
                                inputs: { KEY: txt(t('blocks:example.spaceKey')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_INPUT_GETLASTKEYPRESSED,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_INPUT_GETLOUDNESS,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_INPUT_GETFREQUENCYSPECTRUM,
                                inputs: { COUNT: numWhole(32) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_INPUT_WHENMOUSEHOVER,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_INPUT_WHENMOUSEMOVED,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_INPUT_WHENMOUSEBUTTON,
                                inputs: {
                                    BUTTON: txt(t('blocks:example.leftMouseButton')),
                                    ACTION: txt(t('blocks:example.pressed')),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_INPUT_WHENKEYPRESSED,
                                inputs: {
                                    KEY: txt(t('blocks:example.anyKey')),
                                    ACTION: txt(t('blocks:example.pressed')),
                                },
                            },
                        ],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'control',
                name: t('blocks:control'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:flow'),
                        colour: BlocksColor.control.primary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_FLOW_WAIT,
                                inputs: { DURATION: num(1) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_FLOW_WAITUNTIL,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_FLOW_BREAK,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_FLOW_STOPSCRIPT,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_FLOW_STOPPROJECT,
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:condition'),
                        colour: BlocksColor.control.secondary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_CONDITION_IF,
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:loop'),
                        colour: BlocksColor.control.tertiary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_LOOP_WHILE,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_LOOP_REPEAT,
                                inputs: { TIMES: numWhole(10) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_LOOP_FOREACH,
                                inputs: { ITEM_NAME: txt(t('blocks:example.item')) },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:match'),
                        colour: BlocksColor.control.secondary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_MATCH_MATCH,
                                inputs: { VALUE: txt(t('blocks:example.value')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_MATCH_CASE,
                                inputs: { VALUE: txt(t('blocks:example.case')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_MATCH_DEFAULT,
                            },
                        ],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'operator',
                name: t('blocks:operator'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:math'),
                        colour: BlocksColor.operator.primary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.OPERATOR_MATH_OP,
                                inputs: {
                                    LEFT: num(0),
                                    OPERATOR: menu(OPCODES.MATH_OPERATOR_MENU),
                                    RIGHT: num(0),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.OPERATOR_MATH_RANDOM,
                                inputs: { FROM: num(1), TO: num(10) },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:logic'),
                        colour: BlocksColor.operator.secondary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.OPERATOR_LOGIC_COMPARE,
                                inputs: {
                                    LEFT: txt('a'),
                                    OPERATOR: menu(OPCODES.LOGIC_COMPARE_MENU),
                                    RIGHT: txt('b'),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.OPERATOR_LOGIC_NOT,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.OPERATOR_LOGIC_BOOLEAN,
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:scientific'),
                        colour: BlocksColor.operator.tertiary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.OPERATOR_SCIENTIFIC_FUNC,
                                inputs: {
                                    FUNCTION: menu(OPCODES.SCIENTIFIC_FUNCTION_MENU),
                                    VALUE: num(0),
                                },
                            },
                        ],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'data',
                name: t('blocks:data'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:variable'),
                        colour: BlocksColor.data.primary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_VARIABLE_SET,
                                inputs: {
                                    NAME: menu(OPCODES.DATA_NAME_MENU),
                                    VALUE: txt(t('blocks:example.value')),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_VARIABLE_ADD,
                                inputs: { NAME: menu(OPCODES.DATA_NAME_MENU), VALUE: num(1) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_VARIABLE_COMPUTE,
                                inputs: {
                                    NAME: menu(OPCODES.DATA_NAME_MENU),
                                    OPERATOR: menu(OPCODES.DATA_COMPUTE_MENU),
                                    VALUE: num(1),
                                },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:string'),
                        colour: BlocksColor.data.secondary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_STRING_JOIN,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_STRING_SPLIT,
                                inputs: { TEXT: txt('a,b'), SEPARATOR: txt(',') },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_STRING_SUBSTRING,
                                inputs: {
                                    TEXT: txt(t('blocks:example.text')),
                                    START: numWhole(1),
                                    END: numWhole(1),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_STRING_LENGTH,
                                inputs: { TEXT: txt(t('blocks:example.text')) },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:array'),
                        colour: BlocksColor.data.tertiary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_ARRAY_EMPTY,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_ARRAY_PUSH,
                                inputs: { VALUE: txt(t('blocks:example.item')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_ARRAY_REMOVEAT,
                                inputs: { INDEX: numWhole(1) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_ARRAY_REMOVEENDS,
                                inputs: { START: numWhole(1), END: numWhole(1) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_ARRAY_GET,
                                inputs: { INDEX: numWhole(1) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_ARRAY_LENGTH,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_ARRAY_FILTER,
                                inputs: { FILTER: txt(t('blocks:example.condition')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_ARRAY_INDEXOF,
                                inputs: { VALUE: txt(t('blocks:example.item')) },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:object'),
                        colour: BlocksColor.data.secondary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_OBJECT_EMPTY,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_OBJECT_SET,
                                inputs: {
                                    KEY: txt(t('blocks:example.key')),
                                    VALUE: txt(t('blocks:example.value')),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_OBJECT_DELETE,
                                inputs: { KEY: txt(t('blocks:example.key')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_OBJECT_GETALL,
                                inputs: { KIND: txt(t('blocks:example.key')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_OBJECT_GET,
                                inputs: { KEY: txt(t('blocks:example.key')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_OBJECT_LENGTH,
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:type'),
                        colour: BlocksColor.data.tertiary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_TYPE_TYPEOF,
                                inputs: { VALUE: txt(t('blocks:example.value')) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_TYPE_CAST,
                                inputs: {
                                    VALUE: txt(t('blocks:example.value')),
                                    TYPE: txt(t('blocks:example.string')),
                                },
                            },
                        ],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'function',
                name: t('blocks:function'),
                contents: [
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.FUNCTION_DEFINITION,
                        inputs: { NAME: txt(t('blocks:example.function')) },
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.FUNCTION_CALL,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.FUNCTION_EXECUTE,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.FUNCTION_RETURN,
                        inputs: { VALUE: txt(t('blocks:example.value')) },
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.FUNCTION_INLINE,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.FUNCTION_RUNBRANCH,
                        inputs: { BRANCH: menu(OPCODES.FUNCTION_BRANCH_MENU) },
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.FUNCTION_SETDATAVALUE,
                        inputs: {
                            NAME: menu(OPCODES.FUNCTION_PARAMETER_MENU),
                            VALUE: txt(t('blocks:example.data')),
                        },
                    },
                ],
            },
            {
                kind: 'category',
                id: 'debug',
                name: t('blocks:debug'),
                contents: [
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.DEBUG_LOG,
                        inputs: {
                            LEVEL: txt(t('blocks:example.log')),
                            MESSAGE: txt(t('blocks:example.message')),
                        },
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.DEBUG_CRASH,
                        inputs: { MESSAGE: txt(t('blocks:example.error')) },
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODES.DEBUG_BREAKPOINT,
                    },
                ],
            },
        ],
    };
};

export default getToolbox;
