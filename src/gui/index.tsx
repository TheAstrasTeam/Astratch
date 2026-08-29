/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import i18next from 'i18next';
import type { IVM } from '../types/vm/vm';
import WorkSpace from './workspace';
// import { useState, useCallback } from 'react';
// import { localStorageIDs } from '../../utils/localstorage';
// import { languageResources } from '../i18n';

import styles from './index.module.scss';
import './public.scss';
import { useLoadingStore } from '../stores/useGUIStore';
import Loading from './loading';
import MenuBar from './menubar';
import { ContextMenuLayer } from './contextMenu';
import { shortcutManager } from '../lib/ShortcutManager';
import { SHORTCUTS } from '../types/lib';
import QuickOpen from '../tabs/QuickOpen';
import { useEffect, useState } from 'react';
import {
    openSettingsModal,
    saveCurrentProject,
    saveCurrentProjectAs,
    selectProjectThenJump,
} from '../utils/ash-gui';
import { useTabsStore } from '../stores/useTabsStore';
import { addonManager, buildAddonContext } from '../addons';

const GUI = ({ vm }: { vm: IVM }): React.ReactNode => {
    // 多数 GUI 组件直接调用 i18next.t；以 language 作为 key 可让整棵界面重新计算文本。
    const [language, setLanguage] = useState(i18next.language);
    const isLoading: boolean = useLoadingStore(state => state.loading);

    useEffect(() => {
        const handleLanguageChanged = (nextLanguage: string) => {
            setLanguage(nextLanguage);
        };

        i18next.on('languageChanged', handleLanguageChanged);
        return () => {
            i18next.off('languageChanged', handleLanguageChanged);
        };
    }, []);

    useEffect(() => {
        void addonManager.init(buildAddonContext(vm));
    }, [vm]);

    useEffect(() => {
        // 全局禁用浏览器默认右键菜单，有些时候莫名其妙弹出浏览器右键菜单很让人绝望你知道吗
        const handleContextMenu = (event: MouseEvent) => {
            const target = event.target as Element | null;
            const editable = target?.closest(
                'input, textarea, select, [contenteditable="true"]',
            );
            if (editable) return;
            event.preventDefault();
        };
        document.addEventListener('contextmenu', handleContextMenu);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);

    useEffect(() => {
        const unbindShortcutCommands = shortcutManager.bindCommands({
            [SHORTCUTS.SAVE_PROJECT.id]: () => saveCurrentProject(vm),
            [SHORTCUTS.SAVE_PROJECT_AS.id]: () => saveCurrentProjectAs(vm),
            [SHORTCUTS.NEW_PROJECT.id]: () => {
                useTabsStore.getState().openSpecialTab('create_project');
            },
            [SHORTCUTS.OPEN_PROJECT.id]: () => selectProjectThenJump(vm),
            [SHORTCUTS.OPEN_SETTINGS.id]: () => {
                openSettingsModal();
            },
        });

        return () => {
            unbindShortcutCommands();
        };
    }, [vm]);

    return (
        <div key={language} className={styles.app}>
            <MenuBar vm={vm} />
            {isLoading && <Loading />}
            <div className={styles.workspaceArea}>
                <WorkSpace vm={vm} />
            </div>
            <ContextMenuLayer />
            <QuickOpen vm={vm} />
        </div>
    );
};

export default GUI;
