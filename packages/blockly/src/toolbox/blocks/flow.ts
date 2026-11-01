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
    BlockIcon,
    booleanInput,
    connections,
    DraggableParamBlock,
    endConnections,
    numberInput,
    RenamingParamBlock,
    statementInput,
    unknownInput,
} from '../helps';
import { OPCODES } from '../opcodes';
import { blocklyAdapter } from '../../blockly';
import { Blockly } from '../..';

import Break from './assets/break.svg';
import Continue from './assets/continue.svg';
import StopProject from './assets/stopProject.svg';
import ExitScript from './assets/exitScript.svg';

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

    blocklyAdapter.Blockly.Blocks[OPCODES.repeatTimeCount] = RenamingParamBlock(
        OPCODES.repeatTimeCount,
        t('blocks:flow.repeatTimeCount'),
        TOOLBOX_COLOR.flow,
    );

    blocklyAdapter.Blockly.Blocks[OPCODES.repeatTimeValue] = RenamingParamBlock(
        OPCODES.repeatTimeCount,
        t('blocks:flow.repeatTimeValue'),
        TOOLBOX_COLOR.flow,
    );

    blocklyAdapter.Blockly.Blocks[OPCODES.repeatTimes] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:flow.repeatTimes'),
                args0: [numberInput('TIMES'), numberInput('INDEX')],
                message1: '%1',
                args1: [statementInput('DO')],
                colour: TOOLBOX_COLOR.flow,
            });

            this.countBlock = new DraggableParamBlock(
                this,
                'INDEX',
                OPCODES.repeatTimeCount,
                'Number',
            );
            this.updateShape();
        },
        updateShape() {
            this.countBlock.updateValueBlock();
        },
        onchange(event) {
            this.countBlock.onchange(event);
        },
        loadExtraState(state: { countBlockID: string }) {
            this.getInput('INDEX')?.connection?.targetBlock()?.dispose();
            this.countBlock.loadExtraState(state.countBlockID);
        },
        saveExtraState() {
            return {
                countBlockID: this.countBlock.getInnerBlockID(),
            };
        },
    } as Blockly.Block & {
        updateShape(): void;
        countBlock: DraggableParamBlock;
    };

    blocklyAdapter.Blockly.Blocks[OPCODES.forEach] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:flow.forEach'),
                args0: [arrayInput('ARRAY'), unknownInput('ITEM'), numberInput('INDEX')],
                message1: '%1',
                args1: [statementInput('DO')],
                colour: TOOLBOX_COLOR.flow,
            });
            this.countBlock = new DraggableParamBlock(
                this,
                'INDEX',
                OPCODES.repeatTimeCount,
                'Number',
            );
            this.valueBlock = new DraggableParamBlock(this, 'ITEM', OPCODES.repeatTimeValue, null);
            this.updateShape();
        },
        updateShape() {
            this.countBlock.updateValueBlock();
            this.valueBlock.updateValueBlock();
        },
        onchange(event) {
            this.countBlock.onchange(event);
            this.valueBlock.onchange(event);
        },
        loadExtraState(state: { countBlockID: string; valueBlockID: string }) {
            this.getInput('INDEX')?.connection?.targetBlock()?.dispose();
            this.getInput('ITEM')?.connection?.targetBlock()?.dispose();
            this.countBlock.loadExtraState(state.countBlockID);
            this.valueBlock.loadExtraState(state.valueBlockID);
        },
        saveExtraState() {
            return {
                countBlockID: this.countBlock.getInnerBlockID(),
                valueBlockID: this.valueBlock.getInnerBlockID(),
            };
        },
    } as Blockly.Block & {
        updateShape(): void;
        countBlock: DraggableParamBlock;
        valueBlock: DraggableParamBlock;
    };

    blocklyAdapter.Blockly.Blocks[OPCODES.breakLoop] = {
        init() {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:flow.break'),
                colour: TOOLBOX_COLOR.flow,
            });
            this.addIcon(new BlockIcon(this, Break));
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.continueLoop] = {
        init() {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:flow.continue'),
                colour: TOOLBOX_COLOR.flow,
            });
            this.addIcon(new BlockIcon(this, Continue));
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.exitScript] = {
        init() {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:flow.exitScript'),
                colour: TOOLBOX_COLOR.flow,
            });
            this.addIcon(new BlockIcon(this, ExitScript));
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.stopProject] = {
        init() {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:flow.stopProject'),
                colour: TOOLBOX_COLOR.flow,
            });
            this.addIcon(new BlockIcon(this, StopProject));
        },
    } as Blockly.Block;
};
