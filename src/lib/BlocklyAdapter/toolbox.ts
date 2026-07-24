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
                                        type: OPCODE.ENTITY_TRANSFORM_POSITION_MOVESTEP,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_TRANSFORM_POSITION_SETPOSITION,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_TRANSFORM_POSITION_ADDPOSITION,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_TRANSFORM_POSITION_GETPOSITION,
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
                                        type: OPCODE.ENTITY_TRANSFORM_SCALE_SETSCALE,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_TRANSFORM_SCALE_ADDSCALE,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_TRANSFORM_SCALE_GETSCALE,
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
                                        type: OPCODE.ENTITY_TRANSFORM_DIRECTION_SETDIRECTION,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_TRANSFORM_DIRECTION_ADDDIRECTION,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_TRANSFORM_DIRECTION_FACEDIRECTION,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_TRANSFORM_DIRECTION_GETDIRECTION,
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
                                        type: OPCODE.ENTITY_TRANSFORM_LAYER_SETLAYER,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_TRANSFORM_LAYER_MOVELAYER,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_TRANSFORM_LAYER_GETLAYER,
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
                                        type: OPCODE.ENTITY_APPEARANCE_IMAGES_SHOWIMAGE,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_APPEARANCE_IMAGES_SETSTRETCH,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_APPEARANCE_IMAGES_ADDSTRETCH,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_APPEARANCE_IMAGES_GETSTRETCH,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_APPEARANCE_IMAGES_SETGRID,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_APPEARANCE_IMAGES_SETGRIDDISTANCE,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_APPEARANCE_IMAGES_GETGRID,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_APPEARANCE_IMAGES_GETGRIDDISTANCE,
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
                                        type: OPCODE.ENTITY_APPEARANCE_EFFECTS_SETEFFECT,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_APPEARANCE_EFFECTS_ADDEFFECT,
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODE.ENTITY_APPEARANCE_EFFECTS_GETEFFECT,
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
                                type: OPCODE.ENTITY_COLLISION_ISTOUCHING,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.ENTITY_COLLISION_WHENTOUCHING,
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
                                type: OPCODE.ENTITY_LIFECYCLE_ONCREATED,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.ENTITY_LIFECYCLE_CLONE,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.ENTITY_LIFECYCLE_DELETECLONE,
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
                                type: OPCODE.AUDIO_PLAY_PLAY,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.AUDIO_PLAY_CONTROL,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.AUDIO_PLAY_SETTIME,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.AUDIO_PLAY_CONTROLALL,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.AUDIO_PLAY_GETALLIDS,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.AUDIO_PLAY_GETINFO,
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
                                type: OPCODE.AUDIO_EFFECTS_SETEFFECT,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.AUDIO_EFFECTS_ADDEFFECT,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.AUDIO_EFFECTS_RESETEFFECT,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.AUDIO_EFFECTS_RESETALLEFFECTS,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.AUDIO_EFFECTS_RESETEFFECTALL,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.AUDIO_EFFECTS_RESETALLEFFECTSALL,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.AUDIO_EFFECTS_GETEFFECT,
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
                        type: OPCODE.RESOURCES_ADDFROMURL,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODE.RESOURCES_GET,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODE.RESOURCES_EXISTS,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODE.RESOURCES_RENAME,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODE.RESOURCES_DELETE,
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
                                type: OPCODE.EVENT_BROADCAST_SEND,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_BROADCAST_LISTEN,
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
                                type: OPCODE.EVENT_LIFECYCLE_ONSTART,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_LIFECYCLE_ONSTOP,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_LIFECYCLE_ONRUNNINGFORMS,
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
                                type: OPCODE.EVENT_TIME_RUNNINGDURATION,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_TIME_CREATETIMER,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_TIME_RESETTIMER,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_TIME_DELETETIMER,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_TIME_TIMERVALUE,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_TIME_WHENTIMEREXCEEDS,
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
                                type: OPCODE.EVENT_INPUT_GETMOUSEPOSITION,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_INPUT_ISMOUSETOUCHING,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_INPUT_ISKEYPRESSED,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_INPUT_GETLASTKEYPRESSED,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_INPUT_GETLOUDNESS,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_INPUT_GETFREQUENCYSPECTRUM,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_INPUT_WHENMOUSEHOVER,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_INPUT_WHENMOUSEMOVED,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_INPUT_WHENMOUSEBUTTON,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.EVENT_INPUT_WHENKEYPRESSED,
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
                                type: OPCODE.CONTROL_FLOW_WAIT,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.CONTROL_FLOW_WAITUNTIL,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.CONTROL_FLOW_BREAK,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.CONTROL_FLOW_STOPSCRIPT,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.CONTROL_FLOW_STOPPROJECT,
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
                                type: OPCODE.CONTROL_CONDITION_IF,
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
                                type: OPCODE.CONTROL_LOOP_WHILE,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.CONTROL_LOOP_REPEAT,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.CONTROL_LOOP_FOREACH,
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
                                type: OPCODE.CONTROL_MATCH_MATCH,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.CONTROL_MATCH_CASE,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.CONTROL_MATCH_DEFAULT,
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
                                type: OPCODE.OPERATOR_MATH_OP,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.OPERATOR_MATH_RANDOM,
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
                                type: OPCODE.OPERATOR_LOGIC_COMPARE,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.OPERATOR_LOGIC_NOT,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.OPERATOR_LOGIC_BOOLEAN,
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
                                type: OPCODE.OPERATOR_SCIENTIFIC_FUNC,
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
                                type: OPCODE.DATA_VARIABLE_SET,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_VARIABLE_ADD,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_VARIABLE_COMPUTE,
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
                                type: OPCODE.DATA_STRING_JOIN,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_STRING_SPLIT,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_STRING_SUBSTRING,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_STRING_LENGTH,
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
                                type: OPCODE.DATA_ARRAY_EMPTY,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_ARRAY_PUSH,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_ARRAY_REMOVEAT,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_ARRAY_REMOVEENDS,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_ARRAY_GET,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_ARRAY_LENGTH,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_ARRAY_FILTER,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_ARRAY_INDEXOF,
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
                                type: OPCODE.DATA_OBJECT_EMPTY,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_OBJECT_SET,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_OBJECT_DELETE,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_OBJECT_GETALL,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_OBJECT_GET,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_OBJECT_LENGTH,
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
                                type: OPCODE.DATA_TYPE_TYPEOF,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODE.DATA_TYPE_CAST,
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
                        type: OPCODE.FUNCTION_DEFINITION,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODE.FUNCTION_CALL,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODE.FUNCTION_RETURN,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODE.FUNCTION_INLINE,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODE.FUNCTION_RUNBRANCH,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODE.FUNCTION_SETDATAVALUE,
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
                        type: OPCODE.DEBUG_LOG,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODE.DEBUG_CRASH,
                    },
                    {
                        gap: 12,
                        kind: 'block',
                        type: OPCODE.DEBUG_BREAKPOINT,
                    },
                ],
            },
        ],
    };
};

export default getToolbox;
