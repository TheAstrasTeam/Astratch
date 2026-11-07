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
import { Blockly } from '../..';
import { MutateByLength } from '../mutateByLength';

export const initMathBlocks = () => {
    // 数学
    const _spawnMathBlocks = (symbol: string) =>
        ({
            init() {
                this.jsonInit({
                    ...returnConnections,
                    output: TYPES.NUMBER,
                    colour: TOOLBOX_COLOR.math,
                });
                this.state_number = [];
                this.mutateHandle = new MutateByLength(
                    this,
                    (input, prefix, isInit, length) => {
                        if (prefix === 'number') {
                            input.setCheck('Number');
                            const currentBlock = input.connection?.targetBlock();
                            if (currentBlock?.isShadow()) currentBlock.dispose();
                            input.connection?.setShadowState({
                                type: OPCODES.number,
                                fields: {
                                    NUM: this.state_number[length] ?? 1,
                                },
                            });
                        } else if (isInit) input.appendField(symbol);
                    },
                    'number',
                    'addTip',
                    1,
                );
                this.updateShape();
            },
            onchange(event) {
                if (!['change'].includes(event.type)) return;
                this.mutateHandle.getValueInputs().forEach((input, length) => {
                    const block = input.connection?.targetBlock();
                    if (block?.isShadow()) {
                        this.state_number[length] =
                            (block.getFieldValue('NUM') as number | null) ?? 1;
                        return;
                    }
                });
                this.updateShape();
            },
            updateShape() {
                this.mutateHandle.updateShape();
            },
            saveExtraState() {
                return {
                    ...this.mutateHandle.saveExtraState(),
                    state_number: this.state_number,
                };
            },
            loadExtraState(state: { length: number; state_number: number[] }) {
                this.mutateHandle.loadExtraState(state);
                this.state_number = state.state_number;
                this.updateShape();
            },
        }) as Blockly.Block & {
            mutateHandle: MutateByLength<'number', 'addTip'>;
            state_number: number[];
            updateShape(): void;
        };

    blocklyAdapter.Blockly.Blocks[OPCODES.add] = _spawnMathBlocks('+');

    blocklyAdapter.Blockly.Blocks[OPCODES.subtract] = _spawnMathBlocks('-');

    blocklyAdapter.Blockly.Blocks[OPCODES.multiply] = _spawnMathBlocks('*');

    blocklyAdapter.Blockly.Blocks[OPCODES.divide] = _spawnMathBlocks('/');

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
                args0: [
                    numberInput('NUM'),
                    dropdown('MODE', [
                        [t('blocks:option.round.abs'), 'abs'],
                        [t('blocks:option.round.ceil'), 'ceil'],
                        [t('blocks:option.round.floor'), 'floor'],
                        [t('blocks:option.round.round'), 'round'],
                    ]),
                ],
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
                args0: [
                    dropdown('FN', [
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
                    ]),
                    numberInput('NUM'),
                ],
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
                args0: [
                    dropdown('CONSTANT', [
                        [t('blocks:option.constant.pi'), 'pi'],
                        [t('blocks:option.constant.e'), 'e'],
                    ]),
                ],
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

    // 比较
    blocklyAdapter.Blockly.Blocks[OPCODES.compare] = {
        init() {
            this.inputsType = null;
            this.state_boolean = [];
            this.state_number = [];
            this.state_string = [];
            this.mutateHandle = new MutateByLength(
                this,
                (input, prefix, isInit, length) => {
                    if (prefix === 'input_') {
                        input.setCheck(this.inputsType);
                        const currentBlock = input.connection?.targetBlock();
                        if (currentBlock?.isShadow()) currentBlock.dispose();
                        switch (this.inputsType) {
                            case 'String':
                                input.connection?.setShadowState({
                                    type: OPCODES.string,
                                    fields: {
                                        TEXT: this.state_string[length] ?? '',
                                    },
                                });
                                break;
                            case 'Boolean':
                                input.connection?.setShadowState({
                                    type: OPCODES.boolean,
                                    extraState: {
                                        isEnable: this.state_boolean[length] ?? false,
                                    },
                                });
                                break;
                            case 'Number':
                                input.connection?.setShadowState({
                                    type: OPCODES.number,
                                    fields: {
                                        NUM: this.state_number[length] ?? 0,
                                    },
                                });
                                break;
                        }
                    } else if (isInit)
                        input.appendField(
                            new Blockly.FieldDropdown([
                                ['=', '='],
                                ['>', '>'],
                                ['≥', '>='],
                                ['<', '<'],
                                ['≤', '<='],
                                ['≠', '!='],
                            ]),
                        );
                },
                'input_',
                'input_symbol_',
            );
            this.jsonInit({
                ...returnConnections,
                output: TYPES.BOOLEAN,
                colour: TOOLBOX_COLOR.math,
            });
            this.updateShape();
        },
        updateShape() {
            this.mutateHandle.updateShape();
        },
        saveExtraState() {
            return {
                ...this.mutateHandle.saveExtraState(),
                inputsType: this.inputsType ?? 'null',
                state_string: this.state_string,
                state_number: this.state_number,
                state_boolean: this.state_boolean,
            };
        },
        loadExtraState(state: {
            length: number;
            inputsType: string;
            state_string: string[];
            state_number: number[];
            state_boolean: boolean[];
        }) {
            this.mutateHandle.loadExtraState(state);
            this.inputsType = state.inputsType === 'null' ? null : state.inputsType;
            this.state_string = state.state_string;
            this.state_number = state.state_number;
            this.state_boolean = state.state_boolean;
            this.updateShape();
        },
        onchange(event) {
            if (!['move', 'delete', 'change'].includes(event.type)) return;
            let expectedType: string | null = null;
            this.mutateHandle.getValueInputs().forEach((input, length) => {
                const block = input.connection?.targetBlock();
                if (block?.isShadow()) {
                    switch (input.connection?.getShadowState()?.type) {
                        case OPCODES.string:
                            this.state_string[length] =
                                (block.getFieldValue('TEXT') as string | null) ?? '';
                            break;
                        case OPCODES.number:
                            this.state_number[length] =
                                (block.getFieldValue('NUM') as number | null) ?? 0;
                            break;
                        case OPCODES.boolean:
                            this.state_boolean[length] =
                                (
                                    block.saveExtraState?.() as {
                                        isEnable: boolean | undefined;
                                    }
                                ).isEnable ?? false;
                            break;
                    }
                    return;
                }
                // 填入的积木类型
                const check = block?.outputConnection?.getCheck();
                if (check?.length != 1) return;
                const finalType = check[0];
                if (finalType !== expectedType && expectedType)
                    throw new Error(
                        `The type of latest input is ${expectedType}, But found ${finalType}.\nBTW, may it's a bug. Please report to The Astras Team!`,
                    );
                expectedType = finalType;
            });
            if (expectedType === this.inputsType) return;
            this.inputsType = expectedType;
            this.updateShape();
        },
    } as Blockly.Block & {
        mutateHandle: MutateByLength<'input_', 'input_symbol_'>;
        inputsType: string | null;
        updateShape(): void;
        state_string: string[];
        state_number: number[];
        state_boolean: boolean[];
    };

    // 逻辑
    const _spawnBooleanBlocks = (symbol: string) =>
        ({
            init() {
                this.jsonInit({
                    ...returnConnections,
                    output: TYPES.BOOLEAN,
                    colour: TOOLBOX_COLOR.math,
                });
                this.state_boolean = [];
                this.mutateHandle = new MutateByLength(
                    this,
                    (input, prefix, isInit, length) => {
                        if (prefix === 'value') {
                            input.setCheck('Boolean');
                            const currentBlock = input.connection?.targetBlock();
                            if (currentBlock?.isShadow()) currentBlock.dispose();
                            input.connection?.setShadowState({
                                type: OPCODES.boolean,
                                extraState: {
                                    isEnable: this.state_boolean[length] ?? false,
                                },
                            });
                        } else if (isInit) input.appendField(symbol);
                    },
                    'value',
                    'tip',
                    1,
                );
                this.updateShape();
            },
            onchange(event) {
                if (!['change'].includes(event.type)) return;
                this.mutateHandle.getValueInputs().forEach((input, length) => {
                    const block = input.connection?.targetBlock();
                    if (block?.isShadow()) {
                        this.state_boolean[length] =
                            (
                                block.saveExtraState?.() as {
                                    isEnable: boolean | undefined;
                                }
                            ).isEnable ?? false;
                        return;
                    }
                });
                this.updateShape();
            },
            updateShape() {
                this.mutateHandle.updateShape();
            },
            saveExtraState() {
                return {
                    ...this.mutateHandle.saveExtraState(),
                    state_boolean: this.state_boolean,
                };
            },
            loadExtraState(state: { length: number; state_boolean: boolean[] }) {
                this.mutateHandle.loadExtraState(state);
                this.state_boolean = state.state_boolean;
                this.updateShape();
            },
        }) as Blockly.Block & {
            mutateHandle: MutateByLength<'value', 'tip'>;
            state_boolean: boolean[];
            updateShape(): void;
        };
    blocklyAdapter.Blockly.Blocks[OPCODES.and] = _spawnBooleanBlocks(t('blocks:logic.and'));

    blocklyAdapter.Blockly.Blocks[OPCODES.or] = _spawnBooleanBlocks(t('blocks:logic.or'));

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
            this.state_string = [];
            this.mutateHandle = new MutateByLength(
                this,
                (input, prefix, _, length) => {
                    if (prefix === 'string') {
                        input.setCheck('String');
                        const currentBlock = input.connection?.targetBlock();
                        if (currentBlock?.isShadow()) currentBlock.dispose();
                        input.connection?.setShadowState({
                            type: OPCODES.string,
                            fields: {
                                TEXT: this.state_string[length] ?? '',
                            },
                        });
                    }
                },
                'string',
                'stringTip',
            );
            this.jsonInit({
                ...returnConnections,
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.math,
            });
            this.appendDummyInput('JOIN_TEXT').appendField(t('blocks:string.join'));
            this.updateShape();
        },
        onchange(event) {
            if (!['change'].includes(event.type)) return;
            this.mutateHandle.getValueInputs().forEach((input, length) => {
                const block = input.connection?.targetBlock();
                if (block?.isShadow()) {
                    this.state_string[length] =
                        (block.getFieldValue('TEXT') as string | null) ?? '';
                    return;
                }
            });
            this.updateShape();
        },
        updateShape() {
            this.mutateHandle.updateShape();
        },
        saveExtraState() {
            return {
                ...this.mutateHandle.saveExtraState(),
                state_string: this.state_string,
            };
        },
        loadExtraState(state: { length: number; state_string: string[] }) {
            this.mutateHandle.loadExtraState(state);
            this.state_string = state.state_string;
            this.updateShape();
        },
    } as Blockly.Block & {
        mutateHandle: MutateByLength<'string', 'stringTip'>;
        state_string: string[];
        updateShape(): void;
    };

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
                args0: [
                    dropdown('CHAR', [
                        [t('blocks:option.char.enter'), 'enter'],
                        [t('blocks:option.char.tab'), 'tab'],
                    ]),
                ],
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
