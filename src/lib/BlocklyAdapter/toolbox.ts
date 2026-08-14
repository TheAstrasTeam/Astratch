/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { BlocksColor, OPCODES } from '../../types/blocks';
import { t } from 'i18next';
import i18nReady from '../../i18n';

export const num = (v: string | number) => ({
    shadow: {
        type: OPCODES.math_number,
        fields: { NUM: v },
    },
});
// const _numPos = (v: string | number) => ({
//     shadow: {
//         type: OPCODES.math_positive_number,
//         fields: { NUM: v },
//     },
// });
export const numWhole = (v: string | number) => ({
    shadow: {
        type: OPCODES.math_whole_number,
        fields: {
            NUM: v,
        },
    },
});
// const _numInt = (v: string | number) => ({
//     shadow: {
//         type: OPCODES.math_integer,
//         fields: {
//             NUM: v,
//         },
//     },
// });
export const numAngle = (v: string | number) => ({
    shadow: {
        type: OPCODES.math_angle,
        fields: { NUM: v },
    },
});
export const txt = (v: string) => ({
    shadow: {
        type: OPCODES.text,
        fields: {
            TEXT: v,
        },
    },
});
// const _colour = (v = '#ff0000') => ({
//     shadow: {
//         type: OPCODES.colour_picker,
//         fields: {
//             COLOUR: v,
//         },
//     },
// });
export const menu = (type: string) => ({
    shadow: {
        type,
    },
});
export const bool = (value = true) => ({
    shadow: {
        type: OPCODES.OPERATOR_LOGIC_BOOLEAN,
        extraState: { value },
    },
});

export const sep = (gap = 36) => ({ kind: 'sep', gap });

