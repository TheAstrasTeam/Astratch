/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * 由 AstrasTeam 修改于 2026/7/3:
 * - 加宽`categoryBubble`的边框宽度
 *
 * 由 AstrasTeam 修改于 2026/7/6:
 * - 减小`blocklyToolboxCategoryLabel`的字体大小
 * - 增加`blocklyToolboxCategory`的宽度设置（60px）
 *
 * 由 AstrasTeam 修改于 2026/7/25:
 * - 修改 CSS
 * - 注册 CollapsibleContinuousCategory
 * - 支持配置连续工具箱按钮的翻译函数
 * - 将工具箱快捷键注册移到插件注册阶段，避免重复注册
 */

/**
 * @fileoverview Continuous-scroll toolbox and flyout that is always open.
 */

import * as Blockly from 'blockly/core';

import { ContinuousCategory } from './ContinuousCategory';
import { ContinuousFlyout } from './ContinuousFlyout';
import type { LabelFlyoutItem } from './ContinuousFlyout';
import { ContinuousMetrics } from './ContinuousMetrics';
import { ContinuousToolbox } from './ContinuousToolbox';
import { RecyclableBlockFlyoutInflater } from './RecyclableBlockFlyoutInflater';
import { CollapsibleContinuousCategory } from './ContinuousCollapsibleToolboxCategory';
import {
    setContinuousToolboxControlTranslator,
    type ContinuousToolboxControlTranslator,
} from './ContinuousToolboxControls';
import type { i18n } from 'i18next';

export {
    ContinuousCategory,
    ContinuousFlyout,
    ContinuousMetrics,
    ContinuousToolbox,
    RecyclableBlockFlyoutInflater,
};
export type { LabelFlyoutItem };

export interface ContinuousToolboxRegistrationOptions {
    /** 用于翻译连续工具箱按钮文本的函数。 */
    translate?: ContinuousToolboxControlTranslator;
}

const COLLAPSE_OTHER_CATEGORIES_SHORTCUT = 'collapseOtherCategories';

/** 注册连续工具箱的全局操作快捷键。 */
function registerContinuousToolboxShortcuts() {
    const registry = Blockly.ShortcutRegistry.registry;
    if (registry.getRegistry()[COLLAPSE_OTHER_CATEGORIES_SHORTCUT]) return;

    const keyCode = registry.createSerializedKey(Blockly.utils.KeyCodes.O, [
        Blockly.utils.KeyCodes.CTRL_CMD,
        Blockly.utils.KeyCodes.SHIFT,
    ]);
    const hasConfiguredKey =
        registry.getKeyCodesByShortcutName(COLLAPSE_OTHER_CATEGORIES_SHORTCUT).length > 0;

    registry.register({
        name: COLLAPSE_OTHER_CATEGORIES_SHORTCUT,
        callback: (workspace, event) => {
            const targetWorkspace = workspace.isFlyout ? workspace.targetWorkspace : workspace;
            const toolbox = targetWorkspace?.getToolbox();
            if (!(toolbox instanceof ContinuousToolbox)) return false;

            event.preventDefault();
            toolbox.collapseOtherCategories();
            return true;
        },
    });

    // 可能已经根据用户设置提前绑定键位；仅在没有配置时补充插件默认值。
    if (!hasConfiguredKey) {
        registry.addKeyMapping(keyCode, COLLAPSE_OTHER_CATEGORIES_SHORTCUT);
    }
}

/**
 * Registers the components of the continuous toolbox, replacing Blockly's
 * built-in defaults.
 */
export function registerContinuousToolbox(options: i18n['t']) {
    setContinuousToolboxControlTranslator(options);
    registerContinuousToolboxShortcuts();

    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.ToolboxCategory.registrationName,
        ContinuousCategory,
        true,
    );

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

    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.CollapsibleToolboxCategory.registrationName,
        CollapsibleContinuousCategory,
        true,
    );

    Blockly.Css.register(`
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
  `);
}
