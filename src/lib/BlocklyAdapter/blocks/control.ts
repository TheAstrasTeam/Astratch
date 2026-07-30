/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
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
    blockly.Blocks[OPCODES.CONTROL_CONDITION_IF] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                colour: BlocksColor.control.secondary,
                message0: t('blocks:control.condition.if'),
                message1: '%1',
                args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;

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
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:control.loop.repeat'),
                message1: '%1',
                colour: BlocksColor.control.tertiary,
                args0: [{ type: 'input_value', name: 'TIMES', check: 'Number' }],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;

    interface ForEachItemState {
        ownerId?: string;
    }

    interface ForEachState {
        itemName?: string;
    }

    interface LoopItemSourceConnection extends Blockly.Connection {
        isLoopItemSourceSlot?: boolean;
        allowLoopItemSource?: boolean;
    }

    interface ForEachItemBlock extends Blockly.Block {
        ownerId?: string;
        updateLabel(name: string): void;
        onchange(event: Blockly.Events.Abstract): void;
        saveExtraState(): ForEachItemState;
        loadExtraState(state: ForEachItemState): void;
    }

    interface ForEachBlock extends Blockly.Block {
        isCreatingItem: boolean;
        itemName: string;
        ensureItemBlock(): void;
        updateItemLabels(): void;
        renameItem(name: string): void;
        onchange(event: Blockly.Events.Abstract): void;
        saveExtraState(): ForEachState;
        loadExtraState(state: ForEachState): void;
    }
    blockly.Blocks[OPCODES.CONTROL_LOOP_FOREACH] = {
        init(this: ForEachBlock) {
            this.isCreatingItem = false;
            this.itemName = t('blocks:control.loop.item');
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

            const itemSourceConnection = this.getInput('ITEM_NAME')
                ?.connection as LoopItemSourceConnection | null;
            if (itemSourceConnection) {
                itemSourceConnection.isLoopItemSourceSlot = true;
                // 同步反序列化会紧接着恢复子积木，完成后由 ensureItemBlock 锁定。
                itemSourceConnection.allowLoopItemSource = true;
            }

            // 非工具箱途径创建积木时，也要补上可拖出的“项”。
            queueMicrotask(() => {
                if (itemSourceConnection) itemSourceConnection.allowLoopItemSource = false;
                this.ensureItemBlock();
            });
        },
        onchange(this: ForEachBlock, event: Blockly.Events.Abstract) {
            if (
                event.type === Blockly.Events.BLOCK_CREATE ||
                event.type === Blockly.Events.BLOCK_MOVE ||
                event.type === Blockly.Events.BLOCK_DELETE ||
                event.type === Blockly.Events.FINISHED_LOADING
            ) {
                this.ensureItemBlock();
            }
        },
        ensureItemBlock(this: ForEachBlock) {
            if (this.isCreatingItem || this.isInFlyout || this.isDeadOrDying()) return;

            const connection = this.getInput('ITEM_NAME')
                ?.connection as LoopItemSourceConnection | null;
            if (!connection) return;

            const current = connection.targetBlock() as ForEachItemBlock | null;
            if (current?.type === OPCODES.CONTROL_LOOP_FOREACH_ITEM) {
                connection.allowLoopItemSource = false;
                const previousOwnerId = current.ownerId;
                current.ownerId = this.id;
                current.updateLabel(this.itemName);

                // 复制整个循环时，将其中引用旧循环的“项”一并改绑到新循环。
                if (previousOwnerId && previousOwnerId !== this.id) {
                    for (const block of this.getDescendants(false)) {
                        const item = block as unknown as ForEachItemBlock;
                        if (
                            item.type === OPCODES.CONTROL_LOOP_FOREACH_ITEM &&
                            item.ownerId === previousOwnerId
                        ) {
                            item.ownerId = this.id;
                            item.updateLabel(this.itemName);
                        }
                    }
                }
                return;
            }

            connection.allowLoopItemSource = false;
            this.isCreatingItem = true;
            try {
                if (current) connection.disconnect();

                const item = this.workspace.newBlock(
                    OPCODES.CONTROL_LOOP_FOREACH_ITEM,
                ) as ForEachItemBlock;
                item.ownerId = this.id;
                item.updateLabel(this.itemName);

                if (this.workspace.rendered) (item as unknown as Blockly.BlockSvg).initSvg();
                if (!item.outputConnection) return;
                connection.allowLoopItemSource = true;
                try {
                    connection.connect(item.outputConnection);
                } finally {
                    connection.allowLoopItemSource = false;
                }
                if (this.workspace.rendered) (item as unknown as Blockly.BlockSvg).render();
            } finally {
                this.isCreatingItem = false;
            }
        },
        updateItemLabels(this: ForEachBlock) {
            for (const block of this.workspace.getAllBlocks(false)) {
                const item = block as unknown as ForEachItemBlock;
                if (item.type === OPCODES.CONTROL_LOOP_FOREACH_ITEM && item.ownerId === this.id) {
                    item.updateLabel(this.itemName);
                }
            }
        },
        renameItem(this: ForEachBlock, name: string) {
            const nextName = name.trim();
            if (!nextName || nextName === this.itemName || this.isDeadOrDying()) return;

            const oldState = JSON.stringify(this.saveExtraState());
            this.itemName = nextName;
            this.updateItemLabels();
            const newState = JSON.stringify(this.saveExtraState());
            Blockly.Events.fire(
                new Blockly.Events.BlockChange(this, 'mutation', null, oldState, newState),
            );
        },
        saveExtraState(this: ForEachBlock) {
            return { itemName: this.itemName };
        },
        loadExtraState(this: ForEachBlock, state: ForEachState) {
            this.itemName = state.itemName ?? t('blocks:control.loop.item');
            this.updateItemLabels();
        },
    } as ForEachBlock;

    blockly.Blocks[OPCODES.CONTROL_LOOP_FOREACH_ITEM] = {
        init(this: ForEachItemBlock) {
            this.appendDummyInput().appendField(t('blocks:control.loop.item'), 'NAME');
            this.setOutput(true);
            this.setColour(BlocksColor.control.tertiary);
        },
        onchange(this: ForEachItemBlock, event: Blockly.Events.Abstract) {
            if (event.type === Blockly.Events.CLICK) {
                // 检测有没有点击“项”积木
                if (
                    (event as Blockly.Events.Click).targetType !==
                        Blockly.Events.ClickTarget.BLOCK ||
                    (event as Blockly.Events.Click).blockId !== this.id
                )
                    return;

                const owner = this.ownerId
                    ? (this.workspace.getBlockById(this.ownerId) as ForEachBlock | null)
                    : null;
                if (!owner || owner.type !== OPCODES.CONTROL_LOOP_FOREACH) return;

                const message = owner.itemName;
                const callback = (result: string) => {
                    owner.renameItem(result);
                };
                void modal.open(PromptModal, {
                    message: t('blocks:rename_foreachItem_prompt', {
                        message,
                    }),
                    defaultValue: message,
                    callback,
                });
            }
        },
        updateLabel(this: ForEachItemBlock, name: string) {
            this.getField('NAME')?.setValue(name);
        },
        saveExtraState(this: ForEachItemBlock) {
            return { ownerId: this.ownerId };
        },
        loadExtraState(this: ForEachItemBlock, state: ForEachItemState) {
            this.ownerId = state.ownerId;
        },
    } as ForEachItemBlock;

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
