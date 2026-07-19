// import i18next from 'i18next';
import type { IVM } from '../types/vm';
import WorkSpace from './workspace';
// import { useState, useCallback } from 'react';
// import { localStorageIDs } from '../../utils/localstorage';
// import { languageResources } from '../../i18n';

import styles from './index.module.scss';
import './public.scss';
import { useGUIStore, useLoadingStore } from '../stores/useGUIStore';
import Loading from './loading';
import MenuBar from './menubar';
import { ContextMenuLayer } from './contextMenu';
import { shortcutManager } from '../lib/ShortcutManager';
import { ALL_SHORTCUTS_IDS } from '../types/lib';
import { useEffect } from 'react';
import { guiInterface } from '../types/gui';
import { selectProjectThenJump } from '../utils/ash-gui';

const GUI = ({ vm }: { vm: IVM }): React.ReactNode => {
    const isLoading: boolean = useLoadingStore(state => state.loading);
    const setInterface = useGUIStore(state => state.setInterface);
    useEffect(() => {
        const unregisterSave = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.SAVE_PROJECT,
            command: () => vm.saveProject(),
        });

        const unregisterNew = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.NEW_PROJECT,
            command: () => {
                setInterface(guiInterface.CREATE_PROJECT);
            },
        });

        const unregisterOpen = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.OPEN_PROJECT,
            command: () => selectProjectThenJump(vm, setInterface),
        });

        return () => {
            unregisterSave();
            unregisterNew();
            unregisterOpen();
        };
    }, [vm, setInterface]);

    return (
        <div className={styles.app}>
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
