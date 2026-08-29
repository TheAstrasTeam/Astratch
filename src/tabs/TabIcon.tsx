/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/** @author AI */
/** @examine Cyberexplorer */

// 按标签类型渲染图标：blockly → Sprite/Module（按 mode）；内置页面标签 →
// 注册表（specialTabs）里的图标（软件 logo）。模块级组件，直接分发到静态图标组件。

import { createElement } from 'react';
import type { Tab } from '../stores/useTabsStore';
import { TargetModes } from '../types/vm/vm';
import { getSpecialTabDefinition } from './specialTabs';
import SpriteIcon from '../assets/sprite.svg?react';
import ModuleIcon from '../assets/module.svg?react';

export const TabIcon = ({ tab, className }: { tab: Tab; className?: string }): React.ReactNode => {
    if (tab.type !== 'blockly') {
        const def = getSpecialTabDefinition(tab.type);
        return createElement(def.icon, { className });
    }
    return tab.mode === TargetModes.ENTITY ? (
        <SpriteIcon className={className} />
    ) : (
        <ModuleIcon className={className} />
    );
};
