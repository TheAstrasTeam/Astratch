/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import { connections, hatConnections, returnConnections } from './helpers';

/**
 * 注册事件类积木
 * 涵盖：广播、生命周期、时间、输入
 */
export function initEventBlocks(blockly: typeof Blockly) {
    // - 广播
    blockly.Blocks[OPCODES.EVENT_BROADCAST_SEND] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:event.broadcast.send'),
                colour: BlocksColor.event.primary,
                args0: [
                    { type: 'input_value', name: 'CHANNEL' },
                    { type: 'input_value', name: 'DATA' },
                ],
            });
        },
    } as Blockly.Block;

    interface ScopedSourceConnection extends Blockly.Connection {
        isScopedSourceSlot?: boolean;
        allowScopedSource?: boolean;
    }

    interface BroadcastDataBlock extends Blockly.Block {
        ownerId?: string;
        updateLabel(name: string): void;
        saveExtraState(): { ownerId?: string };
        loadExtraState(state: { ownerId?: string }): void;
    }

    interface BroadcastListenBlock extends Blockly.Block {
        isCreatingData: boolean;
        ensureDataBlock(): void;
        onchange(event: Blockly.Events.Abstract): void;
    }

    blockly.Blocks[OPCODES.EVENT_BROADCAST_LISTEN] = {
        init(this: BroadcastListenBlock) {
            this.isCreatingData = false;
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.broadcast.listen'),
                colour: BlocksColor.event.secondary,
                args0: [
                    { type: 'input_value', name: 'CHANNEL' },
                    { type: 'input_value', name: 'DATA' },
                ],
            });

            const dataConnection = this.getInput('DATA')
                ?.connection as ScopedSourceConnection | null;
            if (dataConnection) {
                dataConnection.isScopedSourceSlot = true;
                dataConnection.allowScopedSource = true;
            }
            queueMicrotask(() => {
                if (dataConnection) dataConnection.allowScopedSource = false;
                this.ensureDataBlock();
            });
        },
        onchange(this: BroadcastListenBlock, event: Blockly.Events.Abstract) {
            if (
                event.type === Blockly.Events.BLOCK_CREATE ||
                event.type === Blockly.Events.BLOCK_MOVE ||
                event.type === Blockly.Events.BLOCK_DELETE ||
                event.type === Blockly.Events.FINISHED_LOADING
            ) {
                this.ensureDataBlock();
            }
        },
        ensureDataBlock(this: BroadcastListenBlock) {
            if (this.isCreatingData || this.isInFlyout || this.isDeadOrDying()) return;

            const connection = this.getInput('DATA')?.connection as ScopedSourceConnection | null;
            if (!connection) return;

            const current = connection.targetBlock() as BroadcastDataBlock | null;
            if (current?.type === OPCODES.EVENT_BROADCAST_DATA) {
                connection.allowScopedSource = false;
                current.ownerId = this.id;
                current.updateLabel(t('blocks:event.broadcast.data'));
                return;
            }

            connection.allowScopedSource = false;
            this.isCreatingData = true;
            try {
                if (current) connection.disconnect();
                const data = this.workspace.newBlock(
                    OPCODES.EVENT_BROADCAST_DATA,
                ) as BroadcastDataBlock;
                data.ownerId = this.id;
                data.updateLabel(t('blocks:event.broadcast.data'));
                if (this.workspace.rendered) (data as unknown as Blockly.BlockSvg).initSvg();
                if (!data.outputConnection) return;
                connection.allowScopedSource = true;
                try {
                    connection.connect(data.outputConnection);
                } finally {
                    connection.allowScopedSource = false;
                }
                if (this.workspace.rendered) (data as unknown as Blockly.BlockSvg).render();
            } finally {
                this.isCreatingData = false;
            }
        },
    } as BroadcastListenBlock;

    blockly.Blocks[OPCODES.EVENT_BROADCAST_DATA] = {
        init(this: BroadcastDataBlock) {
            this.appendDummyInput().appendField(t('blocks:event.broadcast.data'), 'NAME');
            this.setOutput(true);
            this.setColour(BlocksColor.event.secondary);
        },
        updateLabel(this: BroadcastDataBlock, name: string) {
            this.getField('NAME')?.setValue(name);
        },
        saveExtraState(this: BroadcastDataBlock) {
            return { ownerId: this.ownerId };
        },
        loadExtraState(this: BroadcastDataBlock, state: { ownerId?: string }) {
            this.ownerId = state.ownerId;
        },
    } as BroadcastDataBlock;

    // - 生命周期
    blockly.Blocks[OPCODES.EVENT_LIFECYCLE_ONSTART] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.lifecycle.onStart'),
                colour: BlocksColor.event.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_LIFECYCLE_ONSTOP] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.lifecycle.onStop'),
                colour: BlocksColor.event.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_LIFECYCLE_ONRUNNINGFORMS] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.lifecycle.onRunningForMs'),
                colour: BlocksColor.event.primary,
                args0: [{ type: 'input_value', name: 'DURATION' }],
            });
        },
    } as Blockly.Block;

    // - 时间
    blockly.Blocks[OPCODES.EVENT_TIME_RUNNINGDURATION] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:event.time.runningDuration'),
                colour: BlocksColor.event.secondary,
                output: 'Number',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_TIME_CREATETIMER] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:event.time.createTimer'),
                colour: BlocksColor.event.secondary,
                args0: [{ type: 'input_value', name: 'NAME' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_TIME_RESETTIMER] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:event.time.resetTimer'),
                colour: BlocksColor.event.secondary,
                args0: [{ type: 'input_value', name: 'NAME' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_TIME_DELETETIMER] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:event.time.deleteTimer'),
                colour: BlocksColor.event.secondary,
                args0: [{ type: 'input_value', name: 'NAME' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_TIME_TIMERVALUE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:event.time.timerValue'),
                colour: BlocksColor.event.secondary,
                args0: [{ type: 'input_value', name: 'NAME' }],
                output: 'Number',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_TIME_WHENTIMEREXCEEDS] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.time.whenTimerExceeds'),
                colour: BlocksColor.event.secondary,
                args0: [
                    { type: 'input_value', name: 'NAME' },
                    { type: 'input_value', name: 'DURATION' },
                ],
            });
        },
    } as Blockly.Block;

    // - 输入
    blockly.Blocks[OPCODES.EVENT_INPUT_GETMOUSEPOSITION] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:event.input.getMousePosition'),
                colour: BlocksColor.event.tertiary,
                args0: [{ type: 'input_value', name: 'AXIS' }],
                output: 'Number',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_INPUT_ISMOUSETOUCHING] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:event.input.isMouseTouching'),
                colour: BlocksColor.event.tertiary,
                output: 'Boolean',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_INPUT_ISMOUSEBUTTONPRESSED] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:event.input.isMouseButtonPressed'),
                colour: BlocksColor.event.tertiary,
                args0: [{ type: 'input_value', name: 'BUTTON' }],
                output: 'Boolean',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_INPUT_ISKEYPRESSED] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:event.input.isKeyPressed'),
                colour: BlocksColor.event.tertiary,
                args0: [
                    {
                        type: 'input_value',
                        name: 'KEY',
                    },
                ],
                output: 'Boolean',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_INPUT_GETLASTKEYPRESSED] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:event.input.getLastKeyPressed'),
                colour: BlocksColor.event.tertiary,
                output: 'String',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_INPUT_GETLOUDNESS] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:event.input.getLoudness'),
                colour: BlocksColor.event.tertiary,
                output: 'Number',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_INPUT_GETFREQUENCYSPECTRUM] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:event.input.getFrequencySpectrum'),
                colour: BlocksColor.event.tertiary,
                args0: [{ type: 'input_value', name: 'COUNT' }],
                output: 'Array',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_INPUT_WHENMOUSEHOVER] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.input.whenMouseHover'),
                colour: BlocksColor.event.tertiary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_INPUT_WHENMOUSEMOVED] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.input.whenMouseMoved'),
                colour: BlocksColor.event.tertiary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_INPUT_WHENMOUSEBUTTON] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.input.whenMouseButton'),
                colour: BlocksColor.event.tertiary,
                args0: [
                    { type: 'input_value', name: 'BUTTON' },
                    { type: 'input_value', name: 'ACTION' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_INPUT_WHENKEYPRESSED] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.input.whenKeyPressed'),
                colour: BlocksColor.event.tertiary,
                args0: [
                    { type: 'input_value', name: 'KEY' },
                    { type: 'input_value', name: 'ACTION' },
                ],
            });
        },
    } as Blockly.Block;
}
