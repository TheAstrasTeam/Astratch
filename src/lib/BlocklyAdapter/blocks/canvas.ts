/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import { connections, isInFlyoutInsteadOfTrashCan } from './helpers';
import {
    createMinusField,
    createPlusField,
    MutationConnectionStore,
    removeMutationInputs,
} from './mutation';

export function initCanvasBlocks(blockly: typeof Blockly) {
    // 基础内容
    blockly.Blocks[OPCODES.CANVAS_COLOR] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.color'),
                args0: [{ type: 'input_value', name: 'COLOR' }],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_POINT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.point'),
                args0: [
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', chekc: 'Number' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    };

    blockly.Blocks[OPCODES.CANVAS_LINESET] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.lineset'),
                args0: [{ type: 'input_value', name: 'TYPE' }],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_LINE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.line'),
                args0: [
                    { type: 'input_value', name: 'X1', check: 'Number' },
                    { type: 'input_value', name: 'Y1', check: 'Number' },
                    { type: 'input_value', name: 'X2', check: 'Number' },
                    { type: 'input_value', name: 'Y2', check: 'Number' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_CIRCLE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.circle'),
                args0: [
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', check: 'Number' },
                    { type: 'input_value', name: 'RADIUS', check: 'Number' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_RECTANGLE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.rectangle'),
                args0: [
                    { type: 'input_value', name: 'X1', check: 'Number' },
                    { type: 'input_value', name: 'Y1', check: 'Number' },
                    { type: 'input_value', name: 'X2', check: 'Number' },
                    { type: 'input_value', name: 'Y2', check: 'Number' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    interface ICanvas_polygon extends Blockly.Block {
        itemCount: number;
        connectionStore_: MutationConnectionStore;
        plus: () => void;
        minus: (index?: number) => void;
        updateShape: () => void;
        saveConnections_: () => void;
        restoreConnection_: (inputName: string, defaultText: string) => void;
    }
    blockly.Blocks[OPCODES.CANVAS_POLYGON] = {
        init() {
            this.jsonInit({
                ...connections,
                // message0: t('blocks:canvas.triangle'),
                // args0: [
                //     { type: 'input_value', name: 'X1', check: 'Number' },
                //     { type: 'input_value', name: 'Y1', check: 'Number' },
                //     { type: 'input_value', name: 'X2', check: 'Number' },
                //     { type: 'input_value', name: 'Y2', check: 'Number' },
                //     { type: 'input_value', name: 'X3', check: 'Number' },
                //     { type: 'input_value', name: 'Y3', check: 'Number' },
                // ],
                colour: BlocksColor.canvas.primary,
            });
            this.itemCount = 3;
            this.connectionStore_ = new MutationConnectionStore();
            this.updateShape();
        },
        plus() {
            this.saveConnections_();
            this.itemCount++;
            this.updateShape();
        },
        minus(index?: number) {
            if (this.itemCount === 0) return;
            this.saveConnections_();
            const removeIdx = index ?? this.itemCount - 1;
            this.connectionStore_.removeIndex(this.itemCount, removeIdx, i => [
                `POINT${i.toString()}_X`,
                `POINT${i.toString()}_Y`,
            ]);
            this.itemCount--;
            this.updateShape();
        },
        saveConnections_() {
            this.connectionStore_.capture(
                this,
                Array.from({ length: this.itemCount }, (_, i) => [
                    `POINT${i.toString()}_X`,
                    `POINT${i.toString()}_Y`,
                ]).flat(),
            );
        },
        restoreConnection_(inputName: string, defaultText: string) {
            this.connectionStore_.restore(this, inputName, {
                type: 'text',
                fields: { TEXT: defaultText },
            });
        },
        updateShape() {
            removeMutationInputs(this, () => true);

            if (isInFlyoutInsteadOfTrashCan(this)) {
                this.appendDummyInput('TITLE').appendField(t('blocks:canvas.polygon.title.flyout'));
                return;
            }
            this.appendDummyInput('TITLE').appendField(t('blocks:canvas.polygon.title'));
            this.appendEndRowInput('END_ROW');
            for (let i = 0; i < this.itemCount; i++) {
                this.appendDummyInput(`POINT${String(i)}_TITLE`).appendField('    (');

                this.appendValueInput(`POINT${String(i)}_X`).setAlign(Blockly.inputs.Align.RIGHT);
                this.restoreConnection_(`POINT${i.toString()}_X`, '10086');

                this.appendDummyInput(`POINT${String(i)}_TITLE_SPLIT`).appendField(',');

                this.appendValueInput(`POINT${String(i)}_Y`).setAlign(Blockly.inputs.Align.RIGHT);
                this.restoreConnection_(`POINT${i.toString()}_Y`, '10086');

                this.appendDummyInput(`POINT${String(i)}_TITLE_END`).appendField(
                    i + 1 === this.itemCount ? ')' : '),',
                );

                if (this.itemCount > 3)
                    this.appendDummyInput('SUB')
                        .setAlign(Blockly.inputs.Align.RIGHT)
                        .appendField(
                            createMinusField({
                                removeIndex: i,
                            }),
                            'MINUS',
                        );
                this.appendEndRowInput(`END_ROW_VALUE${String(i)}`);
            }
            this.appendDummyInput(`TITLE_END`).appendField(t('blocks:canvas.polygon.end'));
            this.appendDummyInput('ADD')
                .setAlign(Blockly.inputs.Align.RIGHT)
                .appendField(createPlusField(), 'ADD');
        },
    } as ICanvas_polygon;

    blockly.Blocks[OPCODES.CANVAS_STAMP] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.stamp'),
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_STAMPPLUS] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.stampPlus'),
                args0: [
                    { type: 'input_value', name: 'IMG', check: 'String' },
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', check: 'Number' },
                    { type: 'input_value', name: 'SIZE', check: 'Number' },
                    { type: 'input_value', name: 'ANGLE' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_TEXT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.text'),
                args0: [
                    { type: 'input_value', name: 'TXT', check: 'String' },
                    { type: 'input_value', name: 'X', check: 'Number' },
                    { type: 'input_value', name: 'Y', check: 'Number' },
                    { type: 'input_value', name: 'ALIGN', check: 'String' },
                ],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.CANVAS_TEXTFONT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:canvas.textFont'),
                args0: [{ type: 'input_value', name: 'FONT', check: 'String' }],
                colour: BlocksColor.canvas.primary,
            });
        },
    } as Blockly.Block;

    // 高级渲染
    // TODO: KOSHINO 想做，给了。
}
