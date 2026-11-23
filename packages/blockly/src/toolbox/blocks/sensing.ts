/**
 * 感知（输入 / 检测）的基础积木定义。
 *
 * 只做静态基础定义：不加图标，不做 `+()` 变异器。
 *
 * @author AI
 */
import { t } from 'astratch-i18n';

import { TOOLBOX_COLOR } from '../color';
import { TYPES, connections, dropdown, returnConnections, stringInput } from '../helps';
import { KEY_OPTIONS, KEY_STATE_OPTIONS, MOUSE_BUTTON_OPTIONS } from '../options';
import { OPCODES } from '../opcodes';
import { blocklyAdapter } from '../../blockly';
import type { Blockly } from '../..';

const DATE_PART_OPTIONS = [
    [t('blocks:option_date.year.label'), 'year'],
    [t('blocks:option_date.month.label'), 'month'],
    [t('blocks:option_date.day.label'), 'day'],
    [t('blocks:option_date.weekday.label'), 'weekday'],
    [t('blocks:option_date.hour.label'), 'hour'],
    [t('blocks:option_date.minute.label'), 'minute'],
    [t('blocks:option_date.second.label'), 'second'],
];

export const initSensingBlocks = () => {
    // 输入
    blocklyAdapter.Blockly.Blocks[OPCODES.mouseX] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.mouseX.label'),
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.mouseY] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.mouseY.label'),
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.mousePressed] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.mousePressed.label'),
                args0: [
                    dropdown('BUTTON', MOUSE_BUTTON_OPTIONS),
                    dropdown('STATE', KEY_STATE_OPTIONS),
                ],
                output: TYPES.BOOLEAN,
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.keyPressed] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.keyPressed.label'),
                args0: [dropdown('KEY', KEY_OPTIONS), dropdown('STATE', KEY_STATE_OPTIONS)],
                output: TYPES.BOOLEAN,
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.lastKey] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.lastKey.label'),
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.pressedKeys] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.pressedKeys.label'),
                output: TYPES.ARRAY,
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.micData] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.micData.label'),
                output: TYPES.ARRAY,
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.ask] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.ask.label'),
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.username] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.username.label'),
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.daysSince2000] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.daysSince2000.label'),
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.currentTime] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.currentTime.label'),
                args0: [dropdown('PART', DATE_PART_OPTIONS)],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    // 计时器
    blocklyAdapter.Blockly.Blocks[OPCODES.timer] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.timer.label'),
                args0: [stringInput('NAME')],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.startTimer] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:sensing.startTimer.label'),
                args0: [stringInput('NAME')],
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.resetTimer] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:sensing.resetTimer.label'),
                args0: [stringInput('NAME')],
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.stopTimer] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:sensing.stopTimer.label'),
                args0: [stringInput('NAME')],
                colour: TOOLBOX_COLOR.sensing,
            });
        },
    } as Blockly.Block;

    // 检测
    blocklyAdapter.Blockly.Blocks[OPCODES.touching] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.touching.label'),
                args0: [dropdown('TARGET', [['', '']])],
                output: TYPES.BOOLEAN,
                colour: TOOLBOX_COLOR.sensing,
            });

            blocklyAdapter.emit(this, 'GET_MENU', {
                type: 'entities',
                handler: (data: [string, string][]) => {
                    const field = this.getField('TARGET') as Blockly.FieldDropdown;
                    field.setOptions(data);
                },
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.distanceTo] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:sensing.distanceTo.label'),
                args0: [dropdown('TARGET', [['', '']])],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.sensing,
            });

            blocklyAdapter.emit(this, 'GET_MENU', {
                type: 'entities',
                handler: (data: [string, string][]) => {
                    const field = this.getField('TARGET') as Blockly.FieldDropdown;
                    field.setOptions(data);
                },
            });
        },
    } as Blockly.Block;
};
