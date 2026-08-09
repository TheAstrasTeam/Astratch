/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import {
    connections,
    endConnections,
    matchBranchConnections,
    matchBranchEndConnections,
} from './helpers';
import { modal } from '../../../components/Modal/modal';
import { PromptModal } from '../../../components/modal_prompt';
import {
    createMinusField,
    createPlusField,
    MutationConnectionStore,
    removeMutationInputs,
} from './mutation';
import {
    scopedSourceBlock,
    scopedSourceHost,
    type IScopedSourceBlock,
    type IScopedSourceHost,
} from './scopedSource';

/**
 * 注册控制类积木
 * 涵盖：流程、条件、循环、匹配
 */
export function initControlBlocks(blockly: typeof Blockly) {
    // - 流程
    blockly.Blocks[OPCODES.CONTROL_FLOW_WAIT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.flow.wait'),
                colour: BlocksColor.control.primary,
                args0: [{ type: 'input_value', name: 'DURATION', check: 'Number' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_FLOW_WAITUNTIL] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.flow.waitUntil'),
                colour: BlocksColor.control.primary,
                args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_FLOW_BREAK] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:control.flow.break'),
                colour: BlocksColor.control.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_FLOW_STOPSCRIPT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:control.flow.stopScript'),
                colour: BlocksColor.control.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_FLOW_STOPPROJECT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:control.flow.stopProject'),
                colour: BlocksColor.control.primary,
            });
        },
    } as Blockly.Block;

    // - 条件
    interface IfBlock extends Blockly.Block {
        elseIfCount: number;
        hasElse: boolean;
        connectionStore_: MutationConnectionStore;
        plus(): void;
        minus(index?: number): void;
        updateShape(): void;
        saveConnections_(): void;
        restoreConnection_(inputName: string): void;
        saveExtraState(): { elseIfCount: number; hasElse: boolean };
        loadExtraState(state: { elseIfCount?: number; hasElse?: boolean }): void;
    }

    blockly.Blocks[OPCODES.CONTROL_CONDITION_IF] = {
        init(this: IfBlock) {
            this.jsonInit({
                ...connections,
                colour: BlocksColor.control.secondary,
                message0: t('blocks:control.condition.if'),
                message1: '%1',
                args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
            this.elseIfCount = 0;
            this.hasElse = false;
            this.connectionStore_ = new MutationConnectionStore();
            this.updateShape();
        },
        plus(this: IfBlock) {
            this.saveConnections_();
            if (this.hasElse) this.elseIfCount++;
            else this.hasElse = true;
            this.updateShape();
        },
        minus(this: IfBlock, index = this.elseIfCount - 1) {
            if (index === -1 && !this.hasElse) return;
            this.saveConnections_();
            if (index === -1) {
                if (this.elseIfCount > 0) {
                    const promoted = this.connectionStore_.get(
                        `ELSE_IF_DO_${(this.elseIfCount - 1).toString()}`,
                    );
                    this.connectionStore_.delete('ELSE_DO');
                    if (promoted) this.connectionStore_.set('ELSE_DO', promoted);
                    this.elseIfCount--;
                } else {
                    this.connectionStore_.delete('ELSE_DO');
                    this.hasElse = false;
                }
            } else if (index >= 0 && index < this.elseIfCount) {
                const elseConnection = this.connectionStore_.get('ELSE_DO');
                this.connectionStore_.removeIndex(this.elseIfCount, index, i => [
                    `ELSE_IF_CONDITION_${i.toString()}`,
                    `ELSE_IF_DO_${i.toString()}`,
                ]);
                if (elseConnection) this.connectionStore_.set('ELSE_DO', elseConnection);
                this.elseIfCount--;
            }
            this.updateShape();
        },
        saveConnections_(this: IfBlock) {
            this.connectionStore_.capture(
                this,
                this.inputList
                    .filter(input => input.name.startsWith('ELSE_IF_') || input.name === 'ELSE_DO')
                    .map(input => input.name),
            );
        },
        restoreConnection_(this: IfBlock, inputName: string) {
            this.connectionStore_.restore(this, inputName);
        },
        updateShape(this: IfBlock) {
            removeMutationInputs(
                this,
                input =>
                    input.name.startsWith('ELSE_IF_') ||
                    input.name === 'ELSE_DO' ||
                    input.name === 'ELSE_LABEL' ||
                    input.name === 'ELSE_REMOVE' ||
                    input.name === 'ADD_ELSE_IF' ||
                    input.name === 'ADD_ELSE',
            );
            if (this.isInsertionMarker()) return;

            for (let i = 0; i < this.elseIfCount; i++) {
                this.appendValueInput(`ELSE_IF_CONDITION_${i.toString()}`)
                    .setCheck('Boolean')
                    .appendField(createMinusField({ removeIndex: i }))
                    .appendField(t('blocks:control.condition.elseIf'));
                this.appendDummyInput(`ELSE_IF_CONDITION_TEXT_${i.toString()}`).appendField(
                    t('blocks:control.condition.then'),
                );

                this.appendStatementInput(`ELSE_IF_DO_${i.toString()}`).setCheck('Action');
            }

            if (this.hasElse) {
                this.appendDummyInput('ELSE_LABEL')
                    .appendField(createMinusField({ removeIndex: -1 }))
                    .appendField(t('blocks:control.condition.else'));
                this.appendStatementInput('ELSE_DO').setCheck('Action');
            }

            this.appendDummyInput('ADD_ELSE_IF')
                .setAlign(Blockly.inputs.Align.RIGHT)
                .appendField(createPlusField());

            for (let i = 0; i < this.elseIfCount; i++) {
                const conditionName = `ELSE_IF_CONDITION_${i.toString()}`;
                this.restoreConnection_(conditionName);
                const savedCondition = this.connectionStore_.get(conditionName);
                if (!savedCondition?.shadow && !savedCondition?.block) {
                    this.getInput(conditionName)?.connection?.setShadowState({
                        type: OPCODES.OPERATOR_LOGIC_BOOLEAN,
                        extraState: { value: false },
                    });
                }
                this.restoreConnection_(`ELSE_IF_CONDITION_TEXT_${i.toString()}`);
                this.restoreConnection_(`ELSE_IF_DO_${i.toString()}`);
            }
            this.restoreConnection_('ELSE_DO');
        },
        saveExtraState(this: IfBlock) {
            return { elseIfCount: this.elseIfCount, hasElse: this.hasElse };
        },
        loadExtraState(this: IfBlock, state: { elseIfCount?: number; hasElse?: boolean }) {
            this.saveConnections_();
            this.elseIfCount = Math.max(0, state.elseIfCount ?? 0);
            this.hasElse = state.hasElse ?? false;
            this.updateShape();
        },
    } as IfBlock;

    // - 循环
    blockly.Blocks[OPCODES.CONTROL_LOOP_WHILE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.loop.while'),
                message1: '%1',
                colour: BlocksColor.control.tertiary,
                args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_LOOP_REPEAT] = {
        ...scopedSourceHost({
            sourceType: OPCODES.CONTROL_LOOP_REPEAT_COUNT,
            slots: () => [{ inputName: 'COUNT', defaultName: t('blocks:control.loop.count') }],
        }),
        init(this: IScopedSourceHost) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.loop.repeat'),
                message1: '%1',
                colour: BlocksColor.control.tertiary,
                args0: [
                    { type: 'input_value', name: 'TIMES', check: 'Number' },
                    { type: 'input_value', name: 'COUNT', check: 'Number' },
                ],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });

            this.initScopedHost();
        },
    } as IScopedSourceHost;

    blockly.Blocks[OPCODES.CONTROL_LOOP_REPEAT_COUNT] = scopedSourceBlock({
        colour: BlocksColor.control.tertiary,
        output: 'Number',
        defaultLabel: () => t('blocks:control.loop.count'),
        hostTypes: [OPCODES.CONTROL_LOOP_REPEAT],
        openRenamePrompt: ({ currentName, commit }) => {
            void modal.open(PromptModal, {
                message: t('blocks:rename.repeatCount.prompt', { message: currentName }),
                defaultValue: currentName,
                callback: commit,
            });
        },
    }) as IScopedSourceBlock;

    blockly.Blocks[OPCODES.CONTROL_LOOP_FOREACH] = {
        ...scopedSourceHost({
            sourceType: OPCODES.CONTROL_LOOP_FOREACH_ITEM,
            slots: () => [{ inputName: 'ITEM_NAME', defaultName: t('blocks:control.loop.item') }],
        }),
        init(this: IScopedSourceHost) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.loop.forEach'),
                message1: '%1',
                colour: BlocksColor.control.tertiary,
                args0: [
                    { type: 'input_value', name: 'ARRAY', check: 'Array' },
                    { type: 'input_value', name: 'ITEM_NAME', check: 'String' },
                ],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });

            this.initScopedHost();
        },
    } as IScopedSourceHost;

    blockly.Blocks[OPCODES.CONTROL_LOOP_FOREACH_ITEM] = scopedSourceBlock({
        colour: BlocksColor.control.tertiary,
        defaultLabel: () => t('blocks:control.loop.item'),
        hostTypes: [OPCODES.CONTROL_LOOP_FOREACH],
        openRenamePrompt: ({ currentName, commit }) => {
            void modal.open(PromptModal, {
                message: t('blocks:rename.foreachItem.prompt', { message: currentName }),
                defaultValue: currentName,
                callback: commit,
            });
        },
    }) as IScopedSourceBlock;

    // - 匹配
    blockly.Blocks[OPCODES.CONTROL_MATCH_MATCH] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.match.match'),
                message1: '%1',
                colour: BlocksColor.control.secondary,
                args0: [{ type: 'input_value', name: 'VALUE' }],
                args1: [{ type: 'input_statement', name: 'CASES', check: 'MatchBranch' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_MATCH_CASE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...matchBranchConnections,
                message0: t('blocks:control.match.case'),
                message1: '%1',
                colour: BlocksColor.control.secondary,
                args0: [{ type: 'input_value', name: 'VALUE' }],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CONTROL_MATCH_DEFAULT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...matchBranchEndConnections,
                message0: t('blocks:control.match.default'),
                message1: '%1',
                colour: BlocksColor.control.secondary,
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;
}
