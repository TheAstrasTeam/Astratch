/**
 * 分支的积木定义。
 *
 * “如果”用变异器增量维护“否则如果 / 否则”分支：末尾的加号图标添加分支，
 * 每个动态分支行首的叉号图标删除该分支。增删只改动对应的输入，不重建整块。
 *
 * @author AI
 */
import { t } from 'astratch-i18n';

import { TOOLBOX_COLOR } from '../color';
import {
    TYPES,
    booleanInput,
    connections,
    matchBranchConnections,
    matchBranchEndConnections,
    statementInput,
    unknownInput,
} from '../helps';
import { OPCODES } from '../opcodes';
import { blocklyAdapter } from '../../blockly';
import { Blockly } from '../..';

import addBranchIcon from './assets/addBrach.svg';
import addEndBranchIcon from './assets/addEndBrach.svg';
import removeBranchIcon from './assets/minus.svg';

export const initBranchBlocks = () => {
    /**
     * 如果积木的可变状态
     *
     * @author AI
     */

    interface BranchState {
        elseIfCount?: number;
        hasElse?: boolean;
    }

    blocklyAdapter.Blockly.Blocks[OPCODES.if] = {
        elseIfCount_: 0,
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:branch.if'),
                args0: [booleanInput('CONDITION')],
                message1: '%1',
                args1: [statementInput('DO')],
                colour: TOOLBOX_COLOR.branch,
            });
            this.updateTail_();
        },
        saveExtraState() {
            if (!this.elseIfCount_ && !this.getInput('ELSE')) return null;
            const state: BranchState = {};
            if (this.elseIfCount_) state.elseIfCount = this.elseIfCount_;
            if (this.getInput('ELSE')) state.hasElse = true;
            return state;
        },
        loadExtraState(state: BranchState) {
            const count = state.elseIfCount ?? 0;
            while (this.elseIfCount_ < count) this.addElseIf_();
            while (this.elseIfCount_ > count) this.removeElseIf_();
            if (state.hasElse && !this.getInput('ELSE')) this.addElse_();
            else if (!state.hasElse && this.getInput('ELSE')) this.removeElse_();
        },
        mutate_(action: () => void) {
            if (this.isInFlyout) return;
            const { Events } = blocklyAdapter.Blockly;
            Events.setGroup(true);
            const oldState = JSON.stringify(this.saveExtraState() ?? {});
            action();
            const newState = JSON.stringify(this.saveExtraState() ?? {});
            if (oldState !== newState)
                Events.fire(new Events.BlockChange(this, 'mutation', null, oldState, newState));
            Events.setGroup(false);
        },
        updateTail_() {
            this.removeInput('TAIL', true);
            const tailInput = this.appendDummyInput('TAIL')
                .setAlign(Blockly.inputs.Align.RIGHT)
                .appendField(
                    new Blockly.FieldImage(addBranchIcon, 20, 20, undefined, () => {
                        this.mutate_(() => {
                            this.addElseIf_();
                        });
                    }),
                );
            if (!this.getInput('ELSE'))
                tailInput.appendField(
                    new Blockly.FieldImage(
                        addEndBranchIcon,
                        20,
                        20,
                        undefined,
                        () => {
                            this.mutate_(() => {
                                this.addElse_();
                            });
                        },
                    ),
                );
        },
        addElseIf_() {
            this.elseIfCount_++;
            const index = this.elseIfCount_;
            const input = this.appendValueInput(`IF${String(index)}`)
                .setCheck(TYPES.BOOLEAN)
                .appendField(
                    new Blockly.FieldImage(
                        removeBranchIcon,
                        20,
                        20,
                        undefined,
                        () => {
                            this.mutate_(() => {
                                this.removeElseIf_(index);
                            });
                        },
                    ),
                )
                .appendField(t('blocks:branch.elseIf'));
            input.connection!.setShadowState({
                type: OPCODES.boolean,
                extraState: { isEnable: false },
            });
            this.appendStatementInput(`DO${String(index)}`);
            if (this.getInput('ELSE')) {
                this.moveInputBefore('ELSE_HEAD', null);
                this.moveInputBefore('ELSE', null);
            }
            this.moveInputBefore('TAIL', null);
        },
        removeElseIf_(index?: number) {
            // 删中间的分支：先把这一行的积木弹回工作区，再把后面的分支逐个上移，保持编号连续
            const at = index ?? this.elseIfCount_;
            const input = this.getInput(`IF${String(at)}`);
            const condition = input?.connection?.targetBlock();
            if (condition?.isShadow()) input?.connection?.setShadowState(null);
            else condition?.unplug();
            this.getInput(`DO${String(at)}`)?.connection?.targetConnection?.disconnect();
            for (let i = at; i < this.elseIfCount_; i++) {
                this.getInput(`IF${String(i + 1)}`)?.connection?.targetConnection?.reconnect(
                    this,
                    `IF${String(i)}`,
                );
                this.getInput(`DO${String(i + 1)}`)?.connection?.targetConnection?.reconnect(
                    this,
                    `DO${String(i)}`,
                );
            }
            this.removeInput(`IF${String(this.elseIfCount_)}`);
            this.removeInput(`DO${String(this.elseIfCount_)}`);
            this.elseIfCount_--;
        },
        addElse_() {
            this.appendDummyInput('ELSE_HEAD')
                .appendField(
                    new Blockly.FieldImage(
                        removeBranchIcon,
                        20,
                        20,
                        undefined,
                        () => {
                            this.mutate_(() => {
                                this.removeElse_();
                            });
                        },
                    ),
                )
                .appendField(t('blocks:branch.else'));
            this.appendStatementInput('ELSE');
            this.updateTail_();
        },
        removeElse_() {
            this.removeInput('ELSE_HEAD');
            this.removeInput('ELSE');
            this.updateTail_();
        },
    } as Blockly.Block & {
        elseIfCount_: number;
        mutate_(action: () => void): void;
        updateTail_(): void;
        addElseIf_(): void;
        removeElseIf_(index?: number): void;
        addElse_(): void;
        removeElse_(): void;
        saveExtraState(): BranchState | null;
        loadExtraState(state: BranchState): void;
    };

    blocklyAdapter.Blockly.Blocks[OPCODES.match] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:branch.match'),
                args0: [unknownInput('VALUE')],
                message1: '%1',
                args1: [statementInput('DO', 'MatchBranch')],
                colour: TOOLBOX_COLOR.branch,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.matchCase] = {
        init() {
            this.jsonInit({
                ...matchBranchConnections,
                message0: t('blocks:branch.matchCase'),
                args0: [unknownInput('VALUE')],
                message1: '%1',
                args1: [statementInput('DO')],
                colour: TOOLBOX_COLOR.branch,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.matchDefault] = {
        init() {
            this.jsonInit({
                ...matchBranchEndConnections,
                message0: t('blocks:branch.matchDefault'),
                message1: '%1',
                args1: [statementInput('DO')],
                colour: TOOLBOX_COLOR.branch,
            });
        },
    } as Blockly.Block;
};
