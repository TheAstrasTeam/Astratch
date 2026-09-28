/**
 * @license
 * Copyright 2020 Google LLC
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 *
 * 由 AstrasTeam 修改于 2026/7/25:
 * - 更新 Astratch Toolbox 的测试入口与翻译函数
 */

/**
 * @fileoverview Continuous toolbox plugin test.
 */

import * as Blockly from 'blockly';
import { createPlayground } from '@blockly/dev-tools';
import { registerAstratchToolbox } from '../src/index';

/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @returns {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv, options) {
    return Blockly.inject(blocklyDiv, options);
}

document.addEventListener('DOMContentLoaded', function () {
    registerAstratchToolbox(key => key);
    createPlayground(document.getElementById('root'), createWorkspace, {
        plugins: {
            flyoutsVerticalToolbox: 'ContinuousFlyout',
            metricsManager: 'ContinuousMetrics',
            toolbox: 'ContinuousToolbox',
        },
    });
});
