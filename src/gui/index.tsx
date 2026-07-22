// import i18next from 'i18next';
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
import { setupBlocklyAdapter } from '../lib/BlocklyAdapter';
import { ALL_SHORTCUTS_IDS } from '../types/lib';
import { useEffect } from 'react';
import { guiInterface } from '../types/gui';
import { selectProjectThenJump } from '../utils/ash-gui';
import * as Blockly from 'blockly';

const GUI = ({ vm }: { vm: IVM }): React.ReactNode => {
    const isLoading: boolean = useLoadingStore(state => state.loading);
    const setInterface = useGUIStore(state => state.setInterface);
    useEffect(() => {
        const teardownBlocklyAdapter = setupBlocklyAdapter(Blockly);

        const unregisterSave = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.SAVE_PROJECT,
            scope: 'global',
            command: () => vm.saveProject(),
        });

        const unregisterNew = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.NEW_PROJECT,
            scope: 'global',
            command: () => {
                setInterface(guiInterface.CREATE_PROJECT);
            },
        });

        const unregisterOpen = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.OPEN_PROJECT,
            scope: 'global',
            command: () => selectProjectThenJump(vm, setInterface),
        });

        const unregisterBlocklyCopy = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.BLOCKLY_COPY,
            scope: 'blockly',
        });
        const unregisterBlocklyCut = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.BLOCKLY_CUT,
            scope: 'blockly',
        });
        const unregisterBlocklyPaste = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.BLOCKLY_PASTE,
            scope: 'blockly',
        });
        const unregisterBlocklyUndo = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.BLOCKLY_UNDO,
            scope: 'blockly',
        });
        const unregisterBlocklyRedo = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.BLOCKLY_REDO,
            scope: 'blockly',
        });
        const unregisterBlocklyDuplicate = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.BLOCKLY_DUPLICATE,
            scope: 'blockly',
        });
        const unregisterBlocklyCleanup = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.BLOCKLY_CLEANUP,
            scope: 'blockly',
        });
        const unregisterBlocklyDisconnect = shortcutManager.register({
            id: ALL_SHORTCUTS_IDS.BLOCKLY_DISCONNECT,
            scope: 'blockly',
        });

        return () => {
            unregisterSave();
            unregisterNew();
            unregisterOpen();
            unregisterBlocklyCopy();
            unregisterBlocklyCut();
            unregisterBlocklyPaste();
            unregisterBlocklyUndo();
            unregisterBlocklyRedo();
            unregisterBlocklyDuplicate();
            unregisterBlocklyCleanup();
            unregisterBlocklyDisconnect();
            teardownBlocklyAdapter();
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
