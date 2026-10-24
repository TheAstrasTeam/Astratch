/* eslint-disable @typescript-eslint/no-unsafe-enum-assignment */
import { t } from 'astratch-i18n';

import { TOOLBOX_COLOR } from '../color';
import {
    TYPES,
    arrayInput,
    connections,
    numberInput,
    objectInput,
    returnConnections,
    stringInput,
    unknownInput,
} from '../helps';
import { OPCODES } from '../opcodes';
import { blocklyAdapter } from '../../blockly';
import { Blockly } from '../..';

import currentIcon from './assets/current.svg';
import incurrentIcon from './assets/incurrent.svg';

export const initDataBlocks = () => {
    // 输入框
    blocklyAdapter.Blockly.Blocks[OPCODES.number] = {
        init() {
            this.jsonInit({
                message0: t('blocks:math.number'),
                args0: [{ type: 'field_number', name: 'NUM', value: 0, check: 'Number' }],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.textField,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.string] = {
        init() {
            this.jsonInit({
                message0: '%1',
                args0: [{ type: 'text_input', name: 'TEXT', text: '', check: 'String' }],
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.textField,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.color] = {
        init() {
            this.jsonInit({
                message0: '%1',
                args0: [{ type: 'color_input', name: 'COLOR', text: '', check: 'String' }],
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.textField,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.angle] = {
        init() {
            this.jsonInit({
                message0: '%1',
                args0: [{ type: 'angle_input', name: 'ANGLE', text: '', check: 'Number' }],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.textField,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.boolean] = {
        init() {
            this.jsonInit({
                output: TYPES.BOOLEAN,
            });
            this.isEnable = false;
            this.updateShape();
            // 因为时序问题，颜色需要过会更新
            queueMicrotask(() => {
                this.updateColor();
            });
        },
        updateShape() {
            const input = this.getInput('switchButton');
            if (input) {
                input.removeField('buttonImage', true);
                input.appendField(
                    new Blockly.FieldImage(this.isEnable ? currentIcon : incurrentIcon, 20, 20),
                    'buttonImage',
                );
            } else {
                this.appendDummyInput('switchButton').appendField(
                    new Blockly.FieldImage(this.isEnable ? currentIcon : incurrentIcon, 20, 20),
                    'buttonImage',
                );
            }
            this.updateColor();
        },
        updateColor() {
            const parent = this.getParent();
            if (this.isEnable) this.setColour(TOOLBOX_COLOR.enable);
            else if (parent) this.setColour(parent.getColour());
            else this.setColour(TOOLBOX_COLOR.unenable);
        },
        onchange(event) {
            if ((event as Blockly.Events.Click).type === Blockly.Events.CLICK) {
                if (
                    (event as Blockly.Events.Click).targetType ===
                        Blockly.Events.ClickTarget.BLOCK &&
                    (event as Blockly.Events.Click).blockId === this.id
                ) {
                    this.isEnable = !this.isEnable;
                    this.updateShape();
                    this.workspace.fireChangeListener(
                        new Blockly.Events.BlockChange(
                            this,
                            'mutation',
                            null,
                            JSON.stringify({ isEnable: !this.isEnable }),
                            JSON.stringify({ isEnable: this.isEnable }),
                        ),
                    );
                }
            } else if ((event as Blockly.Events.BlockMove).type === Blockly.Events.BLOCK_MOVE)
                this.updateColor();
        },
        saveExtraState() {
            return {
                isEnable: this.isEnable,
            };
        },
        loadExtraState(state: { isEnable: boolean }) {
            this.isEnable = state.isEnable;
            this.updateShape();
        },
    } as Blockly.Block & {
        isEnable: boolean;
        updateShape(): void;
        updateColor(): void;
    };

    blocklyAdapter.Blockly.Blocks[OPCODES.null] = {
        init() {
            this.jsonInit({
                message0: t('blocks:math.null'),
                output: TYPES.UNKNOWN,
                colour: TOOLBOX_COLOR.textField,
            });
        },
    } as Blockly.Block;

    // 对象
    blocklyAdapter.Blockly.Blocks[OPCODES.emptyObject] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:object.empty'),
                output: TYPES.OBJECT,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.objectKeys] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:object.keys'),
                args0: [objectInput('OBJECT')],
                output: TYPES.ARRAY,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.objectValues] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:object.values'),
                args0: [objectInput('OBJECT')],
                output: TYPES.ARRAY,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.objectGet] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:object.get'),
                args0: [objectInput('OBJECT'), stringInput('KEY')],
                output: TYPES.UNKNOWN,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.objectHas] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:object.has'),
                args0: [objectInput('OBJECT'), stringInput('KEY')],
                output: TYPES.BOOLEAN,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.objectSize] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:object.size'),
                args0: [objectInput('OBJECT')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.objectDelete] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:object.delete'),
                args0: [objectInput('OBJECT'), stringInput('KEY')],
                output: TYPES.OBJECT,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.objectSet] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:object.set'),
                args0: [objectInput('OBJECT'), stringInput('KEY'), unknownInput('VALUE')],
                output: TYPES.OBJECT,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    // 列表
    blocklyAdapter.Blockly.Blocks[OPCODES.emptyArray] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:array.empty'),
                output: TYPES.ARRAY,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.arrayGet] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:array.getItem'),
                args0: [arrayInput('ARRAY'), numberInput('INDEX')],
                output: TYPES.UNKNOWN,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.arrayLength] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:array.length'),
                args0: [arrayInput('ARRAY')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.arrayIndexOf] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:array.indexOf'),
                args0: [arrayInput('ARRAY'), unknownInput('VALUE')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.arrayPush] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:array.push'),
                args0: [arrayInput('ARRAY'), unknownInput('VALUE')],
                output: TYPES.ARRAY,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.arrayInsert] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:array.insert'),
                args0: [arrayInput('ARRAY'), numberInput('INDEX'), unknownInput('VALUE')],
                output: TYPES.ARRAY,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.arrayRemove] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:array.remove'),
                args0: [arrayInput('ARRAY'), numberInput('INDEX')],
                output: TYPES.ARRAY,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    // 临时数据
    blocklyAdapter.Blockly.Blocks[OPCODES.getTemp] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:temp.get'),
                args0: [stringInput('NAME')],
                output: TYPES.UNKNOWN,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.defineTemp] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:temp.define'),
                args0: [stringInput('NAME')],
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.deleteTemp] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:temp.delete'),
                args0: [stringInput('NAME')],
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.hasTemp] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:temp.has'),
                args0: [stringInput('NAME')],
                output: TYPES.BOOLEAN,
                colour: TOOLBOX_COLOR.data,
            });
        },
    } as Blockly.Block;
};
