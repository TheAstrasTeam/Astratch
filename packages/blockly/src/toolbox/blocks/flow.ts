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
    DraggableParamBlock,
    endConnections,
    numberInput,
    returnConnections,
    statementInput,
    unknownInput,
} from '../helps';
import { OPCODES } from '../opcodes';
import { blocklyAdapter } from '../../blockly';
import { Blockly } from '../..';

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

    blocklyAdapter.Blockly.Blocks[OPCODES.repeatTimeCount] = {
        init() {
            this.name = t('blocks:flow.repeatTimeCount');
            this.parentID = '';
            this.jsonInit({
                ...returnConnections,
                output: 'Number',
                colour: TOOLBOX_COLOR.flow,
            });
            this.updateShape();
        },
        updateShape() {
            this.removeInput('NAME', true);
            this.appendDummyInput('NAME').appendField(this.name);
        },
        loadExtraState(state: { parentID: string }) {
            this.parentID = state.parentID;
        },
        saveExtraState() {
            return {
                parentID: this.parentID,
            };
        },
    } as Blockly.Block & {
        name: string;
        parentID: string;
        updateShape(): void;
    };

    blocklyAdapter.Blockly.Blocks[OPCODES.repeatTimeValue] = {
        init() {
            this.name = t('blocks:flow.repeatTimeValue');
            this.parentID = '';
            this.jsonInit({
                ...returnConnections,
                output: null,
                colour: TOOLBOX_COLOR.flow,
            });
            this.updateShape();
        },
        updateShape() {
            this.setOutput(true, this.typeID);
            this.removeInput('NAME', true);
            this.appendDummyInput('NAME').appendField(this.name);
        },
        loadExtraState(state: { parentID: string; typeID: string }) {
            this.parentID = state.parentID;
            this.typeID = state.typeID;
        },
        saveExtraState() {
            return {
                parentID: this.parentID,
                typeID: this.typeID,
            };
        },
        onchange(event) {
            if (event.type !== 'click') return;
            const clickEvent = event as unknown as Blockly.Events.Click;
            if (clickEvent.blockId === this.id) {
                this.name = crypto.randomUUID();
                this.updateShape();
            }
        },
    } as Blockly.Block & {
        name: string;
        parentID: string;
        typeID: string;
        updateShape(): void;
    };

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
