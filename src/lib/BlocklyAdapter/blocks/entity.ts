import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import { connections, endConnections, hatConnections, returnConnections } from './helpers';
import { createPlusField } from './fieldPlus';
import { createMinusField } from './fieldMinus';

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
                    { type: 'input_value', name: 'DO' },
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
                    { type: 'input_value', name: 'DO' },
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
                    { type: 'input_value', name: 'DO' },
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
                    { type: 'input_value', name: 'DO' },
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
                    { type: 'input_value', name: 'SET' },
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

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_IMAGES_SETGRID] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.appearance.images.setGrid'),
                args0: [{ type: 'input_value', name: 'POS' }],
                colour: BlocksColor.Images.primary,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.ENTITY_APPEARANCE_IMAGES_SETGRIDDISTANCE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.appearance.images.setGridDistance'),
                args0: [
                    { type: 'input_value', name: 'POS' },
                    { type: 'input_value', name: 'SET' },
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
                    { type: 'input_value', name: 'SET' },
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

    interface SavedConn {
        shadow: Blockly.serialization.blocks.State;
        block: Blockly.Block | null;
    }
    interface ENTITY_LIFECYCLE_CLONE extends Blockly.Block {
        itemCount: number;
        savedConns_: Map<string, SavedConn>;
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
            this.savedConns_ = new Map();
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
            const newConns = new Map<string, SavedConn>();
            for (let i = 0, j = 0; i < this.itemCount; i++) {
                if (i === removeIdx) continue;
                for (const key of [`DATA${i.toString()}`, `DATA${i.toString()}_CONTENT`]) {
                    const saved = this.savedConns_.get(key);
                    if (saved) newConns.set(key.replace(`DATA${i.toString()}`, `DATA${j.toString()}`), saved);
                }
                j++;
            }
            this.savedConns_ = newConns;
            this.itemCount--;
            this.updateShape();
        },
        saveConnections_(this: ENTITY_LIFECYCLE_CLONE) {
            this.savedConns_ = new Map();
            for (let i = 0; i < this.itemCount; i++) {
                for (const key of [`DATA${i.toString()}`, `DATA${i.toString()}_CONTENT`]) {
                    const conn = this.getInput(key)?.connection;
                    if (!conn) continue;
                    const shadow = conn.getShadowState(true);
                    const target = conn.targetBlock();
                    const saved: SavedConn = {
                        shadow: shadow ?? { type: 'text', fields: { TEXT: '' } },
                        block: target && !target.isShadow() ? target : null,
                    };
                    this.savedConns_.set(key, saved);
                }
            }
        },
        restoreConnection_(this: ENTITY_LIFECYCLE_CLONE, inputName: string, defaultText: string) {
            const conn = this.getInput(inputName)?.connection;
            if (!conn) return;
            const saved = this.savedConns_.get(inputName);
            const shadowState = saved?.shadow ?? { type: 'text', fields: { TEXT: defaultText } };
            conn.setShadowState(shadowState);
            if (saved?.block) {
                const blockConn = saved.block.outputConnection ?? saved.block.previousConnection;
                if (blockConn) conn.connect(blockConn);
            }
        },
        updateShape(this: ENTITY_LIFECYCLE_CLONE) {
            const inputNames = this.inputList.map(input => input.name);
            for (const inputName of inputNames) {
                this.removeInput(inputName);
            }

            this.appendDummyInput('CONTENT').appendField(
                t(
                    this.isInFlyout || !this.itemCount
                        ? 'blocks:entity.lifecycle.clone.noData'
                        : 'blocks:entity.lifecycle.clone.haveData',
                ),
            );

            if (this.isInFlyout) return;

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
                        .appendField(createMinusField({
                            removeIndex: i
                        }), 'MINUS');
                }

                this.appendEndRowInput('END_ROW_BUTTONS');
                this.appendDummyInput('ADD')
                    .setAlign(Blockly.inputs.Align.RIGHT)
                    .appendField(createPlusField(), 'ADD');
            } else {
                this.appendDummyInput('SUB').appendField(createPlusField(), 'ADD');
            }

            this.savedConns_ = new Map();
        },
        saveExtraState(this: ENTITY_LIFECYCLE_CLONE) {
            return { itemCount: this.itemCount };
        },
        loadExtraState(this: ENTITY_LIFECYCLE_CLONE, state: { itemCount?: number }) {
            this.itemCount = state.itemCount ?? 0;
            this.savedConns_ = new Map();
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
