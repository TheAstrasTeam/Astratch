/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Blockly from 'blockly/core';
import type { IVM } from '../../../types/vm/vm';
import { clearRegisteredBlocks } from './helpers';
import { initPrimitiveBlocks } from './primitives';
import { initMenuBlocks } from './menus';
import { initEntityBlocks } from './entity';
import { initAudioBlocks } from './audio';
import { initResourceBlocks } from './resources';
import { initEventBlocks } from './event';
import { initControlBlocks } from './control';
import { initOperatorBlocks } from './operator';
import { initDataBlocks } from './data';
import { initFunctionBlocks } from './function';
import { initCanvasBlocks } from './canvas';
import { initDebugBlocks } from './debug';
import { registerBlocksCSS } from './css';

export { connections, hatConnections, endConnections, returnConnections } from './helpers';

import { dropdownWithInput } from '../../../../plugins/fieldDropdown';
import { FieldAngle } from '../../../../plugins/field-angle/src';
import { FieldColourHsvSliders } from '../../../../plugins/field-colour-hsv-sliders/src';

/**
 * 初始化所有 ASH 自定义积木
 */
export const initBlocks = (blockly: typeof Blockly, vm: IVM) => {
    blockly.fieldRegistry.unregister('field_dropdown_with_block');
    blockly.fieldRegistry.unregister('field_angle');
    blockly.fieldRegistry.unregister('field_colour');

    blockly.fieldRegistry.register('field_dropdown_with_block', dropdownWithInput);
    blockly.fieldRegistry.register('field_angle', FieldAngle);
    blockly.fieldRegistry.register('field_colour', FieldColourHsvSliders);

    clearRegisteredBlocks(blockly);
    registerBlocksCSS();

    initPrimitiveBlocks(blockly);
    initMenuBlocks(blockly, vm);
    initEntityBlocks(blockly);
    initAudioBlocks(blockly);
    initResourceBlocks(blockly);
    initEventBlocks(blockly);
    initControlBlocks(blockly);
    initOperatorBlocks(blockly);
    initDataBlocks(blockly, vm);
    initFunctionBlocks(blockly, vm);
    initCanvasBlocks(blockly);
    initDebugBlocks(blockly);
};
