/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as Blockly from 'blockly/core';
import type { IVM } from '../../types/vm';
import { OPCODES } from './blocks/helpers';
import { menu, num, txt } from './toolbox';
import { t } from 'i18next';
import type { IRegisterCategory } from '.';
import { modal } from '../../components/Modal/modal';
import { CreateDataModal } from '../../components/modal_createData';

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
        const basicItems: Blockly.utils.toolbox.FlyoutItemInfo[] = [
            {
                gap: 12,
                kind: 'block',
                type: OPCODES.DATA_VARIABLE_SET,
                inputs: {
                    NAME: menu(OPCODES.DATA_NAME_MENU),
                    VALUE: txt(t('blocks:example.value')),
                },
            },
            {
                gap: 12,
                kind: 'block',
                type: OPCODES.DATA_VARIABLE_ADD,
                inputs: { NAME: menu(OPCODES.DATA_NAME_MENU), VALUE: num(1) },
            },
            {
                gap: 12,
                kind: 'block',
                type: OPCODES.DATA_VARIABLE_COMPUTE,
                inputs: {
                    NAME: menu(OPCODES.DATA_NAME_MENU),
                    OPERATOR: menu(OPCODES.DATA_COMPUTE_MENU),
                    VALUE: num(1),
                },
            },
        ];
        basicItems.forEach(item => items.push(item));
        return items;
    };
    const handleCreateData = () => {
        void modal.open(CreateDataModal, {
            vm,
        })
    };
    return {
        CUSTOM: OPCODES.DATA_CATEGORY,
        CALLBACK: [
            {
                ID: OPCODES.HANDLE_CREATE_DATA,
                FUNCTION: handleCreateData
            },
        ],
        FUNCTION: createDataCategory,
    };
}
