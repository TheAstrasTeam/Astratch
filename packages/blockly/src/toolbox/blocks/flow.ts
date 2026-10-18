/**
 * 流程的基础积木定义。
 *
 * 只做静态基础定义：不加图标，不做 `+()` 变异器。
 *
 * [次数]、[项]、[个数] 之后会是可拖出的积木，目前先用空槽占位。
 *
 * @author AI
 */
import { t } from 'astratch-i18n';

import { TOOLBOX_COLOR } from '../color';
import {
    arrayInput,
    booleanInput,
    connections,
    emptySlot,
    endConnections,
    numberInput,
    statementInput,
} from '../helps';
import { OPCODES } from '../opcodes';
import { blocklyAdapter } from '../../blockly';
import type { Blockly } from '../..';

export const initFlowBlocks = () => {
    blocklyAdapter.Blockly.Blocks[OPCODES.wait] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:flow.wait'),
                args0: [numberInput('SECONDS')],
                colour: TOOLBOX_COLOR.flow,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.waitUntil] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:flow.waitUntil'),
                args0: [booleanInput('CONDITION')],
                colour: TOOLBOX_COLOR.flow,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.repeatWhile] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:flow.repeatWhile'),
                args0: [booleanInput('CONDITION')],
                message1: '%1',
                args1: [statementInput('DO')],
                colour: TOOLBOX_COLOR.flow,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.repeatTimes] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:flow.repeatTimes'),
                message1: '%1',
                args1: [statementInput('DO')],
                colour: TOOLBOX_COLOR.flow,
            });
        },
    } as Blockly.Block & {
        updateShape(): void;
    };

    blocklyAdapter.Blockly.Blocks[OPCODES.forEach] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:flow.forEach'),
                args0: [arrayInput('ARRAY'), emptySlot('ITEM'), emptySlot('INDEX')],
                message1: '%1',
                args1: [statementInput('DO')],
                colour: TOOLBOX_COLOR.flow,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.breakLoop] = {
        init() {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:flow.break'),
                colour: TOOLBOX_COLOR.flow,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.continueLoop] = {
        init() {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:flow.continue'),
                colour: TOOLBOX_COLOR.flow,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.exitScript] = {
        init() {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:flow.exitScript'),
                colour: TOOLBOX_COLOR.flow,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.stopProject] = {
        init() {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:flow.stopProject'),
                colour: TOOLBOX_COLOR.flow,
            });
        },
    } as Blockly.Block;
};
