/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IVM } from '../../types/vm';
import styles from './index.module.scss';
import Logo from '../../assets/ashIconTransparent.svg?react';
import { t } from 'i18next';
import { MenuItem, MenuDivider } from '@szhsin/react-menu';
import { useContextMenu } from '../contextMenu';
import { AllContextMenu, guiInterface } from '../../types/gui';
import { useGUIStore } from '../../stores/useGUIStore';
import {
    openMenuByMouseDown,
    openSettingsModal,
    saveCurrentProject,
    saveCurrentProjectAs,
    selectProjectThenJump,
} from '../../utils/ash-gui';
import { shortcutManager } from '../../lib/ShortcutManager';
import { SHORTCUTS } from '../../types/lib';

export const MenuTextWithShortCut = ({ text, shortcut }: { text: string; shortcut: string }) => (
    <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>{text}</span>
        <span style={{ opacity: 0.6, marginLeft: '2rem' }}>{shortcut}</span>
    </span>
);

const MenuBar = ({ vm }: { vm: IVM }): React.ReactNode => {
    const setInterface = useGUIStore(state => state.setInterface);
    const { openMenu: openFileMenu } = useContextMenu(AllContextMenu.MENUBAR_FILE, close => (
        <>
            <MenuItem
                onClick={() => {
                    setInterface(guiInterface.CREATE_PROJECT);
                }}
            >
                <MenuTextWithShortCut
                    text={t('gui:menu.new')}
                    shortcut={shortcutManager.formatHotKey(
                        shortcutManager.getHotKey(SHORTCUTS.NEW_PROJECT.id),
                    )}
                />
            </MenuItem>
            <MenuItem onClick={() => void selectProjectThenJump(vm, setInterface)}>
                <MenuTextWithShortCut
                    text={t('gui:menu.open')}
                    shortcut={shortcutManager.formatHotKey(
                        shortcutManager.getHotKey(SHORTCUTS.OPEN_PROJECT.id),
                    )}
                />
            </MenuItem>
            <MenuDivider />
            <MenuItem
                onClick={() => {
                    void saveCurrentProject(vm);
                    close();
                }}
            >
                <MenuTextWithShortCut
                    text={t('gui:menu.save')}
                    shortcut={shortcutManager.formatHotKey(
                        shortcutManager.getHotKey(SHORTCUTS.SAVE_PROJECT.id),
                    )}
                />
            </MenuItem>
            <MenuItem
                onClick={() => {
                    void saveCurrentProjectAs(vm);
                    close();
                }}
            >
                <MenuTextWithShortCut
                    text={t('gui:menu.saveAs')}
                    shortcut={shortcutManager.formatHotKey(
                        shortcutManager.getHotKey(SHORTCUTS.SAVE_PROJECT_AS.id),
                    )}
                />
            </MenuItem>
            <MenuDivider />
            <MenuItem onClick={handleOpenSettings}>
                <MenuTextWithShortCut
                    text={t('gui:menu.settings')}
                    shortcut={shortcutManager.formatHotKey(
                        shortcutManager.getHotKey(SHORTCUTS.OPEN_SETTINGS.id),
                    )}
                />
            </MenuItem>
            <MenuItem onClick={close}>
                <MenuTextWithShortCut text={t('gui:menu.exit')} shortcut='Ctrl+F4' />
            </MenuItem>
        </>
    ));

    const handleOpenSettings = () => {
        openSettingsModal();
    };

    return (
        <div className={styles.menubarContents}>
            <div className={styles.menubarContentsLeft}>
                <Logo className={styles.menubarContentLogo} />
                <div className={styles.leftUl}>
                    <button onMouseDown={openMenuByMouseDown(openFileMenu)}>
                        {t('gui:menu.file')}
                    </button>
                    <button>{t('gui:menu.edit')}</button>
                    <button>{t('gui:menu.run')}</button>
                    <button>{t('gui:menu.help')}</button>
                </div>
            </div>
            <div className={styles.menubarContentsCenter}>
                <input className={styles.search} placeholder={t('gui:search.tip')}></input>
            </div>
            <div className={styles.menubarContentsRight}>Right</div>
        </div>
    );
};

export default MenuBar;
