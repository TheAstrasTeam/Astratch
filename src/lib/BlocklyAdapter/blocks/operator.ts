/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/vm/blocks';
import { isInFlyoutInsteadOfTrashCan, returnConnections } from './helpers';

import enable from '../../../assets/blocks/enable.svg';
import unable from '../../../assets/blocks/unable.svg';

/**
 * 注册运算类积木
 * 涵盖：数学、逻辑、科学
 */
export function initOperatorBlocks(blockly: typeof Blockly) {
    // - 数学
    blockly.Blocks[OPCODES.OPERATOR_MATH_OP] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.math.op'),
                colour: BlocksColor.operator.primary,
                output: 'Number',
                args0: [
                    { type: 'input_value', name: 'LEFT', check: 'Number' },
                    { type: 'input_value', name: 'OPERATOR', check: 'String' },
                    { type: 'input_value', name: 'RIGHT', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.OPERATOR_MATH_RANDOM] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.math.random'),
                colour: BlocksColor.operator.primary,
                output: 'Number',
                args0: [
                    { type: 'input_value', name: 'FROM', check: 'Number' },
                    { type: 'input_value', name: 'TO', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.OPERATOR_MATH_MIN] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.math.min'),
                colour: BlocksColor.operator.primary,
                output: 'Number',
                args0: [
                    { type: 'input_value', name: 'LEFT', check: 'Number' },
                    { type: 'input_value', name: 'RIGHT', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.OPERATOR_MATH_MAX] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.math.max'),
                colour: BlocksColor.operator.primary,
                output: 'Number',
                args0: [
                    { type: 'input_value', name: 'LEFT', check: 'Number' },
                    { type: 'input_value', name: 'RIGHT', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.OPERATOR_MATH_CLAMP] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.math.clamp'),
                colour: BlocksColor.operator.primary,
                output: 'Number',
                args0: [
                    { type: 'input_value', name: 'VALUE', check: 'Number' },
                    { type: 'input_value', name: 'MIN', check: 'Number' },
                    { type: 'input_value', name: 'MAX', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;

    // - 逻辑
    blockly.Blocks[OPCODES.OPERATOR_LOGIC_COMPARE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.logic.compare'),
                colour: BlocksColor.operator.secondary,
                output: 'Boolean',
                args0: [
                    { type: 'input_value', name: 'LEFT' },
                    { type: 'input_value', name: 'OPERATOR', check: 'String' },
                    { type: 'input_value', name: 'RIGHT' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.OPERATOR_LOGIC_OPERATION] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.logic.operation'),
                colour: BlocksColor.operator.secondary,
                output: 'Boolean',
                args0: [
                    { type: 'input_value', name: 'LEFT', check: 'Boolean' },
                    { type: 'input_value', name: 'OPERATOR', check: 'String' },
                    { type: 'input_value', name: 'RIGHT', check: 'Boolean' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.OPERATOR_LOGIC_NOT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.logic.not'),
                colour: BlocksColor.operator.secondary,
                output: 'Boolean',
                args0: [{ type: 'input_value', name: 'VALUE', check: 'Boolean' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.OPERATOR_LOGIC_TERNARY] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.logic.ternary'),
                colour: BlocksColor.operator.secondary,
                output: null,
                args0: [
                    { type: 'input_value', name: 'CONDITION', check: 'Boolean' },
                    { type: 'input_value', name: 'THEN' },
                    { type: 'input_value', name: 'ELSE' },
                ],
            });
        },
    } as Blockly.Block;

    interface BooleanBlockState {
        value?: boolean;
    }

    interface BooleanBlock extends Blockly.Block {
        booleanValue: boolean;
        updateBooleanView(): void;
        updateBooleanIcon(): void;
        updateBooleanColour(): void;
        toggleBoolean(): void;
        saveExtraState(): BooleanBlockState;
        loadExtraState(state: BooleanBlockState): void;
        onchange(event: Blockly.Events.Abstract): void;
        getCurrentColour(): string;
        createBooleanIcon(): string;
    }

    blockly.Blocks[OPCODES.OPERATOR_LOGIC_BOOLEAN] = {
        init(this: BooleanBlock) {
            this.booleanValue = true;
            this.appendDummyInput().appendField(
                new Blockly.FieldImage(this.createBooleanIcon(), 20, 18, t('blocks:boolean.true')),
                'BOOL_ICON',
            );
            this.setInputsInline(true);
            this.setOutput(true, 'Boolean');
            this.setStyle('operator_logic_boolean');
            this.setColour(BlocksColor.operator.primary);
        },
        createBooleanIcon() {
            return this.booleanValue ? enable : unable;
        },
        getCurrentColour() {
            return this.booleanValue
                ? BlocksColor.operator.primary
                : (this.getParent()?.getColour() ?? BlocksColor.operator.tertiary);
        },
        onchange(this: BooleanBlock, event: Blockly.Events.Abstract) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            if (event.type === Blockly.Events.CLICK && !isInFlyoutInsteadOfTrashCan(this)) {
                const clickEvent = event as Blockly.Events.Click;
                if (
                    clickEvent.targetType === Blockly.Events.ClickTarget.BLOCK &&
                    clickEvent.blockId === this.id
                ) {
                    this.toggleBoolean();
                }
                return;
            }
            if (
                // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                event.type === Blockly.Events.BLOCK_MOVE &&
                (event as Blockly.Events.BlockMove).blockId === this.id
            ) {
                this.updateBooleanColour();
            }
        },
        toggleBoolean(this: BooleanBlock) {
            if (!this.isEditable()) return;

            const oldState = JSON.stringify(this.saveExtraState());
            this.booleanValue = !this.booleanValue;
            this.updateBooleanView();
            const newState = JSON.stringify(this.saveExtraState());
            Blockly.Events.fire(
                new Blockly.Events.BlockChange(this, 'mutation', null, oldState, newState),
            );
        },
        updateBooleanView(this: BooleanBlock) {
            this.updateBooleanIcon();
            this.updateBooleanColour();
        },
        updateBooleanIcon(this: BooleanBlock) {
            const icon = this.getField('BOOL_ICON') as Blockly.FieldImage | null;
            icon?.setValue(this.createBooleanIcon());
            icon?.setAlt(t(this.booleanValue ? 'blocks:boolean.true' : 'blocks:boolean.false'));
        },
        updateBooleanColour(this: BooleanBlock) {
            this.setColour(this.getCurrentColour());
        },
        saveExtraState(this: BooleanBlock) {
            return { value: this.booleanValue };
        },
        loadExtraState(this: BooleanBlock, state: BooleanBlockState) {
            this.booleanValue = state.value ?? true;
            this.updateBooleanIcon();
            this.setColour(
                this.booleanValue ? BlocksColor.operator.primary : BlocksColor.operator.tertiary,
            );

            // Blockly 在恢复 extraState 后才连接父块，延后到连接完成再继承父色。
            queueMicrotask(() => {
                if (!this.isDeadOrDying()) this.updateBooleanColour();
            });
        },
    } as BooleanBlock;

    // - 科学
    blockly.Blocks[OPCODES.OPERATOR_SCIENTIFIC_FUNC] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:operator.scientific.func'),
                colour: BlocksColor.operator.tertiary,
                output: 'Number',
                args0: [
                    { type: 'input_value', name: 'FUNCTION', check: 'String' },
                    { type: 'input_value', name: 'VALUE', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;
}
