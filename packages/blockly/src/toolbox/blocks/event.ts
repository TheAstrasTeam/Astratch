/**
 * 事件的基础积木定义。
 *
 * 只做静态基础定义：不加图标，不做 `+()` 变异器。
 *
 * @author AI
 */
import { t } from 'astratch-i18n';

import { TOOLBOX_COLOR } from '../color';
import { dropdown, hatConnections, numberInput } from '../helps';
import { KEY_OPTIONS, KEY_STATE_OPTIONS, MOUSE_BUTTON_OPTIONS } from '../options';
import { OPCODES } from '../opcodes';
import { blocklyAdapter } from '../../blockly';
import { Blockly } from '../..';

import Start from './assets/start.svg';

export const initEventBlocks = () => {
    blocklyAdapter.Blockly.Blocks[OPCODES.whenStartClicked] = {
        init() {
            this.jsonInit({
                ...hatConnections,
                colour: TOOLBOX_COLOR.event,
            });
            this.appendDummyInput('text1').appendField(t('blocks:event.whenStartClicked_1'));
            this.appendDummyInput('icon').appendField(new Blockly.FieldImage(Start, 25, 25));
            this.appendDummyInput('text2').appendField(t('blocks:event.whenStartClicked_2'));
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.whenMouse] = {
        init() {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.whenMouse'),
                args0: [
                    dropdown('BUTTON', MOUSE_BUTTON_OPTIONS),
                    dropdown('STATE', KEY_STATE_OPTIONS),
                ],
                colour: TOOLBOX_COLOR.event,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.whenKey] = {
        init() {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.whenKey'),
                args0: [dropdown('KEY', KEY_OPTIONS), dropdown('STATE', KEY_STATE_OPTIONS)],
                colour: TOOLBOX_COLOR.event,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.whenTouched] = {
        init() {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.whenTouched'),
                args0: [dropdown('STATE', KEY_STATE_OPTIONS)],
                colour: TOOLBOX_COLOR.event,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.whenAfter] = {
        init() {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.whenAfter'),
                args0: [numberInput('SECONDS')],
                colour: TOOLBOX_COLOR.event,
            });
        },
    } as Blockly.Block;
};
