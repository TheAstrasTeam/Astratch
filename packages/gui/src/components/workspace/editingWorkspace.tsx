import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { tabsManager, type ITabGroup } from '../../lib/TabsManager';
import { SplitPanel } from '../splitPanel';
import styles from './index.module.scss';
import classNames from 'classnames';
import { MenuHeader, MenuItem } from '@szhsin/react-menu';
import { t } from 'astratch-i18n';

import EmptyIcon from '@as/empty.svg?react';
import Empty2Icon from '@as/empty2.svg?react';
import CloseIcon from '@as/close.svg?react';
import { Box } from '../box';

export const EditingWorkspace = () => {
    const [updateTimes, setUpdateTimes] = useState(0);
    const [isRenderElementsName, setRenderElementsName] = useState(false);
    const [elementCoverLayout, setElementCoverLayout] = useState<null | {
        groupID: string;
        pos: 'first' | 'second';
        text: string;
        direction: 'left' | 'right' | 'top' | 'bottom' | 'center';
    }>(null);
    const draggingState = useRef<{
        groupID: string;
        pos: 'first' | 'second';
    }>(null);

    useEffect(() => {
        const update = () => {
            setUpdateTimes(v => v + 1);
        };
        const EVENTS = [
            'ADD_GROUP',
            'DELETE_GROUP',
            'SET_WATCHING_GROUP',
            'SET_FOCUSING_GROUP',
            'HIDE_SECOND_ELEMENT',
        ] as const;
        for (const event of EVENTS) tabsManager.off(event, update);
        for (const event of EVENTS) tabsManager.on(event, update);
        return () => {
            for (const event of EVENTS) tabsManager.off(event, update);
        };
    }, []);

    const isFocusing = (id: string, pos: 'first' | 'second') =>
        tabsManager.focusingGroup === id && tabsManager.focusingPos === pos;

    const renderWorkspace = (id = tabsManager.watchingGroup): ReactNode => {
        if (!id) return;
        const group = tabsManager.getGroup(id);
        if (!group) return;

        const renderPanel = (slot: ITabGroup['firstElement'], pos: 'first' | 'second') => {
            const focusing = isFocusing(group.id, pos);
            return (
                <div
                    onClick={e => {
                        e.stopPropagation();
                        // 已经聚焦时不再触发事件，否则会白白重渲染整棵树
                        if (isFocusing(group.id, pos)) return;
                        tabsManager.setFocusingGroup(group.id, pos);
                    }}
                    className={classNames(styles.watchingGroup, {
                        [styles.isFocusing]: focusing,
                    })}
                    onDrop={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!draggingState.current) return;

                        if (
                            draggingState.current.groupID === group.id &&
                            draggingState.current.pos === pos
                        )
                            return;
                        const posToFocusElement =
                            pos === 'first' ? 'firstElement' : 'secondElement';
                        const posToDragElement =
                            draggingState.current.pos === 'first'
                                ? 'firstElement'
                                : 'secondElement';
                        /** 拖动到的元素 */
                        const focusElement = tabsManager.getGroup(id)![posToFocusElement]!;
                        /** 被拖动的位置 */
                        const dragElement = tabsManager.getGroup(draggingState.current.groupID)![
                            posToDragElement
                        ]!;
                        switch (elementCoverLayout?.direction) {
                            case 'center': {
                                // 目标是组时没有可互换的对象
                                if (typeof focusElement === 'string') break;
                                // 互换
                                tabsManager.addAndReplaceGroup(group.id, {
                                    ...tabsManager.getGroup(id)!,
                                    [posToFocusElement]: dragElement,
                                });
                                tabsManager.addAndReplaceGroup(draggingState.current.groupID, {
                                    ...tabsManager.getGroup(draggingState.current.groupID)!,
                                    [posToDragElement]: focusElement,
                                });
                                break;
                            }
                            case 'top': {
                                // 在对应组添加并替换新组
                                const resultID = tabsManager.addGroup({
                                    firstElement: dragElement,
                                    secondElement: focusElement,
                                    direction: 'vertical',
                                    parent: id,
                                });
                                tabsManager.addAndReplaceGroup(id, {
                                    ...tabsManager.getGroup(id)!,
                                    [posToFocusElement]: resultID.id,
                                });
                                tabsManager.deleteElementOfGroup(
                                    draggingState.current.groupID,
                                    draggingState.current.pos,
                                );
                                break;
                            }
                            case 'bottom': {
                                // 在对应组添加并替换新组
                                const resultID = tabsManager.addGroup({
                                    firstElement: focusElement,
                                    secondElement: dragElement,
                                    direction: 'vertical',
                                    parent: id,
                                });
                                tabsManager.addAndReplaceGroup(id, {
                                    ...tabsManager.getGroup(id)!,
                                    [posToFocusElement]: resultID.id,
                                });
                                tabsManager.deleteElementOfGroup(
                                    draggingState.current.groupID,
                                    draggingState.current.pos,
                                );
                                break;
                            }
                            case 'left': {
                                // 在对应组添加并替换新组
                                const resultID = tabsManager.addGroup({
                                    firstElement: dragElement,
                                    secondElement: focusElement,
                                    direction: 'horizontal',
                                    parent: id,
                                });
                                tabsManager.addAndReplaceGroup(id, {
                                    ...tabsManager.getGroup(id)!,
                                    [posToFocusElement]: resultID.id,
                                });
                                tabsManager.deleteElementOfGroup(
                                    draggingState.current.groupID,
                                    draggingState.current.pos,
                                );
                                break;
                            }
                            case 'right': {
                                // 在对应组添加并替换新组
                                const resultID = tabsManager.addGroup({
                                    firstElement: focusElement,
                                    secondElement: dragElement,
                                    direction: 'horizontal',
                                    parent: id,
                                });
                                tabsManager.addAndReplaceGroup(id, {
                                    ...tabsManager.getGroup(id)!,
                                    [posToFocusElement]: resultID.id,
                                });
                                tabsManager.deleteElementOfGroup(
                                    draggingState.current.groupID,
                                    draggingState.current.pos,
                                );
                                break;
                            }
                        }
                        draggingState.current = null;
                        setElementCoverLayout(null);
                        tabsManager.sweepGroup();
                    }}
                    onDragOver={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!draggingState.current) return;
                        if (
                            draggingState.current.groupID === group.id &&
                            draggingState.current.pos === pos
                        )
                            setElementCoverLayout(null);
                        else {
                            const position = e.currentTarget.getBoundingClientRect();
                            const [x, y] = [e.clientX - position.left, e.clientY - position.top];
                            let direction: 'left' | 'right' | 'top' | 'bottom' | 'center';
                            if (y <= position.height / 3) direction = 'top';
                            // a-a/3 => a(1-1/3) => 2/3 * a
                            else if (y >= (2 / 3) * position.height) direction = 'bottom';
                            else if (x <= position.width / 3) direction = 'left';
                            else if (x >= (2 / 3) * position.width) direction = 'right';
                            else direction = 'center';
                            setElementCoverLayout({
                                groupID: group.id,
                                pos,
                                text: t('gui:workspace.drag.tip'),
                                direction,
                            });
                        }
                    }}
                >
                    {typeof slot === 'string' ? (
                        renderWorkspace(slot)
                    ) : (
                        <>
                            <slot.Renderer id={group.id} pos={pos} />
                            <div
                                className={styles.groupElementName}
                                style={{
                                    opacity: isRenderElementsName ? '1' : '0',
                                    pointerEvents: isRenderElementsName ? 'all' : 'none',
                                    borderColor: focusing ? 'var(--accent-primary)' : 'transparent',
                                }}
                                draggable
                                onDragStart={e => {
                                    setElementCoverLayout(null);
                                    draggingState.current = { groupID: group.id, pos };
                                    e.dataTransfer.effectAllowed = 'move';
                                    e.dataTransfer.setData('text/plain', slot.name);
                                }}
                                onDragEnd={() => {
                                    setElementCoverLayout(null);
                                }}
                            >
                                <span>{slot.name}</span>
                                <Box
                                    tip={t('gui:workspace.closeElement.tip', { title: slot.name })}
                                    tipPosition='dom'
                                >
                                    <button
                                        onClick={() => {
                                            tabsManager.deleteElementOfGroup(id, pos);
                                        }}
                                    >
                                        <CloseIcon />
                                    </button>
                                </Box>
                            </div>
                            {elementCoverLayout?.groupID === group.id &&
                                elementCoverLayout.pos === pos && (
                                    <div
                                        className={classNames(styles.coverLayout, {
                                            [styles.left]: elementCoverLayout.direction === 'left',
                                            [styles.right]:
                                                elementCoverLayout.direction === 'right',
                                            [styles.top]: elementCoverLayout.direction === 'top',
                                            [styles.bottom]:
                                                elementCoverLayout.direction === 'bottom',
                                            [styles.center]:
                                                elementCoverLayout.direction === 'center',
                                        })}
                                    >
                                        <span>{elementCoverLayout.text}</span>
                                    </div>
                                )}
                        </>
                    )}
                </div>
            );
        };

        if (!group.secondElement || !group._showSecondElement)
            return renderPanel(group.firstElement, 'first');

        const buildContextMenu = () => (
            <>
                <MenuHeader>{t('gui:workspace.panel.name')}</MenuHeader>
                <MenuItem
                    onClick={() => {
                        tabsManager.addAndReplaceGroup(id, {
                            ...group,
                            firstElement: group.secondElement!,
                            secondElement: group.firstElement,
                        });
                    }}
                >
                    {t('gui:workspace.swapPanel.name')}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        tabsManager.deleteElementOfGroup(id, 'first');
                    }}
                >
                    {group.direction === 'horizontal'
                        ? t('gui:workspace.closeLeftPanel.name')
                        : t('gui:workspace.closeTopPanel.name')}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        tabsManager.deleteElementOfGroup(id, 'second');
                    }}
                >
                    {group.direction === 'horizontal'
                        ? t('gui:workspace.closeRightPanel.name')
                        : t('gui:workspace.closeBottomPanel.name')}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        tabsManager.addAndReplaceGroup(id, {
                            ...group,
                            direction: group.direction === 'horizontal' ? 'vertical' : 'horizontal',
                        });
                    }}
                >
                    {t('gui:workspace.switchDirection.name')}(
                    {group.direction === 'horizontal' ? '↕' : '↔'})
                </MenuItem>
            </>
        );
        return (
            <SplitPanel
                direction={group.direction}
                FirstElement={renderPanel(group.firstElement, 'first')}
                SecondElement={renderPanel(group.secondElement, 'second')}
                hideElement='both'
                minFirstElementSize={group.minFirstElementSize}
                minSecondElementSize={group.minSecondElementSize}
                /** 0 表示未指定，交给 SplitPanel 使用默认值 */
                defaultSize={group.defaultSize || undefined}
                contextMenu={buildContextMenu}
            />
        );
    };

    /** revision 只用于让 React Compiler 的 JSX 缓存失效，否则事件触发后界面不会更新 */
    const renderTree = (_revision: number): ReactNode => renderWorkspace();

    /** 为组中元素名渲染提示 */
    const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Alt') return;
        e.preventDefault();
        setRenderElementsName(e.altKey);
    };

    const EmptyImage =
        // eslint-disable-next-line react-hooks/purity
        Math.random() > 0.5 ? (
            <EmptyIcon className={styles.emptyIcon} />
        ) : (
            <Empty2Icon className={styles.emptyIcon} />
        );

    return (
        <div
            className={styles.workspace}
            onKeyDown={handleKey}
            onKeyUp={handleKey}
            onBlur={() => {
                setRenderElementsName(false);
            }}
            tabIndex={-1}
        >
            {
                // eslint-disable-next-line react-hooks/refs
                renderTree(updateTimes) ?? (
                    <div className={styles.emptyPage}>
                        {EmptyImage}
                        <span className={styles.emptyTip}>{t('gui:workspace.empty.tip')}</span>
                    </div>
                )
            }
        </div>
    );
};
