/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import { connections, createDataMenu, isInFlyoutInsteadOfTrashCan, refreshDataMenu, returnConnections } from './helpers';
import { events, type IDataCreatedEvent, type IVM } from '../../../types/vm';
import {
    createMinusField,
    createPlusField,
    MutationConnectionStore,
    removeMutationInputs,
} from './mutation';

/**
 * 注册数据类积木
 * 涵盖：变量、字符串、数组、对象、类型
 */
export function initDataBlocks(blockly: typeof Blockly, vm: IVM) {
    // - 变量
    // 每个数据都是一个独立积木：id 存在积木自己身上（extraState），
    // 标签只负责显示名字。这样改名不会断链，也不必在菜单里堆一长串选项。
    interface IDataGetBlock extends Blockly.Block {
        dataId: string;
        /** 从 VM 重读名字并刷新标签。 */
        syncLabel(): void;
    }

    interface IDataBlock extends Blockly.Block {
        _onCreateData: (Data: unknown) => void;
    }

    blockly.Blocks[OPCODES.DATA_VARIABLE_GET] = {
        init(this: IDataGetBlock) {
            this.dataId = '';
            this.jsonInit({
                ...returnConnections,
                message0: '%1',
                colour: BlocksColor.data.primary,
                output: null,
                args0: [{ type: 'field_label_serializable', name: 'NAME', text: '' }],
            });
        },
        syncLabel(this: IDataGetBlock) {
            const variable = vm.runtime.getEditingTarget()?.getData(this.dataId);
            this.setFieldValue(variable?.name ?? t('blocks:data.missing'), 'NAME');
        },
        saveExtraState(this: IDataGetBlock) {
            return { dataId: this.dataId };
        },
        loadExtraState(this: IDataGetBlock, state: { dataId?: string }) {
            this.dataId = state.dataId ?? '';
            this.syncLabel();
        },
    } as IDataGetBlock;

    blockly.Blocks[OPCODES.DATA_VARIABLE_SET] = {
        init(this: IDataBlock) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:data.variable.set'),
                colour: BlocksColor.data.primary,
                args0: [
                    { type: 'input_dummy', name: 'NAME_HOLDER' },
                    { type: 'input_value', name: 'VALUE' },
                ],
            });
            this.getInput('NAME_HOLDER')?.appendField(createDataMenu(vm), 'NAME');

            if (this.isInFlyout) {
                const handler = (Data: unknown) => {
                    refreshDataMenu(this, (Data as IDataCreatedEvent).dataID, vm);
                };
                vm.on(events.CREATE_DATA, handler);
                this._onCreateData = handler;
            }
        },
        destroy(this: IDataBlock) {
            if (this.isInFlyout) vm.off(events.CREATE_DATA, this._onCreateData);
        },
    } as IDataBlock;

    blockly.Blocks[OPCODES.DATA_VARIABLE_ADD] = {
        init(this: IDataBlock) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:data.variable.add'),
                colour: BlocksColor.data.primary,
                args0: [
                    { type: 'input_dummy', name: 'NAME_HOLDER' },
                    { type: 'input_value', name: 'VALUE', check: 'Number' },
                ],
            });
            this.getInput('NAME_HOLDER')?.appendField(createDataMenu(vm), 'NAME');

            if (this.isInFlyout) {
                const handler = (Data: unknown) => {
                    refreshDataMenu(this, (Data as IDataCreatedEvent).dataID, vm);
                };
                vm.on(events.CREATE_DATA, handler);
                this._onCreateData = handler;
            }
        },
        destroy(this: IDataBlock) {
            if (this.isInFlyout) vm.off(events.CREATE_DATA, this._onCreateData);
        },
    } as IDataBlock;

    blockly.Blocks[OPCODES.DATA_VARIABLE_COMPUTE] = {
        init(this: IDataBlock) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:data.variable.compute'),
                colour: BlocksColor.data.primary,
                args0: [
                    { type: 'input_dummy', name: 'NAME_HOLDER' },
                    { type: 'input_value', name: 'OPERATOR', check: 'String' },
                    { type: 'input_value', name: 'VALUE', check: 'Number' },
                ],
            });
            this.getInput('NAME_HOLDER')?.appendField(createDataMenu(vm), 'NAME');

            if (this.isInFlyout) {
                const handler = (Data: unknown) => {
                    refreshDataMenu(this, (Data as IDataCreatedEvent).dataID, vm);
                };
                vm.on(events.CREATE_DATA, handler);
                this._onCreateData = handler;
            }
        },
        destroy(this: IDataBlock) {
            if (this.isInFlyout) vm.off(events.CREATE_DATA, this._onCreateData);
        },
    } as IDataBlock;

    // - 字符串

    interface DataStringJoinBlock extends Blockly.Block {
        itemCount: number;
        connectionStore_: MutationConnectionStore;
        plus: () => void;
        minus: (index?: number) => void;
        updateShape: () => void;
        saveConnections_: () => void;
        restoreConnection_: (inputName: string) => void;
    }
    blockly.Blocks[OPCODES.DATA_STRING_JOIN] = {
        init(this: DataStringJoinBlock) {
            this.jsonInit({
                ...returnConnections,
                output: 'String',
                colour: BlocksColor.data.secondary,
            });
            this.itemCount = 2;
            this.connectionStore_ = new MutationConnectionStore();
            this.updateShape();
        },
        plus(this: DataStringJoinBlock) {
            this.saveConnections_();
            this.itemCount++;
            this.updateShape();
        },
        minus(this: DataStringJoinBlock, index?: number) {
            if (this.itemCount === 0) return;

            const removeIndex = index ?? this.itemCount - 1;
            if (removeIndex < 0 || removeIndex >= this.itemCount) return;

            this.saveConnections_();
            this.connectionStore_.removeIndex(this.itemCount, removeIndex, i => [
                `DATA${i.toString()}`,
            ]);
            this.itemCount--;
            this.updateShape();
        },
        saveConnections_(this: DataStringJoinBlock) {
            this.connectionStore_.capture(
                this,
                Array.from({ length: this.itemCount }, (_, i) => `DATA${i.toString()}`),
            );
        },
        restoreConnection_(this: DataStringJoinBlock, inputName: string) {
            this.connectionStore_.restore(this, inputName, {
                type: OPCODES.text,
                fields: { TEXT: t('blocks:example.text') },
            });
        },
        updateShape(this: DataStringJoinBlock) {
            removeMutationInputs(this, () => true);

            this.appendDummyInput('CONTENT').appendField(
                t(
                    isInFlyoutInsteadOfTrashCan(this)
                        ? 'blocks:data.string.joinText'
                        : 'blocks:data.string.join',
                ),
            );

            if (isInFlyoutInsteadOfTrashCan(this)) return;

            this.appendDummyInput('ADD')
                .setAlign(Blockly.inputs.Align.LEFT)
                .appendField(createPlusField(), 'ADD');

            if (this.itemCount > 0) {
                for (let i = 0; i < this.itemCount; i++) {
                    this.appendValueInput(`DATA${i.toString()}`)
                        .setAlign(Blockly.inputs.Align.RIGHT)
                        .setCheck(['Number', 'String']);
                    this.restoreConnection_(`DATA${i.toString()}`);
                    this.appendDummyInput(`REMOVE${i.toString()}`)
                        .setAlign(Blockly.inputs.Align.RIGHT)
                        .appendField(
                            createMinusField({
                                removeIndex: i,
                            }),
                            'MINUS',
                        );
                }
            }

            this.connectionStore_.clear();
        },
        saveExtraState(this: DataStringJoinBlock) {
            return { itemCount: this.itemCount };
        },
        loadExtraState(this: DataStringJoinBlock, state: { itemCount?: number }) {
            this.itemCount = state.itemCount ?? 0;
            this.connectionStore_ = new MutationConnectionStore();
            this.updateShape();
        },
    } as DataStringJoinBlock;

    blockly.Blocks[OPCODES.DATA_STRING_SPLIT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.string.split'),
                colour: BlocksColor.data.secondary,
                output: 'Array',
                args0: [
                    { type: 'input_value', name: 'TEXT', check: 'String' },
                    { type: 'input_value', name: 'SEPARATOR', check: 'String' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_STRING_SUBSTRING] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.string.substring'),
                colour: BlocksColor.data.secondary,
                output: 'String',
                args0: [
                    { type: 'input_value', name: 'TEXT', check: 'String' },
                    { type: 'input_value', name: 'START', check: 'Number' },
                    { type: 'input_value', name: 'END', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_STRING_LENGTH] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.string.length'),
                colour: BlocksColor.data.secondary,
                output: 'Number',
                args0: [{ type: 'input_value', name: 'TEXT', check: 'String' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_STRING_CONTAINS] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.string.contains'),
                colour: BlocksColor.data.secondary,
                output: 'Boolean',
                args0: [
                    { type: 'input_value', name: 'TEXT', check: 'String' },
                    { type: 'input_value', name: 'SEARCH', check: 'String' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_STRING_INDEXOF] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.string.indexOf'),
                colour: BlocksColor.data.secondary,
                output: 'Number',
                args0: [
                    { type: 'input_value', name: 'TEXT', check: 'String' },
                    { type: 'input_value', name: 'SEARCH', check: 'String' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_STRING_REPLACE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.string.replace'),
                colour: BlocksColor.data.secondary,
                output: 'String',
                args0: [
                    { type: 'input_value', name: 'TEXT', check: 'String' },
                    { type: 'input_value', name: 'SEARCH', check: 'String' },
                    { type: 'input_value', name: 'REPLACEMENT', check: 'String' },
                ],
            });
        },
    } as Blockly.Block;

    // - 数组
    blockly.Blocks[OPCODES.DATA_ARRAY_EMPTY] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.array.empty'),
                colour: BlocksColor.data.tertiary,
                output: 'Array',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_ARRAY_PUSH] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.array.push'),
                output: 'Array',
                colour: BlocksColor.data.tertiary,
                args0: [
                    { type: 'input_value', name: 'ARRAY', check: 'Array' },
                    { type: 'input_value', name: 'VALUE' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_ARRAY_REMOVEAT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.array.removeAt'),
                output: 'Array',
                colour: BlocksColor.data.tertiary,
                args0: [
                    { type: 'input_value', name: 'ARRAY', check: 'Array' },
                    { type: 'input_value', name: 'INDEX', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_ARRAY_REMOVEENDS] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.array.removeEnds'),
                output: 'Array',
                colour: BlocksColor.data.tertiary,
                args0: [
                    { type: 'input_value', name: 'ARRAY', check: 'Array' },
                    { type: 'input_value', name: 'START', check: 'Number' },
                    { type: 'input_value', name: 'END', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_ARRAY_GET] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.array.get'),
                colour: BlocksColor.data.tertiary,
                output: null,
                args0: [
                    { type: 'input_value', name: 'ARRAY', check: 'Array' },
                    { type: 'input_value', name: 'INDEX', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_ARRAY_LENGTH] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.array.length'),
                colour: BlocksColor.data.tertiary,
                output: 'Number',
                args0: [{ type: 'input_value', name: 'ARRAY', check: 'Array' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_ARRAY_FILTER] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.array.filter'),
                colour: BlocksColor.data.tertiary,
                output: 'Array',
                args0: [
                    { type: 'input_value', name: 'ARRAY', check: 'Array' },
                    { type: 'input_value', name: 'FILTER' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_ARRAY_INDEXOF] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.array.indexOf'),
                colour: BlocksColor.data.tertiary,
                output: 'Number',
                args0: [
                    { type: 'input_value', name: 'ARRAY', check: 'Array' },
                    { type: 'input_value', name: 'VALUE' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_ARRAY_SET] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.array.set'),
                colour: BlocksColor.data.tertiary,
                output: 'Array',
                args0: [
                    { type: 'input_value', name: 'ARRAY', check: 'Array' },
                    { type: 'input_value', name: 'INDEX', check: 'Number' },
                    { type: 'input_value', name: 'VALUE' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_ARRAY_INSERT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.array.insert'),
                colour: BlocksColor.data.tertiary,
                output: 'Array',
                args0: [
                    { type: 'input_value', name: 'ARRAY', check: 'Array' },
                    { type: 'input_value', name: 'INDEX', check: 'Number' },
                    { type: 'input_value', name: 'VALUE' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_ARRAY_CONTAINS] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.array.contains'),
                colour: BlocksColor.data.tertiary,
                output: 'Boolean',
                args0: [
                    { type: 'input_value', name: 'ARRAY', check: 'Array' },
                    { type: 'input_value', name: 'VALUE' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_ARRAY_SLICE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.array.slice'),
                colour: BlocksColor.data.tertiary,
                output: 'Array',
                args0: [
                    { type: 'input_value', name: 'ARRAY', check: 'Array' },
                    { type: 'input_value', name: 'START', check: 'Number' },
                    { type: 'input_value', name: 'END', check: 'Number' },
                ],
            });
        },
    } as Blockly.Block;

    // - 对象
    blockly.Blocks[OPCODES.DATA_OBJECT_EMPTY] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.object.empty'),
                colour: BlocksColor.data.secondary,
                output: 'Object',
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_OBJECT_SET] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.object.set'),
                colour: BlocksColor.data.secondary,
                output: 'Object',
                args0: [
                    { type: 'input_value', name: 'OBJECT', check: 'Object' },
                    { type: 'input_value', name: 'KEY', check: 'String' },
                    { type: 'input_value', name: 'VALUE' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_OBJECT_DELETE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.object.delete'),
                colour: BlocksColor.data.secondary,
                output: 'Object',
                args0: [
                    { type: 'input_value', name: 'OBJECT', check: 'Object' },
                    { type: 'input_value', name: 'KEY', check: 'String' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_OBJECT_GETALL] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.object.getAll'),
                colour: BlocksColor.data.secondary,
                output: 'Array',
                args0: [
                    { type: 'input_value', name: 'OBJECT', check: 'Object' },
                    { type: 'input_value', name: 'KIND', check: 'String' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_OBJECT_GET] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.object.get'),
                colour: BlocksColor.data.secondary,
                output: null,
                args0: [
                    { type: 'input_value', name: 'OBJECT', check: 'Object' },
                    { type: 'input_value', name: 'KEY', check: 'String' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_OBJECT_LENGTH] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.object.length'),
                colour: BlocksColor.data.secondary,
                output: 'Number',
                args0: [{ type: 'input_value', name: 'OBJECT', check: 'Object' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_OBJECT_HAS] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.object.has'),
                colour: BlocksColor.data.secondary,
                output: 'Boolean',
                args0: [
                    { type: 'input_value', name: 'OBJECT', check: 'Object' },
                    { type: 'input_value', name: 'KEY', check: 'String' },
                ],
            });
        },
    } as Blockly.Block;

    // - 类型
    blockly.Blocks[OPCODES.DATA_TYPE_TYPEOF] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.type.typeof'),
                colour: BlocksColor.data.tertiary,
                output: 'String',
                args0: [{ type: 'input_value', name: 'VALUE' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_TYPE_CAST] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.type.cast'),
                colour: BlocksColor.data.tertiary,
                output: null,
                args0: [
                    { type: 'input_value', name: 'VALUE' },
                    { type: 'input_value', name: 'TYPE', check: 'String' },
                ],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.DATA_TYPE_NULL] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:data.type.null'),
                colour: BlocksColor.data.tertiary,
                output: null,
            });
        },
    } as Blockly.Block;
}
