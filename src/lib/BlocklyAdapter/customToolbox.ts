/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as Blockly from 'blockly/core';
import type { IVM } from '../../types/vm';
import { OPCODES, getEditingDataList } from './blocks/helpers';
import { menu, num, txt } from './toolbox';
import { t } from 'i18next';
import type { IRegisterCategory } from '.';
import { modal, isModalOpen } from '../../components/Modal/modal';
import { CreateDataModal } from '../../components/modal_createData';
import { CreateFunctionModal } from '../../components/modal_createFunction';

export function setDataCategory(_blockly: typeof Blockly, vm: IVM): IRegisterCategory {
    const createDataCategory = (
        _workspace: Blockly.WorkspaceSvg,
    ): Blockly.utils.toolbox.FlyoutDefinition => {
        const items: Blockly.utils.toolbox.FlyoutItemInfo[] = [];
        items.push({
            kind: 'button',
            text: t('blocks:data.createTip'),
            callbackkey: OPCODES.HANDLE_CREATE_DATA,
        });
        getEditingDataList(vm).forEach(data => {
            items.push({
                gap: 12,
                kind: 'block',
                type: OPCODES.DATA_VARIABLE_GET,
                extraState: { dataId: data.id },
            });
        });

        const basicItems: Blockly.utils.toolbox.FlyoutItemInfo[] = [
            { kind: 'sep', gap: 16 },
            {
                gap: 12,
                kind: 'block',
                type: OPCODES.DATA_VARIABLE_SET,
                inputs: {
                    VALUE: txt(t('blocks:example.value')),
                },
            },
            {
                gap: 12,
                kind: 'block',
                type: OPCODES.DATA_VARIABLE_ADD,
                inputs: { VALUE: num(1) },
            },
            {
                gap: 12,
                kind: 'block',
                type: OPCODES.DATA_VARIABLE_COMPUTE,
                inputs: {
                    OPERATOR: menu(OPCODES.DATA_COMPUTE_MENU),
                    VALUE: num(1),
                },
            },
        ];
        basicItems.forEach(item => items.push(item));
        return items;
    };
    const handleCreateData = () => {
        if (isModalOpen(CreateDataModal)) return;
        void modal.open(CreateDataModal, {
            vm,
        });
    };
    return {
        CUSTOM: OPCODES.DATA_CATEGORY,
        CALLBACK: [
            {
                ID: OPCODES.HANDLE_CREATE_DATA,
                FUNCTION: handleCreateData,
            },
        ],
        FUNCTION: createDataCategory,
    };
}

export function setFunctionCategory(_blockly: typeof Blockly, vm: IVM): IRegisterCategory {
    const createFunctionCategory = (
        _workspace: Blockly.WorkspaceSvg,
    ): Blockly.utils.toolbox.FlyoutDefinition => {
        const items: Blockly.utils.toolbox.FlyoutItemInfo[] = [];
        items.push({
            kind: 'button',
            text: t('blocks:function.createTip'),
            callbackkey: OPCODES.HANDLE_CREATE_FUNCTION,
        });
        const targetId = vm.runtime.editingTargetID;
        const functions = vm.runtime.getTargetByID(targetId)?.listFunctions() ?? [];
        functions.forEach(customFunction => {
            items.push({
                kind: 'block',
                type: OPCODES.FUNCTION_VALUE,
                extraState: {
                    functionRef: {
                        targetId,
                        functionId: customFunction.id,
                    },
                },
            });
        });
        const basicItems: Blockly.utils.toolbox.FlyoutItemInfo[] = [
            {
                gap: 12,
                kind: 'block',
                type: OPCODES.FUNCTION_CALL,
            },
            {
                gap: 12,
                kind: 'block',
                type: OPCODES.FUNCTION_EXECUTE,
            },
            {
                gap: 12,
                kind: 'block',
                type: OPCODES.FUNCTION_RETURN,
                inputs: { VALUE: txt(t('blocks:example.value')) },
            },
            {
                gap: 12,
                kind: 'block',
                type: OPCODES.FUNCTION_INLINE,
            },
            {
                gap: 12,
                kind: 'block',
                type: OPCODES.FUNCTION_SETDATAVALUE,
                inputs: {
                    VALUE: txt(t('blocks:example.data')),
                },
            },
        ];
        basicItems.forEach(item => items.push(item));
        return items;
    };
    const handleCreateFunction = () => {
        if (isModalOpen(CreateFunctionModal)) return;
        void modal.open(CreateFunctionModal, {
            vm,
            // 它100亿%会是现在编辑的目标
            addID: vm.runtime.editingTargetID,
        });
    };
    return {
        CUSTOM: OPCODES.FUNCTION_CATEGORY,
        CALLBACK: [
            {
                ID: OPCODES.HANDLE_CREATE_FUNCTION,
                FUNCTION: handleCreateFunction,
            },
        ],
        FUNCTION: createFunctionCategory,
    };
}
