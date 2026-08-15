/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import { connections, hatConnections, returnConnections } from './helpers';
import {
    scopedSourceBlock,
    scopedSourceHost,
    type IScopedSourceBlock,
    type IScopedSourceHost,
} from './scopedSource';

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

    blockly.Blocks[OPCODES.EVENT_BROADCAST_LISTEN] = {
        ...scopedSourceHost({
            sourceType: OPCODES.EVENT_BROADCAST_DATA,
            slots: () => [{ inputName: 'DATA', defaultName: t('blocks:event.broadcast.data') }],
        }),
        init(this: IScopedSourceHost) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.broadcast.listen'),
                colour: BlocksColor.event.secondary,
                args0: [
                    { type: 'input_value', name: 'CHANNEL' },
                    { type: 'input_value', name: 'DATA' },
                ],
            });

            this.initScopedHost();
        },
    } as IScopedSourceHost;

    // 广播数据不支持改名（名称由广播频道语义固定），故不传 openRenamePrompt。
    blockly.Blocks[OPCODES.EVENT_BROADCAST_DATA] = scopedSourceBlock({
        colour: BlocksColor.event.secondary,
        defaultLabel: () => t('blocks:event.broadcast.data'),
        hostTypes: [OPCODES.EVENT_BROADCAST_LISTEN],
    }) as IScopedSourceBlock;

    // - 生命周期
    blockly.Blocks[OPCODES.EVENT_LIFECYCLE_ONSTART] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.lifecycle.onStart'),
                colour: BlocksColor.event.primary,
                args0: [
                    {
                        type: 'field_image',
                        src: '..\\..\\assets\\start.svg',
                        width: 20,
                        height: 20,
                        alt: '*',
                        flipRtl: false,
                    },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.EVENT_LIFECYCLE_ONSTOP] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:event.lifecycle.onStop'),
                colour: BlocksColor.event.primary,
                args0: [
                    {
                        type: 'field_image',
                        src: '..\\..\\assets\\stop.svg',
                        width: 22,
                        height: 20,
                        alt: '*',
                        flipRtl: false,
                    },
                ],
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

    blockly.Blocks[OPCODES.EVENT_INPUT_GETALLKEYPRESSED] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:event_imput_getAllKeyPressed'),
                colour: BlocksColor.event.tertiary,
                output: 'Array',
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
                    { type: 'input_value', name: 'ACTION' },
                    { type: 'input_value', name: 'BUTTON' },
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
