/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IVM } from '../../types/vm/vm';
import styles from './index.module.scss';
import Logo from '../../assets/ashIconTransparent.svg?react';
import { t } from 'i18next';
import { MenuItem, MenuDivider } from '@szhsin/react-menu';
import { useContextMenu } from '../contextMenu';
import { AllContextMenu } from '../../types/gui';
import { useTabsStore } from '../../stores/useTabsStore';
import {
    openMenuByMouseDown,
    openSettingsModal,
    saveCurrentProject,
    saveCurrentProjectAs,
    selectProjectThenJump,
} from '../../utils/ash-gui';
import { shortcutManager } from '../../lib/ShortcutManager';
import { SHORTCUTS } from '../../types/lib';
import { useQuickOpenStore } from '../../stores/useQuickOpenStore';

export const MenuTextWithShortCut = ({ text, shortcut }: { text: string; shortcut: string }) => (
    <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>{text}</span>
        <span style={{ opacity: 0.6, marginLeft: '2rem' }}>{shortcut}</span>
    </span>
);

const MenuBar = ({ vm }: { vm: IVM }): React.ReactNode => {
    const { openMenu: openFileMenu } = useContextMenu(AllContextMenu.MENUBAR_FILE, close => (
        <>
            <MenuItem
                onClick={() => {
                    useTabsStore.getState().openSpecialTab('create_project');
                }}
            >
                <MenuTextWithShortCut
                    text={t('gui:menu.new')}
                    shortcut={shortcutManager.formatHotKey(
                        shortcutManager.getHotKey(SHORTCUTS.NEW_PROJECT.id),
                    )}
                />
            </MenuItem>
            <MenuItem onClick={() => void selectProjectThenJump(vm)}>
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

    const blocklyUndo = () => {
        vm.runtime.blocks.workspaceSvg?.undo(false);
    };

    const blocklyRedo = () => {
        vm.runtime.blocks.workspaceSvg?.redo();
    };

    const { openMenu: openEditMenu } = useContextMenu(AllContextMenu.MENUBAR_EDIT, close => (
        <>
            <MenuItem
                onClick={() => {
                    blocklyUndo();
                    close();
                }}
            >
                <MenuTextWithShortCut
                    text={t('gui:menu.undo')}
                    shortcut={shortcutManager.formatHotKey(
                        shortcutManager.getHotKey(SHORTCUTS.BLOCKLY_UNDO.id),
                    )}
                />
            </MenuItem>
            <MenuItem
                onClick={() => {
                    blocklyRedo();
                    close();
                }}
            >
                <MenuTextWithShortCut
                    text={t('gui:menu.redo')}
                    shortcut={shortcutManager.formatHotKey(
                        shortcutManager.getHotKey(SHORTCUTS.BLOCKLY_REDO.id),
                    )}
                />
            </MenuItem>
        </>
    ));

    const { openMenu: openHelpMenu } = useContextMenu(AllContextMenu.MENUBAR_HELP, close => (
        <>
        {/* 帮助列表需要一个 欢迎 按钮，AEN欢迎你 */}
            <MenuItem
                onClick={() => {
                    useTabsStore.getState().openSpecialTab('welcome');
                    close();
                }}
            >
                <MenuTextWithShortCut text={t('gui:menu.welcome')} shortcut='' />
            </MenuItem>
            <MenuDivider />
            {/* 先放个关于按钮在这占位 */}
            <MenuItem onClick={close}>
                <MenuTextWithShortCut text={t('gui:menu.about')} shortcut='' />
            </MenuItem>
        </>
    ));

    return (
        <div className={styles.menubarContents}>
            <div className={styles.menubarContentsLeft}>
                <Logo className={styles.menubarContentLogo} />
                <div className={styles.leftUl}>
                    <button onMouseDown={openMenuByMouseDown(openFileMenu)}>
                        {t('gui:menu.file')}
                    </button>
                    <button onMouseDown={openMenuByMouseDown(openEditMenu)}>
                        {t('gui:menu.edit')}
                    </button>
                    <button>{t('gui:menu.run')}</button>
                    <button onMouseDown={openMenuByMouseDown(openHelpMenu)}>
                        {t('gui:menu.help')}
                    </button>
                </div>
            </div>
            <div className={styles.menubarContentsCenter}>
                {/* 占位搜索框：点击唤起 QuickOpen 面板，自身不接收输入。
                    id 供 QuickOpen 测量锚定位置使用 */}
                <input
                    id='menubar-search'
                    className={styles.search}
                    placeholder={t('gui:quickOpen.placeholder')}
                    readOnly
                    onFocus={e => {
                        e.currentTarget.blur();
                        useQuickOpenStore.getState().open();
                    }}
                />
            </div>
            <div className={styles.menubarContentsRight}>Right</div>
        </div>
    );
};

export default MenuBar;
