import { t } from 'astratch-i18n';
import { blocklyAdapter } from '../../../blockly';
import { connections } from '../../helps';
import { OPCODES } from '../opcodes';
import type * as Blockly from 'blockly/core';
import { DEFAULT_TOOLBOX_COLOR } from '../../color';

export const initBlocks = () => {
    blocklyAdapter.Blockly.Blocks[OPCODES.number] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [{ type: 'field_number', name: 'NUM', value: 0 }],
                output: 'Number',
                colour: DEFAULT_TOOLBOX_COLOR.textField,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.forward] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:forward'),
                args0: [{ type: 'input_value', name: 'STEPS', check: 'Number' }],
                colour: DEFAULT_TOOLBOX_COLOR.motion,
            });
        },
    } as Blockly.Block;
};
