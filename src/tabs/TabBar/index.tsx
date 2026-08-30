/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { t } from 'i18next';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useTabsStore } from '../../stores/useTabsStore';
import CloseIcon from '../../assets/close.svg?react';
import { getTabTitle } from '../tabUtils';
import { TabIcon } from '../TabIcon';
import {
    useState,
    useCallback,
    useEffect,
    useRef,
    type MouseEvent as ReactMouseEvent,
    type DragEvent as ReactDragEvent,
} from 'react';
import { useContextMenu } from '../../gui/contextMenu';
import { AllContextMenu } from '../../types/gui';
import { MenuItem } from '@szhsin/react-menu';
import { createMenuTrigger } from '../../utils/ash-gui';

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
    const tabBarRef = useRef<HTMLDivElement>(null);
    const [whereIsInContextMenuID, setWhereIsInContextMenuID] = useState('');
    // 拖拽排序状态：当前拖拽的标签 id，以及悬停目标（在哪个标签的左侧/右侧）
    const [dragState, setDragState] = useState<{
        dragId: string;
        targetId: string | null;
        position: 'before' | 'after' | null;
    }>({ dragId: '', targetId: null, position: null });

    // 活动标签变化时横向滚动标签栏，保证其滚入可见区域
    useEffect(() => {
        if (!activeTabId || !tabBarRef.current) return;
        const el = tabBarRef.current.querySelector<HTMLElement>(
            `[data-tab-id="${CSS.escape(activeTabId)}"]`,
        );
        if (!el) return;
        const containerRect = tabBarRef.current.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        if (elRect.left < containerRect.left) {
            tabBarRef.current.scrollLeft -= containerRect.left - elRect.left;
        } else if (elRect.right > containerRect.right) {
            tabBarRef.current.scrollLeft += elRect.right - containerRect.right;
        }
    }, [activeTabId, orderedTabs.length]);

    const handleDragStart = useCallback((e: ReactDragEvent<HTMLDivElement>, tabID: string) => {
        // 从关闭按钮上发起拖拽会被忽略（避免误触发）
        if ((e.target as HTMLElement).closest('button')) {
            e.preventDefault();
            return;
        }
        // 拖拽来源需要能在浏览器中正常发起
        e.dataTransfer.setData('text/plain', tabID);
        e.dataTransfer.effectAllowed = 'move';
        setDragState(prev => ({ ...prev, dragId: tabID, targetId: null, position: null }));
    }, []);

    const handleDragOver = useCallback(
        (e: ReactDragEvent<HTMLDivElement>, tabID: string) => {
            if (!dragState.dragId || dragState.dragId === tabID) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const rect = e.currentTarget.getBoundingClientRect();
            // 以标签中线判断悬停在前半/后半 → 插入其左侧/右侧
            const position = e.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
            setDragState(prev =>
                prev.targetId === tabID && prev.position === position
                    ? prev
                    : { ...prev, targetId: tabID, position },
            );
        },
        [dragState.dragId],
    );

    const handleDrop = useCallback(
        (e: ReactDragEvent<HTMLDivElement>, tabID: string) => {
            e.preventDefault();
            const { dragId, position } = dragState;
            if (!dragId || dragId === tabID) return;
            const fromIndex = tabOrder.indexOf(dragId);
            const targetIndex = tabOrder.indexOf(tabID);
            if (fromIndex === -1 || targetIndex === -1) return;
            // 计算拖拽标签应放置的最终下标（移除自身后插入的位置）
            let toIndex = targetIndex;
            if (position === 'after') toIndex += 1;
            if (fromIndex < toIndex) toIndex -= 1;
            useTabsStore.getState().reorderTabs(fromIndex, toIndex);
        },
        [dragState, tabOrder],
    );

    const handleDragEnd = useCallback(() => {
        setDragState({ dragId: '', targetId: null, position: null });
    }, []);

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

    const handleContextMenuAction = useCallback(
        (action: 'close' | 'closeOthers' | 'closeAll') => {
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
        },
        [whereIsInContextMenuID, closeTab, closeOtherTabs, closeAllTabs],
    );

    const triggerMenu = useCallback(
        (tabID: string, point: { x: number; y: number }) => {
            setWhereIsInContextMenuID(tabID);
            openTabsMenu(point);
        },
        [openTabsMenu],
    );

    const getMenuTrigger = useCallback(
        (tabID: string) => {
            return createMenuTrigger(
                point => {
                    triggerMenu(tabID, point);
                },
                {
                    mouseButton: 2,
                    longPressDuration: 300,
                    position: 'mouse',
                },
            );
        },
        [triggerMenu],
    );

    // 鼠标左键激活，中键关闭，右键给createMenuTrigger处理
    const handleMouseDown = useCallback(
        (e: ReactMouseEvent<HTMLDivElement>, tabID: string) => {
            if (e.button === 0) {
                setActiveTab(tabID);
            } else if (e.button === 1) {
                e.preventDefault();
                closeTab(tabID);
            }
        },
        [setActiveTab, closeTab],
    );

    return (
        <div
            ref={tabBarRef}
            className={styles.tabBar}
            onDragOver={e => {
                // 条目级已 stopPropagation，这里只处理悬停在末尾空白区的情况。
                // 委托给最后一个标签（等效"追加到末尾"），让它显示右侧插入指示线。
                if (!dragState.dragId) return;
                const lastTab = orderedTabs[orderedTabs.length - 1];
                if (lastTab.id === dragState.dragId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragState(prev =>
                    prev.targetId === lastTab.id && prev.position === 'after'
                        ? prev
                        : { ...prev, targetId: lastTab.id, position: 'after' },
                );
            }}
            onDrop={e => {
                if (!dragState.dragId) return;
                e.preventDefault();
                handleDrop(e, orderedTabs[orderedTabs.length - 1].id);
                setDragState({ dragId: '', targetId: null, position: null });
            }}
        >
            {orderedTabs.map(tab => {
                const menuTrigger = getMenuTrigger(tab.id);
                return (
                    <div
                        key={tab.id}
                        data-tab-id={tab.id}
                        className={classNames(styles.tabItem, {
                            [styles.isActive]: tab.id === activeTabId,
                            [styles.isDragging]: dragState.dragId === tab.id,
                            [styles.dropBefore]:
                                dragState.targetId === tab.id && dragState.position === 'before',
                            [styles.dropAfter]:
                                dragState.targetId === tab.id && dragState.position === 'after',
                        })}
                        draggable
                        //左键中键给handleMouseDown处理，右键给menuTrigger.onMouseDown处理
                        onMouseDown={e => {
                            if (e.button === 2) {
                                menuTrigger.onMouseDown(e);
                            } else {
                                handleMouseDown(e, tab.id);
                            }
                        }}
                        onTouchStart={menuTrigger.onTouchStart}
                        onTouchMove={menuTrigger.onTouchMove}
                        onTouchEnd={menuTrigger.onTouchEnd}
                        onDragStart={e => {
                            handleDragStart(e, tab.id);
                        }}
                        onDragOver={e => {
                            e.stopPropagation();
                            handleDragOver(e, tab.id);
                        }}
                        onDrop={e => {
                            e.stopPropagation();
                            handleDrop(e, tab.id);
                        }}
                        onDragEnd={handleDragEnd}
                    >
                        <TabIcon tab={tab} className={styles.tabIcon} />
                        <span className={styles.tabTitle} title={getTabTitle(tab)}>
                            {getTabTitle(tab)}
                        </span>
                        <button
                            className={styles.closeButton}
                            title={t('gui:tab.close')}
                            onClick={e => {
                                e.stopPropagation();
                                closeTab(tab.id);
                            }}
                            onMouseDown={e => {
                                e.stopPropagation();
                            }}
                        >
                            <CloseIcon />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default TabBar;