const getToolbox = async (): Promise<Blockly.utils.toolbox.ToolboxInfo> => {
    await i18nReady;

    return {
        kind: 'categoryToolbox',
        contents: [
            {
                kind: 'category',
                id: 'entity',
                name: t('blocks:category.entity'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:category.transform'),
                        colour: BlocksColor.position.primary,
                        contents: [
                            {
                                kind: 'category',
                                name: t('blocks:category.position'),
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
                                name: t('blocks:category.scale'),
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
                                name: t('blocks:category.direction'),
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
                                name: t('blocks:category.layer'),
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
                        name: t('blocks:category.appearance'),
                        colour: BlocksColor.Images.primary,
                        contents: [
                            {
                                kind: 'category',
                                name: t('blocks:category.images'),
                                colour: BlocksColor.Images.secondary,
                                contents: [
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_APPEARANCE_IMAGES_SHOWIMAGE,
                                        inputs: { IMAGE_NAME: txt(t('blocks:example.imageName')) },
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
                                    sep(),
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
                                    sep(),
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_APPEARANCE_VISIBILITY_SET,
                                        inputs: { VISIBILITY: menu(OPCODES.VISIBILITY_MENU) },
                                    },
                                    {
                                        gap: 12,
                                        kind: 'block',
                                        type: OPCODES.ENTITY_APPEARANCE_VISIBILITY_GET,
                                    },
                                ],
                            },
                            {
                                kind: 'category',
                                name: t('blocks:category.effects'),
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
                        name: t('blocks:category.collision'),
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
                        name: t('blocks:category.lifecycle'),
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
                name: t('blocks:category.audio'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:category.play'),
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
                        name: t('blocks:category.effects'),
                        colour: BlocksColor.audio.secondary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_EFFECTS_SETEFFECT,
                                inputs: {
                                    NAME: txt(t('blocks:audio.play.exampleName')),
                                    EFFECT: menu(OPCODES.AUDIO_EFFECT_MENU),
                                    VALUE: num(0),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.AUDIO_EFFECTS_RESETEFFECT,
                                inputs: {
                                    NAME: txt(t('blocks:audio.play.exampleName')),
                                    EFFECT: menu(OPCODES.AUDIO_EFFECT_MENU),
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
                                inputs: { EFFECT: menu(OPCODES.AUDIO_EFFECT_MENU) },
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
                                    EFFECT: menu(OPCODES.AUDIO_EFFECT_MENU),
                                },
                            },
                        ],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'resources',
                name: t('blocks:category.resources'),
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
                name: t('blocks:category.events'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:category.broadcast'),
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
                                inputs: {
                                    CHANNEL: txt(t('blocks:example.channel')),
                                    DATA: { block: { type: OPCODES.EVENT_BROADCAST_DATA } },
                                },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:category.lifecycle'),
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
                                inputs: { DURATION: numWhole(1) },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:category.time'),
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
                                    DURATION: numWhole(1),
                                },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:category.input'),
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
                                type: OPCODES.EVENT_INPUT_ISMOUSEBUTTONPRESSED,
                                inputs: { BUTTON: menu(OPCODES.MOUSE_KEY_MENU) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_INPUT_ISKEYPRESSED,
                                inputs: { KEY: menu(OPCODES.KEY_MENU) },
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
                                    BUTTON: menu(OPCODES.MOUSE_KEY_MENU),
                                    ACTION: menu(OPCODES.KEY_ISPRESS_MENU),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.EVENT_INPUT_WHENKEYPRESSED,
                                inputs: {
                                    KEY: menu(OPCODES.KEY_MENU),
                                    ACTION: menu(OPCODES.KEY_ISPRESS_MENU),
                                },
                            },
                        ],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'control',
                name: t('blocks:category.control'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:category.flow'),
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
                                inputs: { CONDITION: bool(false) },
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
                        name: t('blocks:category.condition'),
                        colour: BlocksColor.control.secondary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_CONDITION_IF,
                                inputs: { CONDITION: bool(false) },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:category.loop'),
                        colour: BlocksColor.control.tertiary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_LOOP_WHILE,
                                inputs: { CONDITION: bool(false) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_LOOP_REPEAT,
                                inputs: {
                                    TIMES: numWhole(10),
                                    COUNT: { block: { type: OPCODES.CONTROL_LOOP_REPEAT_COUNT } },
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.CONTROL_LOOP_FOREACH,
                                inputs: {
                                    ITEM_NAME: {
                                        block: {
                                            type: OPCODES.CONTROL_LOOP_FOREACH_ITEM,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:category.match'),
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
                name: t('blocks:category.operator'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:category.math'),
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
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.OPERATOR_MATH_MIN,
                                inputs: { LEFT: num(0), RIGHT: num(0) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.OPERATOR_MATH_MAX,
                                inputs: { LEFT: num(0), RIGHT: num(0) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.OPERATOR_MATH_CLAMP,
                                inputs: { VALUE: num(0), MIN: num(0), MAX: num(100) },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:category.logic'),
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
                                type: OPCODES.OPERATOR_LOGIC_OPERATION,
                                inputs: {
                                    LEFT: bool(false),
                                    OPERATOR: menu(OPCODES.LOGIC_OPERATION_MENU),
                                    RIGHT: bool(false),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.OPERATOR_LOGIC_NOT,
                                inputs: { VALUE: bool(false) },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.OPERATOR_LOGIC_BOOLEAN,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.OPERATOR_LOGIC_TERNARY,
                                inputs: {
                                    CONDITION: bool(false),
                                    THEN: txt(t('blocks:example.value')),
                                    ELSE: txt(t('blocks:example.value')),
                                },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:category.scientific'),
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
                name: t('blocks:category.data'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:category.variable'),
                        colour: BlocksColor.data.primary,
                        custom: OPCODES.DATA_CATEGORY,
                    },
                    {
                        kind: 'category',
                        name: t('blocks:category.string'),
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
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_STRING_CONTAINS,
                                inputs: {
                                    TEXT: txt(t('blocks:example.text')),
                                    SEARCH: txt(t('blocks:example.string')),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_STRING_INDEXOF,
                                inputs: {
                                    TEXT: txt(t('blocks:example.text')),
                                    SEARCH: txt(t('blocks:example.string')),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_STRING_REPLACE,
                                inputs: {
                                    TEXT: txt(t('blocks:example.text')),
                                    SEARCH: txt(t('blocks:example.string')),
                                    REPLACEMENT: txt(t('blocks:example.value')),
                                },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:category.array'),
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
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_ARRAY_SET,
                                inputs: {
                                    INDEX: numWhole(1),
                                    VALUE: txt(t('blocks:example.item')),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_ARRAY_INSERT,
                                inputs: {
                                    INDEX: numWhole(1),
                                    VALUE: txt(t('blocks:example.item')),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_ARRAY_CONTAINS,
                                inputs: {
                                    VALUE: txt(t('blocks:example.item')),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_ARRAY_SLICE,
                                inputs: {
                                    START: numWhole(1),
                                    END: numWhole(1),
                                },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:category.object'),
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
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_OBJECT_HAS,
                                inputs: {
                                    KEY: txt(t('blocks:example.key')),
                                },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        name: t('blocks:category.type'),
                        colour: BlocksColor.data.tertiary,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_TYPE_TYPEOF,
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_TYPE_CAST,
                                inputs: {
                                    TYPE: txt(t('blocks:example.string')),
                                },
                            },
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.DATA_TYPE_NULL,
                            },
                        ],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'function',
                name: t('blocks:category.function'),
                custom: OPCODES.FUNCTION_CATEGORY,
            },
            {
                kind: 'category',
                id: 'debug',
                name: t('blocks:category.debug'),
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
