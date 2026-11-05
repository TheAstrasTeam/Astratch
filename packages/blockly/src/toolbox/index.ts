import { t } from 'astratch-i18n';
import type * as Blockly from 'blockly/core';
import { TOOLBOX_COLOR } from './color';
import { OPCODES } from './opcodes';
import { initBlocks } from './blocks';

export const num = (v: string | number) => ({
    shadow: {
        type: OPCODES.number,
        fields: { NUM: v },
    },
});

export const str = (v: string) => ({
    shadow: {
        type: OPCODES.string,
        fields: { TEXT: v },
    },
});

export const bool = (v: boolean) => ({
    shadow: {
        type: OPCODES.boolean,
        extraState: {
            isEnable: v,
        },
    },
});

export const color = (color: string) => ({
    shadow: {
        type: OPCODES.color,
        fields: { COLOR: color },
    },
});

export const angle = (angle = 90) => ({
    shadow: {
        type: OPCODES.angle,
        fields: {
            ANGLE: angle,
        },
    },
});

export const shadow = (blockType: (typeof OPCODES)[keyof typeof OPCODES]) => ({
    shadow: {
        type: blockType,
    },
});

export const sep = (gap = 36) => ({ kind: 'sep', gap });

type TBlockInputs = NonNullable<Blockly.utils.toolbox.BlockInfo['inputs']>;

/**
 * 工具箱里的一个积木。
 *
 * @param type opcode
 * @param inputs 各输入的默认影子积木
 * @param gap 与下一组积木的间距（对应文档里的 `---` 分组）
 */
const block = (type: string, inputs?: TBlockInputs, gap = 12) => ({
    kind: 'block' as const,
    type,
    gap,
    ...(inputs ? { inputs } : {}),
});

