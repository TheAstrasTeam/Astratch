/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Continuous-scroll toolbox and flyout that is always open.
 */

import * as Blockly from 'blockly/core';

import { ContinuousFlyout } from './ContinuousFlyout';
import type { LabelFlyoutItem } from './ContinuousFlyout';
import { ContinuousMetrics } from './ContinuousMetrics';
import { ContinuousToolbox, TOOLBOX_WIDTH } from './ContinuousToolbox';
import { RecyclableBlockFlyoutInflater } from './RecyclableBlockFlyoutInflater';

export {
    ContinuousFlyout,
    ContinuousMetrics,
    ContinuousToolbox,
    type LabelFlyoutItem,
    RecyclableBlockFlyoutInflater,
};

/**
 * Registers the components of the continuous toolbox, replacing Blockly's
 * built-in defaults.
 */
export function registerContinuousToolbox() {
    Blockly.Scrollbar.scrollbarThickness = 8;
    Blockly.registry.register(
        Blockly.registry.Type.METRICS_MANAGER,
        'ContinuousMetrics',
        ContinuousMetrics,
        true,
    );

    Blockly.registry.register(
        Blockly.registry.Type.FLYOUTS_VERTICAL_TOOLBOX,
        'ContinuousFlyout',
        ContinuousFlyout,
        true,
    );

    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX,
        'ContinuousToolbox',
        ContinuousToolbox,
        true,
    );

    Blockly.registry.register(
        Blockly.registry.Type.FLYOUT_INFLATER,
        'block',
        RecyclableBlockFlyoutInflater,
        true,
    );

    Blockly.Css.register(`
        .blocklyToolbox {
            width: ${TOOLBOX_WIDTH}px
        }
            .blocklyToolbox {
        display: flex !important;
        flex-direction: column;
        overflow-y: visible;
    }
    .blocklyToolbox > .blocklyToolboxCategoryGroup {
        flex: 1;
        flex-wrap: nowrap;
        min-height: 0;
        overflow-y: auto;
    }
    .blocklyToolboxCategory {
        height: initial;
        padding: 3px 0;
    }
    .blocklyTreeRowContentContainer {
        display: flex;
        flex-direction: row-reverse;
        justify-content: space-between;
        width: 100%
    }
    .blocklyToolboxCategoryLabel {
        font-size: 0.65rem;
    }
    .blocklyToolboxCategory {
        border-width: 2px !important;
        margin-bottom: 0 !important
    }
    .continuousToolboxIndentGuide {
        position: relative;
    }
    .continuousToolboxIndentGuide::before {
        content: '';
        position: absolute;
        inset-block: 0;
        inset-inline-start: var(--continuous-toolbox-guide-offset);
        border-inline-start: 2px solid rgb(128 128 128 / 0.45);
        pointer-events: none;
    }
    .continuousFlyoutSearchContainer {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
        padding: 6px 8px;
    }
    .continuousFlyoutSearchInput {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        height: 22px;
        border-radius: 999px !important;
        padding-left: 10px !important;
    }
    .astratchContinuousFlyout {
        overflow: hidden;
    }
    .astratchContinuousFlyout:hover {
        overflow: visible;
    }
    .injectionDiv:has(.blocklyFlyoutScrollbar:hover) .astratchContinuousFlyout {
        overflow: visible;
    }
    .astratchContinuousFlyout .blocklyScrollbarHandle {
        fill: #bcbcbc;
    }
    .astratchContinuousFlyout .blocklyScrollbarBackground {
        fill: transparent;
    }
    `);
}
