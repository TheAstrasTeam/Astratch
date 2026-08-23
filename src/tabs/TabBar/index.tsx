import { t } from 'i18next';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useTabsStore } from '../../stores/useTabsStore';
import { TargetModes } from '../../types/vm';
import CloseIcon from '../../assets/close.svg?react';
import SpriteIcon from '../../assets/sprite.svg?react';
import ModuleIcon from '../../assets/module.svg?react';
import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useContextMenu } from '../../gui/contextMenu';
import { AllContextMenu } from '../../types/gui';
import { MenuItem } from '@szhsin/react-menu';
import { openMenuByMouseDown } from '../../utils/ash-gui';

const TabBar = (): React.ReactNode => {
    const tabs = useTabsStore(state => state.tabs);
    const tabOrder = useTabsStore(state => state.tabOrder);
    const activeTabId = useTabsStore(state => state.activeTabId);
    const setActiveTab = useTabsStore(state => state.setActiveTab);
    const closeTab = useTabsStore(state => state.closeTab);
    const closeOtherTabs = useTabsStore(state => state.closeOtherTabs);
    const closeAllTabs = useTabsStore(state => state.closeAllTabs);
    const orderedTabs = tabOrder
        .map(id => tabs.find(tab => tab.id === id))
        .filter((tab): tab is NonNullable<typeof tab> => tab !== undefined);
    const [whereIsInContextMenuID, setWhereIsInContextMenuID] = useState('');

    const { openMenu: openTabsMenu } = useContextMenu(AllContextMenu.TABS_EDIT, () => {
        return (
            <>
                <MenuItem
                    onClick={() => {
                        handleContextMenuAction('close');
                    }}
                >
                    {t('gui:tab.close')}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleContextMenuAction('closeOthers');
                    }}
                >
                    {t('gui:tab.closeOthers')}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleContextMenuAction('closeAll');
                    }}
                >
                    {t('gui:tab.closeAll')}
                </MenuItem>
            </>
        );
    });

    const handleContextMenuAction = (action: 'close' | 'closeOthers' | 'closeAll') => {
        if (!whereIsInContextMenuID) return;
        switch (action) {
            case 'close':
                closeTab(whereIsInContextMenuID);
                break;
            case 'closeOthers':
                closeOtherTabs(whereIsInContextMenuID);
                break;
            case 'closeAll':
                closeAllTabs();
                break;
        }
    };

    const handleClick = (e: ReactMouseEvent<HTMLDivElement>, tabID: string) => {
        if (e.button === 0) {
            setActiveTab(tabID);
        } else if (e.button === 1) {
            e.preventDefault();
            closeTab(tabID);
        } else if (e.button === 2) {
            setWhereIsInContextMenuID(tabID);
        }
    };

    return (
        <div className={styles.tabBar}>
            {orderedTabs.map(tab => (
                <div
                    key={tab.id}
                    className={classNames(styles.tabItem, {
                        [styles.isActive]: tab.id === activeTabId,
                    })}
                    onContextMenu={openMenuByMouseDown(openTabsMenu, 2, 'mouse')}
                    onMouseDown={(e) => {handleClick(e, tab.id)}}
                >
                    {tab.mode === TargetModes.ENTITY ? (
                        <SpriteIcon className={styles.tabIcon} />
                    ) : (
                        <ModuleIcon className={styles.tabIcon} />
                    )}
                    <span className={styles.tabTitle} title={tab.title}>
                        {tab.title}
                    </span>
                    <button
                        className={styles.closeButton}
                        title={t('gui:tab.close')}
                        onClick={e => {
                            e.stopPropagation();
                            closeTab(tab.id);
                        }}
                    >
                        <CloseIcon />
                    </button>
                </div>
            ))}
        </div>
    );
};
export default TabBar;
