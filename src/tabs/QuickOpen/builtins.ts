/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// QuickOpen 的内置命令列表（静态，不进命令注册表）。
// 标题使用 i18n key；插件的动态命令经 useQuickOpenCommandsStore 合并展示。

import type { IQuickOpenCommand } from '../../types/gui';
import { allBuiltInTabs } from '../../types/vm/vm';
import { useSidebarStore } from '../../stores/useSidebarStore';
import { useTabsStore } from '../../stores/useTabsStore';
import {
    openSettingsModal,
    saveCurrentProject,
    saveCurrentProjectAs,
    selectProjectThenJump,
} from '../../utils/ash-gui';

export const builtinCommands: readonly IQuickOpenCommand[] = [
    {
        id: 'builtin.newProject',
        title: 'gui:menu.new',
        keywords: 'new create',
        run: () => {
            useTabsStore.getState().openSpecialTab('create_project');
        },
    },
    {
        id: 'builtin.openProject',
        title: 'gui:menu.open',
        keywords: 'open load',
        run: vm => void selectProjectThenJump(vm),
    },
    {
        id: 'builtin.saveProject',
        title: 'gui:menu.save',
        keywords: 'save store',
        run: vm => void saveCurrentProject(vm),
    },
    {
        id: 'builtin.saveProjectAs',
        title: 'gui:menu.saveAs',
        keywords: 'save as export',
        run: vm => void saveCurrentProjectAs(vm),
    },
    {
        id: 'builtin.welcome',
        title: 'gui:menu.welcome',
        keywords: 'home welcome start',
        run: () => {
            useTabsStore.getState().openSpecialTab('welcome');
        },
    },
    {
        id: 'builtin.settings',
        title: 'gui:menu.settings',
        keywords: 'settings preferences options',
        run: () => {
            openSettingsModal();
        },
    },
    {
        id: 'builtin.panelTargets',
        title: 'gui:quickOpen.panel.targets',
        keywords: 'targets sidebar panel',
        run: () => {
            useSidebarStore.getState().select(allBuiltInTabs.TARGETS);
        },
    },
    {
        id: 'builtin.panelAddons',
        title: 'gui:quickOpen.panel.addons',
        keywords: 'addons extensions sidebar panel',
        run: () => {
            useSidebarStore.getState().select(allBuiltInTabs.ADDONS);
        },
    },
    {
        id: 'builtin.panelDebug',
        title: 'gui:quickOpen.panel.debug',
        keywords: 'debug debugger sidebar panel',
        run: () => {
            useSidebarStore.getState().select(allBuiltInTabs.DEBUG);
        },
    },
];
