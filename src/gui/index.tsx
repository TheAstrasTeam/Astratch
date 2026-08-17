/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import i18next from 'i18next';
import type { IVM } from '../types/vm';
import WorkSpace from './workspace';
// import { useState, useCallback } from 'react';
// import { localStorageIDs } from '../../utils/localstorage';
// import { languageResources } from '../i18n';

import styles from './index.module.scss';
import './public.scss';
import { useGUIStore, useLoadingStore } from '../stores/useGUIStore';
import Loading from './loading';
import MenuBar from './menubar';
import { ContextMenuLayer } from './contextMenu';
import { shortcutManager } from '../lib/ShortcutManager';
import { SHORTCUTS } from '../types/lib';
import { useEffect, useState } from 'react';
import { guiInterface } from '../types/gui';
import { saveCurrentProject, saveCurrentProjectAs, selectProjectThenJump } from '../utils/ash-gui';

const GUI = ({ vm }: { vm: IVM }): React.ReactNode => {
    // 多数 GUI 组件直接调用 i18next.t；以 language 作为 key 可让整棵界面重新计算文本。
    const [language, setLanguage] = useState(i18next.language);
    const isLoading: boolean = useLoadingStore(state => state.loading);
    const setInterface = useGUIStore(state => state.setInterface);

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
        const unbindShortcutCommands = shortcutManager.bindCommands({
            [SHORTCUTS.SAVE_PROJECT.id]: () => saveCurrentProject(vm),
            [SHORTCUTS.SAVE_PROJECT_AS.id]: () => saveCurrentProjectAs(vm),
            [SHORTCUTS.NEW_PROJECT.id]: () => {
                setInterface(guiInterface.CREATE_PROJECT);
            },
            [SHORTCUTS.OPEN_PROJECT.id]: () => selectProjectThenJump(vm, setInterface),
        });

        return () => {
            unbindShortcutCommands();
        };
    }, [vm, setInterface]);

    return (
        <div key={language} className={styles.app}>
            <MenuBar vm={vm} />
            {isLoading && <Loading />}
            <div className={styles.workspaceArea}>
                <WorkSpace vm={vm} />
            </div>
            <ContextMenuLayer />
        </div>
    );
};

export default GUI;
