/**
 * 计算（数学 / 逻辑 / 字符串）的基础积木定义。
 *
 * 只做静态基础定义：不加图标，`+()` 变异器不做，因此加减乘除、且或、连接都只有两个输入。
 *
 * @author AI
 */
import { t } from 'astratch-i18n';

import { TOOLBOX_COLOR } from '../color';
import {
    TYPES,
    booleanInput,
    dropdown,
    numberInput,
    returnConnections,
    stringInput,
} from '../helps';
import { OPCODES } from '../opcodes';
import { blocklyAdapter } from '../../blockly';
import type { Blockly } from '../..';

const ROUND_OPTIONS = [
    [t('blocks:option.round.abs'), 'abs'],
    [t('blocks:option.round.ceil'), 'ceil'],
    [t('blocks:option.round.floor'), 'floor'],
    [t('blocks:option.round.round'), 'round'],
];

const UNARY_OPTIONS = [
    [t('blocks:option.unary.sqrt'), 'sqrt'],
    [t('blocks:option.unary.cbrt'), 'cbrt'],
    [t('blocks:option.unary.sin'), 'sin'],
    [t('blocks:option.unary.cos'), 'cos'],
    [t('blocks:option.unary.tan'), 'tan'],
    [t('blocks:option.unary.asin'), 'asin'],
    [t('blocks:option.unary.acos'), 'acos'],
    [t('blocks:option.unary.atan'), 'atan'],
    [t('blocks:option.unary.ln'), 'ln'],
    [t('blocks:option.unary.log'), 'log'],
];

const CONSTANT_OPTIONS = [
    [t('blocks:option.constant.pi'), 'pi'],
    [t('blocks:option.constant.e'), 'e'],
];

const CHAR_OPTIONS = [
    [t('blocks:option.char.enter'), 'enter'],
    [t('blocks:option.char.tab'), 'tab'],
];

export const initMathBlocks = () => {
    // 数学
    blocklyAdapter.Blockly.Blocks[OPCODES.add] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:math.add'),
                args0: [numberInput('A'), numberInput('B')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.subtract] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:math.subtract'),
                args0: [numberInput('A'), numberInput('B')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.multiply] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:math.multiply'),
                args0: [numberInput('A'), numberInput('B')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.divide] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:math.divide'),
                args0: [numberInput('A'), numberInput('B')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.power] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:math.power'),
                args0: [numberInput('BASE'), numberInput('EXPONENT')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.mod] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:math.mod'),
                args0: [numberInput('DIVIDEND'), numberInput('DIVISOR')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.round] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:math.round'),
                args0: [numberInput('NUM'), dropdown('MODE', ROUND_OPTIONS)],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.unary] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:math.unary'),
                args0: [dropdown('FN', UNARY_OPTIONS), numberInput('NUM')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.constant] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:math.constant'),
                args0: [dropdown('CONSTANT', CONSTANT_OPTIONS)],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.random] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:math.random'),
                args0: [numberInput('FROM'), numberInput('TO')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    // 逻辑
    blocklyAdapter.Blockly.Blocks[OPCODES.and] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:logic.and'),
                args0: [booleanInput('A'), booleanInput('B')],
                output: TYPES.BOOLEAN,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.or] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:logic.or'),
                args0: [booleanInput('A'), booleanInput('B')],
                output: TYPES.BOOLEAN,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.not] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:logic.not'),
                args0: [booleanInput('VALUE')],
                output: TYPES.BOOLEAN,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    // 字符串
    blocklyAdapter.Blockly.Blocks[OPCODES.join] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:string.join'),
                args0: [stringInput('A'), stringInput('B')],
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.letterOf] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:string.letterOf'),
                args0: [stringInput('STRING'), numberInput('INDEX')],
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.substring] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:string.substring'),
                args0: [stringInput('STRING'), numberInput('FROM'), numberInput('TO')],
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.split] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:string.split'),
                args0: [stringInput('SEPARATOR'), stringInput('STRING')],
                output: TYPES.ARRAY,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.char] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:string.char'),
                args0: [dropdown('CHAR', CHAR_OPTIONS)],
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.contains] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:string.contains'),
                args0: [stringInput('STRING'), stringInput('SUBSTRING')],
                output: TYPES.BOOLEAN,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.stringLength] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:string.length'),
                args0: [stringInput('STRING')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.math,
            });
        },
    } as Blockly.Block;
};
