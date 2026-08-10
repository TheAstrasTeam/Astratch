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

export function setDataCategory(_blockly: typeof Blockly, _vm: IVM) {
    const createDataCategory = (
        _workspace: Blockly.WorkspaceSvg,
    ): Blockly.utils.toolbox.FlyoutDefinition => {
        return [
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
    };
    return {
        CUSTOM: OPCODES.DATA_CATEGORY,
        FUNCTION: createDataCategory,
    };
}
