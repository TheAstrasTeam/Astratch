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
import { SHORTCUTS } from '../types/lib';
import { useEffect } from 'react';
import { guiInterface } from '../types/gui';
import { selectProjectThenJump } from '../utils/ash-gui';
import * as Blockly from 'blockly';

const GUI = ({ vm }: { vm: IVM }): React.ReactNode => {
    const isLoading: boolean = useLoadingStore(state => state.loading);
    const setInterface = useGUIStore(state => state.setInterface);
    useEffect(() => {
        const teardownBlocklyAdapter = setupBlocklyAdapter(Blockly);

        const unbindShortcutCommands = shortcutManager.bindCommands({
            [SHORTCUTS.SAVE_PROJECT.id]: () => vm.saveProject(),
            [SHORTCUTS.NEW_PROJECT.id]: () => {
                setInterface(guiInterface.CREATE_PROJECT);
            },
            [SHORTCUTS.OPEN_PROJECT.id]: () => selectProjectThenJump(vm, setInterface),
        });

        return () => {
            unbindShortcutCommands();
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
