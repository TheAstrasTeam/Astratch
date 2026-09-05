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

// 拖拽幽灵标签，和VSCode类似
const DRAG_IMAGE_X_OFFSET = 8;

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
    // 拖拽排序状态：当前拖拽的标签 id、悬停目标（在哪个标签的左侧/右侧）
    const [dragState, setDragState] = useState<{
        dragId: string;
        targetId: string | null;
        position: 'before' | 'after' | null;
    }>({ dragId: '', targetId: null, position: null });

    // 拖动期间阻止浏览器的猎奇行为，为什么你要一直显示禁止图标
    useEffect(() => {
        if (!dragState.dragId) return;
        const onWindowDragOver = (e: DragEvent) => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        };
        const onWindowDrop = (e: DragEvent) => {
            e.preventDefault();
        };
        window.addEventListener('dragover', onWindowDragOver);
        window.addEventListener('drop', onWindowDrop);
        return () => {
            window.removeEventListener('dragover', onWindowDragOver);
            window.removeEventListener('drop', onWindowDrop);
        };
    }, [dragState.dragId]);

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

    const handleDragStart = useCallback(
        (e: ReactDragEvent<HTMLDivElement>, tabID: string) => {
            // 从关闭按钮上发起拖拽会被忽略
            if ((e.target as HTMLElement).closest('button')) {
                e.preventDefault();
                return;
            }
            // 拖拽来源需要能在浏览器中正常发起
            e.dataTransfer.setData('text/plain', tabID);
            e.dataTransfer.effectAllowed = 'move';
            // 拖拽幽灵吸附鼠标
            e.dataTransfer.setDragImage(
                e.currentTarget,
                DRAG_IMAGE_X_OFFSET,
                e.currentTarget.getBoundingClientRect().height / 2,
            );
            setDragState(() => ({ dragId: tabID, targetId: null, position: null }));
        },
        [setDragState],
    );

    // 计算鼠标位置最近的插入间隙：遍历所有标签边界
    const computeDropPosition = useCallback(
        (clientX: number): { targetId: string; position: 'before' | 'after' } | null => {
            const bar = tabBarRef.current;
            if (!bar || orderedTabs.length === 0) return null;
            let best: { targetId: string; position: 'before' | 'after' } | null = null;
            let bestDist = Number.POSITIVE_INFINITY;
            for (let i = 0; i < orderedTabs.length; i++) {
                const el = bar.querySelector<HTMLElement>(
                    `[data-tab-id="${CSS.escape(orderedTabs[i].id)}"]`,
                );
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                const distLeft = Math.abs(clientX - rect.left);
                if (distLeft < bestDist) {
                    bestDist = distLeft;
                    best = { targetId: orderedTabs[i].id, position: 'before' };
                }
                if (i === orderedTabs.length - 1) {
                    const distRight = Math.abs(clientX - rect.right);
                    if (distRight < bestDist) {
                        bestDist = distRight;
                        best = { targetId: orderedTabs[i].id, position: 'after' };
                    }
                }
            }
            return best;
        },
        [orderedTabs],
    );

    const handleDrop = useCallback(
        (e: ReactDragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const { dragId, targetId, position } = dragState;
            if (!dragId || !targetId) return;
            const fromIndex = tabOrder.indexOf(dragId);
            const targetIndex = tabOrder.indexOf(targetId);
            if (fromIndex === -1 || targetIndex === -1) return;
            // 计算拖拽标签应放置的最终下标（移除自身后插入的位置）。
            // 目标即自身时（吸附到自身相邻间隙）补偿后为 no-op。
            let toIndex = targetIndex;
            if (position === 'after') toIndex += 1;
            if (fromIndex < toIndex) toIndex -= 1;
            useTabsStore.getState().reorderTabs(fromIndex, toIndex);
        },
        [dragState, tabOrder],
    );

    const handleDragEnd = useCallback(() => {
        setDragState({ dragId: '', targetId: null, position: null });
    }, [setDragState]);

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
        [openTabsMenu, setWhereIsInContextMenuID],
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
                // 全局按鼠标位置计算最近的插入间隙（见 computeDropPosition）
                if (!dragState.dragId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const target = computeDropPosition(e.clientX);
                setDragState(prev => {
                    const nextTargetId = target !== null ? target.targetId : prev.targetId;
                    const nextPosition = target !== null ? target.position : prev.position;
                    if (prev.targetId === nextTargetId && prev.position === nextPosition) {
                        return prev;
                    }
                    return { ...prev, targetId: nextTargetId, position: nextPosition };
                });
            }}
            onDrop={e => {
                if (!dragState.dragId) return;
                handleDrop(e);
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
