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
                            block(OPCODES.setX, { X: num(0) }),
                            block(OPCODES.setY, { Y: num(0) }),
                            block(OPCODES.changeX, { X: num(10) }),
                            block(OPCODES.changeY, { Y: num(10) }),
                            block(OPCODES.setXY),
                            block(OPCODES.changeXY, undefined, 12),
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
                            block(OPCODES.faceTo, {
                                TARGET: shadow(OPCODES.entitiesMenu),
                            }),
                            block(OPCODES.heading, undefined, 12),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'display',
                        name: t('blocks:category.display'),
                        colour: TOOLBOX_COLOR.render,
                        contents: [
                            block(OPCODES.setSize, { SIZE: num(100) }),
                            block(OPCODES.changeSize, { SIZE: num(10) }),
                            block(OPCODES.size, undefined, 12),
                            block(OPCODES.show),
                            block(OPCODES.hide),
                            block(OPCODES.visible, undefined, 12),
                            block(OPCODES.switchCostume, { COSTUME: shadow(OPCODES.assetSelector) }),
                            block(OPCODES.costume, undefined, 12),
                            block(OPCODES.changeEffect, { VALUE: num(25) }),
                            block(OPCODES.setEffect, { VALUE: num(0) }),
                            block(OPCODES.effect, undefined, 12),
                            block(OPCODES.setBlendMode),
                            block(OPCODES.blendMode, undefined, 12),
                            block(OPCODES.setClip),
                            block(OPCODES.resetClip),
                            block(OPCODES.clip, undefined, 12),
                            block(OPCODES.changeLayer, { COUNT: num(1) }),
                            block(OPCODES.setLayer, { LAYER: num(1) }),
                            block(OPCODES.layer, undefined, 12),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'text',
                        name: t('blocks:category.text'),
                        colour: TOOLBOX_COLOR.render,
                        contents: [
                            block(OPCODES.showText, { TEXT: str('Hello') }),
                            block(OPCODES.setFont, {
                                ASSET: shadow(OPCODES.assetSelector),
                            }),
                            block(OPCODES.setTextColor, { COLOR: color('#0099ff') }),
                            block(OPCODES.setTextBorderColor, { COLOR: color('#ffffff') }),
                            block(OPCODES.setTextBorderWidth, { WIDTH: num(0) }),
                            block(OPCODES.textMetric),
                            block(OPCODES.textColor, undefined, 12),
                            block(OPCODES.stopText, undefined, 12),
                            block(OPCODES.textShowing),
                            block(OPCODES.textFont),
                            block(OPCODES.textContent, undefined, 12),
                        ],
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
                    block(OPCODES.whenAfter, { SECONDS: num(1) }, 12),
                ],
            },
            {
                kind: 'category',
                id: 'flow',
                name: t('blocks:category.flow'),
                colour: TOOLBOX_COLOR.flow,
                contents: [
                    block(OPCODES.wait, { SECONDS: num(1) }),
                    block(OPCODES.waitUntil, { CONDITION: bool(false) }, 12),
                    block(OPCODES.repeatWhile, { CONDITION: bool(false) }),
                    block(OPCODES.repeatTimes, { TIMES: num(10) }),
                    block(OPCODES.forEach, undefined, 12),
                    block(OPCODES.breakLoop),
                    block(OPCODES.continueLoop),
                    block(OPCODES.exitScript),
                    block(OPCODES.stopProject, undefined, 12),
                ],
            },
            {
                kind: 'category',
                id: 'branch',
                name: t('blocks:category.branch'),
                colour: TOOLBOX_COLOR.branch,
                contents: [
                    block(OPCODES.if, { CONDITION: bool(false) }, 12),
                    block(OPCODES.match),
                    block(OPCODES.matchCase),
                    block(OPCODES.matchDefault, undefined, 12),
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
                            block(OPCODES.keyPressed),
                            block(OPCODES.lastKey),
                            block(OPCODES.pressedKeys, undefined, 12),
                            block(OPCODES.micData, undefined, 12),
                            block(OPCODES.ask),
                            block(OPCODES.username, undefined, 12),
                            block(OPCODES.daysSince2000),
                            block(OPCODES.currentTime, undefined, 12),
                            block(OPCODES.timer, { NAME: str('') }),
                            block(OPCODES.startTimer, { NAME: str('') }),
                            block(OPCODES.resetTimer, { NAME: str('') }),
                            block(OPCODES.stopTimer, { NAME: str('') }, 12),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'detect',
                        name: t('blocks:category.detect'),
                        colour: TOOLBOX_COLOR.sensing,
                        contents: [
                            block(OPCODES.touching),
                            block(OPCODES.distanceTo, undefined, 12),
                        ],
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
                            block(OPCODES.add, { A: num(0), B: num(0) }),
                            block(OPCODES.subtract, { A: num(0), B: num(0) }),
                            block(OPCODES.multiply, { A: num(0), B: num(0) }),
                            block(OPCODES.divide, { A: num(0), B: num(0) }),
                            block(OPCODES.power, { BASE: num(0), EXPONENT: num(2) }, 12),
                            block(OPCODES.mod, { DIVIDEND: num(0), DIVISOR: num(1) }),
                            block(OPCODES.round, { NUM: num(0) }),
                            block(OPCODES.unary, { NUM: num(0) }, 12),
                            block(OPCODES.constant, undefined, 12),
                            block(OPCODES.random, { FROM: num(1), TO: num(10) }, 12),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'logic',
                        name: t('blocks:category.logic'),
                        colour: TOOLBOX_COLOR.math,
                        contents: [
                            block(OPCODES.and, { A: bool(false), B: bool(false) }),
                            block(OPCODES.or, { A: bool(false), B: bool(false) }),
                            block(OPCODES.not, { VALUE: bool(false) }, 12),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'string',
                        name: t('blocks:category.string'),
                        colour: TOOLBOX_COLOR.math,
                        contents: [
                            block(OPCODES.join, { A: str(''), B: str('') }, 12),
                            block(OPCODES.letterOf, { STRING: str('') }),
                            block(OPCODES.substring, { STRING: str('') }),
                            block(OPCODES.split, { SEPARATOR: str(''), STRING: str('') }, 12),
                            block(OPCODES.char, undefined, 12),
                            block(OPCODES.contains, { STRING: str(''), SUBSTRING: str('') }, 12),
                            block(OPCODES.stringLength, { STRING: str('') }, 12),
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
                            block(OPCODES.hasTemp, { NAME: str('') }, 12),
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
                            block(OPCODES.null, undefined, 12),
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
                            block(OPCODES.emptyObject, undefined, 12),
                            block(OPCODES.objectKeys),
                            block(OPCODES.objectValues),
                            block(OPCODES.objectGet, { KEY: str('') }),
                            block(OPCODES.objectHas, { KEY: str('') }),
                            block(OPCODES.objectSize, undefined, 12),
                            block(OPCODES.objectDelete, { KEY: str('') }),
                            block(OPCODES.objectSet, { KEY: str('') }, 12),
                        ],
                    },
                    {
                        kind: 'category',
                        id: 'array',
                        name: t('blocks:category.array'),
                        colour: TOOLBOX_COLOR.data,
                        contents: [
                            block(OPCODES.emptyArray, undefined, 12),
                            block(OPCODES.arrayGet, { INDEX: num(1) }),
                            block(OPCODES.arrayLength),
                            block(OPCODES.arrayIndexOf, undefined, 12),
                            block(OPCODES.arrayPush),
                            block(OPCODES.arrayInsert, { INDEX: num(1) }),
                            block(OPCODES.arrayRemove, { INDEX: num(1) }, 12),
                        ],
                    },
                ],
            },
            {
                kind: 'category',
                id: 'function',
                name: t('blocks:category.function'),
                colour: TOOLBOX_COLOR.function,
                contents: [
                    block(OPCODES.execute, undefined, 12),
                    block(OPCODES.executeReturn, undefined, 12),
                    block(OPCODES.inlineFunction, undefined, 12),
                ],
            },
        ],
    };
};
