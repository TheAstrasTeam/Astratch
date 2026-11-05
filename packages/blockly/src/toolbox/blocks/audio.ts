import { t } from 'astratch-i18n';
import { Blockly, blocklyAdapter, OPCODES } from '../..';
import {
    connections,
    dropdown,
    getTextInput,
    numberInput,
    returnConnections,
    stringInput,
} from '../helps';
import { TOOLBOX_COLOR } from '../color';

import AddIcon from './assets/add.svg';
import MinusIcon from './assets/minus.svg';

export const initAudioBlocks = () => {
    const EFFECT_OPTIONS = [
        [t('blocks:voice'), 'voice'],
        [t('blocks:tone'), 'tone'],
        [t('blocks:balance'), 'balance'],
        [t('blocks:speed'), 'speed'],
    ];
    blocklyAdapter.Blockly.Blocks[OPCODES.playAllAudio] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.playAll'),
                args0: [
                    dropdown('OPERATION', [
                        [t('blocks:audio_play'), 'play'],
                        [t('blocks:pause'), 'pause'],
                    ]),
                ],
                colour: TOOLBOX_COLOR.audio,
            });
        },
    } as Blockly.Block;
    blocklyAdapter.Blockly.Blocks[OPCODES.stopAllAudio] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.stopAll'),
                colour: TOOLBOX_COLOR.audio,
            });
        },
    } as Blockly.Block;
    blocklyAdapter.Blockly.Blocks[OPCODES.setAllAudioEffect] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.setAllEffect'),
                args0: [dropdown('OPERATION', EFFECT_OPTIONS), numberInput('VALUE')],
                colour: TOOLBOX_COLOR.audio,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.getAllAudio] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                output: 'Array',
                message0: t('blocks:audio.getAllAudio'),
                colour: TOOLBOX_COLOR.audio,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.playAudio] = {
        init() {
            this.isExpand = false;
            this.name = '';
            this.nameInputID = '';
            this.jsonInit({
                ...connections,
                colour: TOOLBOX_COLOR.audio,
            });
            this.updateShape();
        },
        updateShape() {
            if (!this.getInput('PLAY_AUDIO'))
                this.appendValueInput('PLAY_AUDIO')
                    .appendField(t('blocks:audio.playAudio'))
                    .setCheck('Object')
                    .connection?.setShadowState({
                        type: OPCODES.assetSelector,
                    });

            this.removeInput('SET_NAME', true);

            if (this.isExpand) {
                const input = this.appendValueInput('SET_NAME')
                    .appendField(t('blocks:audio.playAudio_setName'))
                    .setCheck('String');
                input.connection?.setShadowState({
                    type: OPCODES.string,
                    fields: {
                        TEXT: this.name,
                    },
                });
            }

            this.removeInput('USE_NAME', true);
            this.appendDummyInput('USE_NAME').appendField(
                new Blockly.FieldImage(
                    this.isExpand ? MinusIcon : AddIcon,
                    24,
                    24,
                    undefined,
                    () => {
                        this.isExpand = !this.isExpand;
                        this.updateShape();
                    },
                ),
            );
        },
        onchange(event) {
            if (event.type !== 'change') return;
            const changeEvent = event as unknown as Blockly.Events.BlockChange;
            const input = this.getInput('SET_NAME');
            if (!input) return;
            const textInput = getTextInput(input);
            if (changeEvent.blockId !== textInput?.id) return;
            this.name = textInput?.getFieldValue('TEXT') as string;
        },
        loadExtraState({
            name,
            isExpand,
            nameInputID,
        }: {
            name: string;
            isExpand: boolean;
            nameInputID: string;
        }) {
            this.name = name;
            this.isExpand = isExpand;
            this.nameInputID = nameInputID;
            this.updateShape();
        },
        saveExtraState() {
            return {
                name: this.name,
                isExpand: this.isExpand,
                nameInputID: this.nameInputID,
            };
        },
    } as Blockly.Block & {
        updateShape(): void;
        isExpand: boolean;
        name: string;
        nameInputID: string;
    };

    blocklyAdapter.Blockly.Blocks[OPCODES.stopOrPlayAudio] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.stopOrPlayAudio'),
                args0: [
                    dropdown('OPERATION', [
                        [t('blocks:audio_play'), 'play'],
                        [t('blocks:pause'), 'pause'],
                    ]),
                    stringInput('AUDIO_NAME'),
                ],
                colour: TOOLBOX_COLOR.audio,
            });
        },
    } as Blockly.Block;
    blocklyAdapter.Blockly.Blocks[OPCODES.stopAndDeleteAudio] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.stopAndDeleteAudio'),
                args0: [stringInput('AUDIO_NAME')],
                colour: TOOLBOX_COLOR.audio,
            });
        },
    } as Blockly.Block;
    blocklyAdapter.Blockly.Blocks[OPCODES.setAudioEffect] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:audio.setAudioEffect'),
                args0: [
                    stringInput('AUDIO_NAME'),
                    dropdown('OPERATION', EFFECT_OPTIONS),
                    numberInput('VALUE'),
                ],
                colour: TOOLBOX_COLOR.audio,
            });
        },
    } as Blockly.Block;
    blocklyAdapter.Blockly.Blocks[OPCODES.isExistingAudio] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                output: 'Boolean',
                message0: t('blocks:audio.isExistingAudio'),
                args0: [stringInput('AUDIO_NAME')],
                colour: TOOLBOX_COLOR.audio,
            });
        },
    } as Blockly.Block;
    blocklyAdapter.Blockly.Blocks[OPCODES.isPlayingAudio] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                output: 'Boolean',
                message0: t('blocks:audio.isPlayingAudio'),
                args0: [stringInput('AUDIO_NAME')],
                colour: TOOLBOX_COLOR.audio,
            });
        },
    } as Blockly.Block;
    blocklyAdapter.Blockly.Blocks[OPCODES.getAudioUsingAsset] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                output: 'Object',
                message0: t('blocks:audio.getAudioUsingAsset'),
                args0: [stringInput('AUDIO_NAME')],
                colour: TOOLBOX_COLOR.audio,
            });
        },
    } as Blockly.Block;
    blocklyAdapter.Blockly.Blocks[OPCODES.getAudioEffect] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                output: 'Number',
                message0: t('blocks:audio.getAudioEffect'),
                args0: [stringInput('AUDIO_NAME'), dropdown('OPERATION', EFFECT_OPTIONS)],
                colour: TOOLBOX_COLOR.audio,
            });
        },
    } as Blockly.Block;
};
