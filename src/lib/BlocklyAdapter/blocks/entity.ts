/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import { connections, endConnections, hatConnections, isInFlyoutInsteadOfTrashCan, returnConnections } from './helpers';
import {
    createMinusField,
    createPlusField,
    MutationConnectionStore,
    removeMutationInputs,
} from './mutation';

/**
 * 注册实体类积木
 * 涵盖：变换（位置/缩放/方向/图层）、外观（图像/特效）、碰撞、生命周期
 *
 * 注意：ENTITY_LIFECYCLE_CLONE 的变异器会在后续章节单独添加，
 * 当前仅保留基础结构（一个 EMPTY dummy input + 文本）。
 */
export function initEntityBlocks(blockly: typeof Blockly) {
    // - 变换
    // - - 位置
    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_POSITION_MOVESTEP] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.transform.position.moveStep'),
                args0: [{ type: 'input_value', name: 'STEPS' }],
                colour: BlocksColor.position.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_POSITION_SETPOSITION] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.transform.position.setPosition'),
                args0: [
                    { type: 'input_value', name: 'POSITION' },
                    { type: 'input_value', name: 'UNIT' },
                ],
                colour: BlocksColor.position.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_POSITION_ADDPOSITION] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.transform.position.addPosition'),
                args0: [
                    { type: 'input_value', name: 'POSITION' },
                    { type: 'input_value', name: 'UNIT' },
                ],
                colour: BlocksColor.position.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_POSITION_GETPOSITION] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.transform.position.getPosition'),
                args0: [{ type: 'input_value', name: 'POSITION' }],
                output: 'Number',
                colour: BlocksColor.position.primary,
            });
        },
    } as Blockly.Block;

    // - - 缩放
    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_SCALE_SETSCALE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.transform.scale.setScale'),
                args0: [
                    { type: 'input_value', name: 'UNIT' },
                ],
                colour: BlocksColor.scale.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_SCALE_ADDSCALE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.transform.scale.addScale'),
                args0: [
                    { type: 'input_value', name: 'UNIT' },
                ],
                colour: BlocksColor.scale.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_SCALE_GETSCALE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.transform.scale.getScale'),
                output: 'Number',
                colour: BlocksColor.scale.primary,
            });
        },
    } as Blockly.Block;

    // - - 方向
    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_DIRECTION_SETDIRECTION] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.transform.direction.setDirection'),
                args0: [
                    { type: 'input_value', name: 'UNIT' },
                ],
                colour: BlocksColor.direction.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_DIRECTION_ADDDIRECTION] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.transform.direction.addDirection'),
                args0: [
                    { type: 'input_value', name: 'UNIT' },
                ],
                colour: BlocksColor.direction.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_DIRECTION_FACEDIRECTION] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.transform.direction.faceDirection'),
                args0: [{ type: 'input_value', name: 'TARGET' }],
                colour: BlocksColor.direction.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_DIRECTION_GETDIRECTION] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.transform.direction.getDirection'),
                output: 'Number',
                colour: BlocksColor.direction.primary,
            });
        },
    } as Blockly.Block;

    // - - 图层
    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_LAYER_SETLAYER] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.transform.layer.setLayer'),
                args0: [
                    { type: 'input_value', name: 'UNIT' },
                ],
                colour: BlocksColor.layer.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_LAYER_MOVELAYER] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.transform.layer.moveLayer'),
                args0: [
                    { type: 'input_value', name: 'MOVE' },
                    { type: 'input_value', name: 'UNIT' },
                ],
                colour: BlocksColor.layer.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_TRANSFORM_LAYER_GETLAYER] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.transform.layer.getLayer'),
                output: 'Number',
                colour: BlocksColor.layer.primary,
            });
        },
    } as Blockly.Block;

    // - 外观
    // - - 图像
    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_IMAGES_SHOWIMAGE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.appearance.images.showImage'),
                args0: [{ type: 'input_value', name: 'IMAGE_NAME' }],
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_IMAGES_SETSTRETCH] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.appearance.images.setStretch'),
                args0: [
                    { type: 'input_value', name: 'POS' },
                    { type: 'input_value', name: 'NUMBER' },
                ],
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_IMAGES_ADDSTRETCH] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.appearance.images.addStretch'),
                args0: [
                    { type: 'input_value', name: 'POS' },
                    { type: 'input_value', name: 'NUMBER' },
                ],
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_IMAGES_GETSTRETCH] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.appearance.images.getStretch'),
                args0: [{ type: 'input_value', name: 'POS' }],
                output: 'Number',
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    // blockly.Blocks[OPCODES.ENTITY_APPEARANCE_IMAGES_SETGRID] = {
    //     init(this: Blockly.Block) {
    //         this.jsonInit({
    //             ...connections,
    //             message0: t('blocks:entity.appearance.images.setGrid'),
    //             args0: [{ type: 'input_value', name: 'POS' }],
    //             colour: BlocksColor.Images.primary,
    //         });
    //     },
    // } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_IMAGES_SETGRIDDISTANCE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.appearance.images.setGridDistance'),
                args0: [
                    { type: 'input_value', name: 'POS' },
                    { type: 'input_value', name: 'NUMBER' },
                    { type: 'input_value', name: 'UNIT' },
                ],
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_IMAGES_ADDGRIDDISTANCE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.appearance.images.addGridDistance'),
                args0: [
                    { type: 'input_value', name: 'POS' },
                    { type: 'input_value', name: 'NUMBER' },
                    { type: 'input_value', name: 'UNIT' },
                ],
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_IMAGES_GETGRID] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.appearance.images.getGrid'),
                output: 'Number',
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_IMAGES_GETGRIDDISTANCE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.appearance.images.getGridDistance'),
                args0: [
                    { type: 'input_value', name: 'UNIT' },
                    { type: 'input_value', name: 'POS' },
                ],
                output: 'Number',
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    // - - 特效
    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_EFFECTS_SETEFFECT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.appearance.effects.setEffect'),
                args0: [
                    { type: 'input_value', name: 'EFFECT' },
                    { type: 'input_value', name: 'VALUE' },
                ],
                colour: BlocksColor.effects.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_EFFECTS_ADDEFFECT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.appearance.effects.addEffect'),
                args0: [
                    { type: 'input_value', name: 'EFFECT' },
                    { type: 'input_value', name: 'VALUE' },
                ],
                colour: BlocksColor.effects.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_EFFECTS_GETEFFECT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.appearance.effects.getEffect'),
                args0: [{ type: 'input_value', name: 'EFFECT' }],
                output: 'Number',
                colour: BlocksColor.effects.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_VISIBILITY_SET] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.appearance.visibility.set'),
                args0: [{ type: 'input_value', name: 'VISIBILITY' }],
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_VISIBILITY_GET] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.appearance.visibility.get'),
                output: 'Boolean',
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    // - 碰撞
    blockly.Blocks[OPCODES.ENTITY_COLLISION_ISTOUCHING] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.collision.isTouching'),
                args0: [{ type: 'input_value', name: 'TARGETS' }],
                output: 'Boolean',
                colour: BlocksColor.collision.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_COLLISION_WHENTOUCHING] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:entity.collision.whenTouching'),
                args0: [{ type: 'input_value', name: 'TARGETS' }],
                colour: BlocksColor.collision.primary,
            });
        },
    } as Blockly.Block;

    // - 生命周期
    blockly.Blocks[OPCODES.ENTITY_LIFECYCLE_ONCREATED] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:entity.lifecycle.onCreated'),
                colour: BlocksColor.lifecycle.primary,
            });
        },
    } as Blockly.Block;

    interface ENTITY_LIFECYCLE_CLONE extends Blockly.Block {
        itemCount: number;
        connectionStore_: MutationConnectionStore;
        plus: () => void;
        minus: (index?: number) => void;
        updateShape: () => void;
        saveConnections_: () => void;
        restoreConnection_: (inputName: string, defaultText: string) => void;
    }
    blockly.Blocks[OPCODES.ENTITY_LIFECYCLE_CLONE] = {
        init(this: ENTITY_LIFECYCLE_CLONE) {
            this.jsonInit({
                ...connections,
                colour: BlocksColor.lifecycle.primary,
            });
            this.itemCount = 0;
            this.connectionStore_ = new MutationConnectionStore();
            this.updateShape();
        },
        plus(this: ENTITY_LIFECYCLE_CLONE) {
            this.saveConnections_();
            this.itemCount++;
            this.updateShape();
        },
        minus(this: ENTITY_LIFECYCLE_CLONE, index?: number) {
            if (this.itemCount === 0) return;
            this.saveConnections_();
            const removeIdx = index ?? this.itemCount - 1;
            this.connectionStore_.removeIndex(this.itemCount, removeIdx, i => [
                `DATA${i.toString()}`,
                `DATA${i.toString()}_CONTENT`,
            ]);
            this.itemCount--;
            this.updateShape();
        },
        saveConnections_(this: ENTITY_LIFECYCLE_CLONE) {
            this.connectionStore_.capture(
                this,
                Array.from({ length: this.itemCount }, (_, i) => [
                    `DATA${i.toString()}`,
                    `DATA${i.toString()}_CONTENT`,
                ]).flat(),
            );
        },
        restoreConnection_(this: ENTITY_LIFECYCLE_CLONE, inputName: string, defaultText: string) {
            this.connectionStore_.restore(this, inputName, {
                type: 'text',
                fields: { TEXT: defaultText },
            });
        },
        updateShape(this: ENTITY_LIFECYCLE_CLONE) {
            removeMutationInputs(this, () => true);

            this.appendDummyInput('CONTENT').appendField(
                t(
                    isInFlyoutInsteadOfTrashCan(this) || !this.itemCount
                        ? 'blocks:entity.lifecycle.clone.noData'
                        : 'blocks:entity.lifecycle.clone.haveData',
                ),
            );

            if (isInFlyoutInsteadOfTrashCan(this))  return;

            if (this.itemCount) {
                for (let i = 0; i < this.itemCount; i++) {
                    this.appendEndRowInput(`END_ROW_${i.toString()}`);

                    this.appendValueInput(`DATA${i.toString()}`)
                        .setAlign(Blockly.inputs.Align.RIGHT)
                        .appendField(t('blocks:entity.lifecycle.clone.data'));
                    this.restoreConnection_(`DATA${i.toString()}`, 'id');

                    this.appendValueInput(`DATA${i.toString()}_CONTENT`)
                        .setAlign(Blockly.inputs.Align.RIGHT)
                        .appendField(t('blocks:entity.lifecycle.clone.setTo'));
                    this.restoreConnection_(`DATA${i.toString()}_CONTENT`, '10086');
                    this.appendDummyInput('SUB')
                        .setAlign(Blockly.inputs.Align.RIGHT)
                        .appendField(
                            createMinusField({
                                removeIndex: i,
                            }),
                            'MINUS',
                        );
                }

                this.appendEndRowInput('END_ROW_BUTTONS');
                this.appendDummyInput('ADD')
                    .setAlign(Blockly.inputs.Align.RIGHT)
                    .appendField(createPlusField(), 'ADD');
            } else {
                this.appendDummyInput('SUB').appendField(createPlusField(), 'ADD');
            }

            this.connectionStore_.clear();
        },
        saveExtraState(this: ENTITY_LIFECYCLE_CLONE) {
            return { itemCount: this.itemCount };
        },
        loadExtraState(this: ENTITY_LIFECYCLE_CLONE, state: { itemCount?: number }) {
            this.itemCount = state.itemCount ?? 0;
            this.connectionStore_ = new MutationConnectionStore();
            this.updateShape();
        },
    } as ENTITY_LIFECYCLE_CLONE;

    blockly.Blocks[OPCODES.ENTITY_LIFECYCLE_DELETECLONE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:entity.lifecycle.deleteClone'),
                colour: BlocksColor.lifecycle.primary,
            });
        },
    } as Blockly.Block;
}
