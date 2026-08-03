/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import { connections, returnConnections } from './helpers';

/**
 * 注册音频类积木
 * 涵盖：播放、特效
 */
export function initAudioBlocks(blockly: typeof Blockly) {
    // - 播放
    blockly.Blocks[OPCODES.AUDIO_PLAY_PLAY] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.play.play'),
                colour: BlocksColor.audio.primary,
                args0: [
                    { type: 'input_value', name: 'AUDIO' },
                    { type: 'input_value', name: 'NAME' },
                    { type: 'input_value', name: 'DO' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_PLAY_CONTROL] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.play.control'),
                colour: BlocksColor.audio.primary,
                args0: [
                    { type: 'input_value', name: 'DO' },
                    { type: 'input_value', name: 'NAME' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_PLAY_SETTIME] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.play.setTime'),
                colour: BlocksColor.audio.primary,
                args0: [
                    { type: 'input_value', name: 'NAME' },
                    { type: 'input_value', name: 'DO' },
                    { type: 'input_value', name: 'TIME' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_PLAY_CONTROLALL] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.play.controlAll'),
                colour: BlocksColor.audio.primary,
                args0: [{ type: 'input_value', name: 'DO' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_PLAY_GETALLIDS] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:audio.play.getAllIds'),
                colour: BlocksColor.audio.primary,
                output: 'Array',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_PLAY_GETINFO] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:audio.play.getInfo'),
                colour: BlocksColor.audio.primary,
                output: 'String',
                args0: [
                    { type: 'input_value', name: 'NAME' },
                    { type: 'input_value', name: 'DO' },
                ],
            });
        },
    } as Blockly.Block;
    blockly.Blocks[OPCODES.AUDIO_PLAY_ISINFO] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:audio.play.isInfo'),
                colour: BlocksColor.audio.primary,
                output: 'Boolean',
                args0: [
                    { type: 'input_value', name: 'NAME' },
                    { type: 'input_value', name: 'DO' },
                ],
            });
        },
    } as Blockly.Block;

    // - 特效
    blockly.Blocks[OPCODES.AUDIO_EFFECTS_SETEFFECT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.effects.setEffect'),
                colour: BlocksColor.audio.secondary,
                args0: [
                    { type: 'input_value', name: 'NAME' },
                    { type: 'input_value', name: 'EFFECT' },
                    { type: 'input_value', name: 'VALUE' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_EFFECTS_RESETEFFECT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.effects.resetEffect'),
                colour: BlocksColor.audio.secondary,
                args0: [
                    { type: 'input_value', name: 'NAME' },
                    { type: 'input_value', name: 'EFFECT' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_EFFECTS_RESETALLEFFECTS] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.effects.resetAllEffects'),
                colour: BlocksColor.audio.secondary,
                args0: [{ type: 'input_value', name: 'NAME' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_EFFECTS_RESETEFFECTALL] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.effects.resetEffectAll'),
                colour: BlocksColor.audio.secondary,
                args0: [{ type: 'input_value', name: 'EFFECT' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_EFFECTS_RESETALLEFFECTSALL] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.effects.resetAllEffectsAll'),
                colour: BlocksColor.audio.secondary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.AUDIO_EFFECTS_GETEFFECT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:audio.effects.getEffect'),
                colour: BlocksColor.audio.secondary,
                args0: [
                    { type: 'input_value', name: 'NAME' },
                    { type: 'input_value', name: 'EFFECT' },
                ],
                output: 'Number',
            });
        },
    } as Blockly.Block;
}