export const getToolbox = (): Blockly.utils.toolbox.ToolboxInfo => {
    initBlocks();
    return {
        kind: 'categoryToolbox',
        contents: [
            {
                kind: 'category',
                id: 'render',
                name: t('blocks:category.render'),
                colour: TOOLBOX_COLOR.render,
                contents: [
                    {
                        kind: 'category',
                        id: 'motion',
                        name: t('blocks:category.motion'),
                        colour: TOOLBOX_COLOR.motion,
                        contents: [
                            block(OPCODES.forward, { STEPS: num(10) }),
                            block(OPCODES.moveTo, {
                                TARGET: shadow(OPCODES.entitiesMenu),
                            }),
                            sep(),
                            block(OPCODES.setX, { X: num(0) }),
                            block(OPCODES.setY, { Y: num(0) }),
                            block(OPCODES.changeX, { X: num(10) }),
                            block(OPCODES.changeY, { Y: num(10) }),
                            sep(),
                            block(OPCODES.setXY),
                            block(OPCODES.changeXY, undefined),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'direction',
                        name: t('blocks:category.direction'),
                        colour: TOOLBOX_COLOR.render,
                        contents: [
                            block(OPCODES.turnLeft, { DEGREES: angle(15) }),
                            block(OPCODES.turnRight, { DEGREES: angle(15) }),
                            block(OPCODES.setHeading, { DEGREES: angle(90) }),
                            sep(),
                            block(OPCODES.faceTo, {
                                TARGET: shadow(OPCODES.entitiesMenu),
                            }),
                            block(OPCODES.heading, undefined),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'display',
                        name: t('blocks:category.display'),
                        colour: TOOLBOX_COLOR.motion_display,
                        contents: [
                            block(OPCODES.setSize, { SIZE: num(100) }),
                            block(OPCODES.changeSize, { SIZE: num(10) }),
                            block(OPCODES.size, undefined),
                            sep(),
                            block(OPCODES.show),
                            block(OPCODES.hide),
                            block(OPCODES.visible, undefined),
                            sep(),
                            block(OPCODES.switchCostume, {
                                COSTUME: shadow(OPCODES.assetSelector),
                            }),
                            block(OPCODES.costume, undefined),
                            sep(),
                            block(OPCODES.changeEffect, { VALUE: num(25) }),
                            block(OPCODES.setEffect, { VALUE: num(0) }),
                            block(OPCODES.effect, undefined),
                            sep(24),
                            block(OPCODES.setBlendMode),
                            block(OPCODES.blendMode, undefined),
                            sep(24),
                            block(OPCODES.setClip),
                            block(OPCODES.resetClip),
                            block(OPCODES.clip, undefined),
                            sep(),
                            block(OPCODES.changeLayer, { COUNT: num(1) }),
                            block(OPCODES.setLayer, { LAYER: num(1) }),
                            block(OPCODES.layer, undefined),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'text',
                        name: t('blocks:category.text'),
                        colour: TOOLBOX_COLOR.motion_display,
                        contents: [
                            block(OPCODES.showText, { TEXT: str('Hello') }),
                            block(OPCODES.setFont, {
                                ASSET: shadow(OPCODES.assetSelector),
                            }),
                            block(OPCODES.setTextColor, { COLOR: color('#0099ff') }),
                            block(OPCODES.setTextBorderColor, { COLOR: color('#ffffff') }),
                            block(OPCODES.setTextBorderWidth, { WIDTH: num(0) }),
                            block(OPCODES.stopText, undefined),
                            sep(),
                            block(OPCODES.textMetric),
                            block(OPCODES.textColor, undefined),
                            block(OPCODES.textShowing),
                            block(OPCODES.textFont),
                            block(OPCODES.textContent, undefined),
                        ],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'audio',
                name: t('blocks:category.audio'),
                colour: TOOLBOX_COLOR.audio,
                contents: [
                    block(OPCODES.playAllAudio),
                    block(OPCODES.setAllAudioEffect, {
                        VALUE: num(100),
                    }),
                    block(OPCODES.stopAllAudio),
                    sep(24),
                    block(OPCODES.getAllAudio),
                    sep(),
                    block(OPCODES.playAudio),
                    block(OPCODES.stopOrPlayAudio, {
                        AUDIO_NAME: str(''),
                    }),
                    block(OPCODES.stopAndDeleteAudio, {
                        AUDIO_NAME: str(''),
                    }),
                    block(OPCODES.setAudioEffect, {
                        AUDIO_NAME: str(''),
                        VALUE: num(100),
                    }),
                    block(OPCODES.isExistingAudio, {
                        AUDIO_NAME: str(''),
                    }),
                    block(OPCODES.isPlayingAudio, {
                        AUDIO_NAME: str(''),
                    }),
                    block(OPCODES.getAudioEffect, {
                        AUDIO_NAME: str(''),
                    }),
                ],
            },
            {
                kind: 'category',
                id: 'asset',
                name: t('blocks:category.asset'),
                colour: TOOLBOX_COLOR.asset,
                contents: [
                    {
                        kind: 'category',
                        id: 'selector',
                        name: t('blocks:category.asset.selector'),
                        colour: TOOLBOX_COLOR.asset,
                        contents: [block(OPCODES.assetSelector)],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'entity',
                name: t('blocks:category.entity'),
                colour: TOOLBOX_COLOR.entity,
                contents: [
                    {
                        kind: 'category',
                        id: 'entity_tempEntity',
                        name: t('blocks:category.entity.tempEntity'),
                        colour: TOOLBOX_COLOR.entity,
                        contents: [],
                    },
                    {
                        kind: 'category',
                        id: 'entity_data',
                        name: t('blocks:category.entity.data'),
                        colour: TOOLBOX_COLOR.entity,
                        contents: [],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'event',
                name: t('blocks:category.event'),
                colour: TOOLBOX_COLOR.event,
                contents: [
                    block(OPCODES.whenStartClicked),
                    block(OPCODES.whenMouse),
                    block(OPCODES.whenKey),
                    block(OPCODES.whenTouched),
                    block(OPCODES.whenAfter, { SECONDS: num(1) }),
                ],
            },
            {
                kind: 'category',
                id: 'flow',
                name: t('blocks:category.flow'),
                colour: TOOLBOX_COLOR.flow,
                contents: [
                    block(OPCODES.wait, { SECONDS: num(1) }),
                    block(OPCODES.waitUntil, { CONDITION: bool(false) }),
                    block(OPCODES.repeatWhile, { CONDITION: bool(false) }),
                    block(OPCODES.repeatTimes, { TIMES: num(10) }),
                    block(OPCODES.forEach, undefined),
                    sep(),
                    block(OPCODES.breakLoop),
                    block(OPCODES.continueLoop),
                    block(OPCODES.exitScript),
                    block(OPCODES.stopProject, undefined),
                ],
            },
            {
                kind: 'category',
                id: 'branch',
                name: t('blocks:category.branch'),
                colour: TOOLBOX_COLOR.branch,
                contents: [
                    block(OPCODES.if, { CONDITION: bool(false) }),
                    sep(),
                    block(OPCODES.match),
                    block(OPCODES.matchCase),
                    block(OPCODES.matchDefault, undefined),
                ],
            },
            {
                kind: 'category',
                id: 'sensing',
                name: t('blocks:category.sensing'),
                colour: TOOLBOX_COLOR.sensing,
                contents: [
                    {
                        kind: 'category',
                        id: 'sensingInput',
                        name: t('blocks:category.sensingInput'),
                        colour: TOOLBOX_COLOR.sensing,
                        contents: [
                            block(OPCODES.mouseX),
                            block(OPCODES.mouseY),
                            block(OPCODES.mousePressed),
                            sep(24),
                            block(OPCODES.keyPressed),
                            block(OPCODES.lastKey),
                            block(OPCODES.pressedKeys, undefined),
                            sep(),
                            block(OPCODES.micData, undefined),
                            block(OPCODES.ask),
                            sep(),
                            block(OPCODES.username, undefined),
                            block(OPCODES.daysSince2000),
                            block(OPCODES.currentTime, undefined),
                            sep(),
                            block(OPCODES.timer, { NAME: str('') }),
                            block(OPCODES.startTimer, { NAME: str('') }),
                            block(OPCODES.resetTimer, { NAME: str('') }),
                            block(OPCODES.stopTimer, { NAME: str('') }),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'detect',
                        name: t('blocks:category.detect'),
                        colour: TOOLBOX_COLOR.sensing,
                        contents: [block(OPCODES.touching), block(OPCODES.distanceTo, undefined)],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'calc',
                name: t('blocks:category.calc'),
                colour: TOOLBOX_COLOR.math,
                contents: [
                    {
                        kind: 'category',
                        id: 'math',
                        name: t('blocks:category.math'),
                        colour: TOOLBOX_COLOR.math,
                        contents: [
                            block(OPCODES.add),
                            block(OPCODES.subtract),
                            block(OPCODES.multiply),
                            block(OPCODES.divide),
                            block(OPCODES.power, { BASE: num(0), EXPONENT: num(2) }),
                            block(OPCODES.mod, { DIVIDEND: num(0), DIVISOR: num(1) }),
                            sep(),
                            block(OPCODES.round, { NUM: num(0) }),
                            block(OPCODES.unary, { NUM: num(0) }),
                            block(OPCODES.constant, undefined),
                            block(OPCODES.random, { FROM: num(1), TO: num(10) }),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'compare',
                        name: t('blocks:category.compare'),
                        colour: TOOLBOX_COLOR.math,
                        contents: [block(OPCODES.compare)],
                    },
                    {
                        kind: 'category',
                        id: 'logic',
                        name: t('blocks:category.logic'),
                        colour: TOOLBOX_COLOR.math,
                        contents: [
                            block(OPCODES.and),
                            block(OPCODES.or),
                            block(OPCODES.not, { VALUE: bool(false) }),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'string',
                        name: t('blocks:category.string'),
                        colour: TOOLBOX_COLOR.math,
                        contents: [
                            block(OPCODES.join, { A: str(''), B: str('') }),
                            block(OPCODES.letterOf, { STRING: str('') }),
                            block(OPCODES.substring, { STRING: str('') }),
                            block(OPCODES.split, { SEPARATOR: str(''), STRING: str('') }),
                            block(OPCODES.char, undefined),
                            block(OPCODES.contains, { STRING: str(''), SUBSTRING: str('') }),
                            block(OPCODES.stringLength, { STRING: str('') }),
                        ],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'data',
                name: t('blocks:category.data'),
                colour: TOOLBOX_COLOR.data,
                contents: [
                    {
                        kind: 'category',
                        id: 'temp',
                        name: t('blocks:category.temp'),
                        colour: TOOLBOX_COLOR.data,
                        contents: [
                            block(OPCODES.getTemp, { NAME: str('') }),
                            block(OPCODES.defineTemp, { NAME: str('') }),
                            block(OPCODES.deleteTemp, { NAME: str('') }),
                            block(OPCODES.hasTemp, { NAME: str('') }),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'inputBox',
                        name: t('blocks:category.inputBox'),
                        colour: TOOLBOX_COLOR.data,
                        contents: [
                            block(OPCODES.string),
                            block(OPCODES.number),
                            block(OPCODES.boolean),
                            block(OPCODES.null, undefined),
                            {
                                kind: 'block',
                                type: OPCODES.color,
                                fields: {
                                    COLOR: '#0099ff',
                                },
                            },
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'object',
                        name: t('blocks:category.object'),
                        colour: TOOLBOX_COLOR.data,
                        contents: [
                            block(OPCODES.emptyObject, undefined),
                            block(OPCODES.objectGet, { KEY: str('') }),
                            block(OPCODES.objectKeys),
                            block(OPCODES.objectValues),
                            block(OPCODES.objectHas, { KEY: str('') }),
                            block(OPCODES.objectSize, undefined),
                            block(OPCODES.objectDelete, { KEY: str('') }),
                            block(OPCODES.objectSet, { KEY: str('') }),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'array',
                        name: t('blocks:category.array'),
                        colour: TOOLBOX_COLOR.data,
                        contents: [
                            block(OPCODES.emptyArray, undefined),
                            block(OPCODES.arrayGet, { INDEX: num(1) }),
                            block(OPCODES.arrayLength),
                            block(OPCODES.arrayIndexOf, undefined),
                            block(OPCODES.arrayPush),
                            block(OPCODES.arrayInsert, { INDEX: num(1) }),
                            block(OPCODES.arrayRemove, { INDEX: num(1) }),
                        ],
                    },
                ],
            },
            // TODO: 函数是后期内容
            // {
            //     kind: 'category',
            //     id: 'function',
            //     name: t('blocks:category.function'),
            //     colour: TOOLBOX_COLOR.function,
            //     contents: [
            //         block(OPCODES.execute, undefined),
            //         block(OPCODES.executeReturn, undefined),
            //         block(OPCODES.inlineFunction, undefined),
            //     ],
            // },
        ],
    };
};
