import { t } from 'i18next';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useTabsStore } from '../../stores/useTabsStore';
import { TargetModes } from '../../types/vm';
import CloseIcon from '../../assets/close.svg?react';
import SpriteIcon from '../../assets/sprite.svg?react';
import ModuleIcon from '../../assets/module.svg?react';
import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react'; 

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
    const [menuState, setMenuState] = useState<{
        visible:boolean;
        x:number;
        y:number;
        tabId:string|null;
    }>({
        visible:false,
        x:0,
        y:0,
        tabId: null,
    });
    const contextMenuRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = (e: ReactMouseEvent<HTMLDivElement>, tabId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuState({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            tabId: tabId,
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setMenuState(prevState => ({ ...prevState, visible: false }));
            }
        };
    //滚动也关闭
        const handleScroll = () => {
            setMenuState(prevState => ({ ...prevState, visible: false }));
        };
        if (menuState.visible) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [menuState.visible]);



    //电击
    const handleContextMenuAction = (action: 'close' | 'closeOthers' | 'closeAll') => {
        const tabId = menuState.tabId;
        if (!tabId) return;
        switch (action) {
            case 'close':
                closeTab(tabId);
                break;
            case 'closeOthers':
                closeOtherTabs(tabId);
                break;
            case 'closeAll':
                closeAllTabs();
                break;
        }
        
        setMenuState(prevState => ({ ...prevState, visible: false }));
    };

    return (
        <div className={styles.tabBar}>
            {orderedTabs.map(tab => (
                <div
                    key={tab.id}
                    className={classNames(styles.tabItem, {
                        [styles.isActive]: tab.id === activeTabId,
                    })}
                    onContextMenu={(e: ReactMouseEvent<HTMLDivElement>) => handleContextMenu(e, tab.id)}
                    onClick={() => {
                        setActiveTab(tab.id);
                    }}
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
            {menuState.visible && menuState.tabId && (
                <div
                    ref={contextMenuRef}
                    className={styles.contextMenu}
                    style={{
                        position: 'fixed',
                        top: menuState.y,
                        left: menuState.x,
                        zIndex: 114514,
                    }}
                >
                    <button onClick={() => handleContextMenuAction('close')}>{t('gui:tab.close')}</button>
                    <button onClick={() => handleContextMenuAction('closeOthers')}>{t('gui:tab.closeOthers')}</button>
                    <button onClick={() => handleContextMenuAction('closeAll')}>{t('gui:tab.closeAll')}</button>
                </div>
            )}
        </div>
    );
}
export default TabBar;

