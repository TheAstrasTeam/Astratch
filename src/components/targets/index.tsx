/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { IVM, TTargetMode, TTargetTree, TTargetTreeNode } from '../../types/vm/vm';
import styles from './index.module.scss';
import classNames from 'classnames';

import ExpandIcon from '../../assets/chevronRight.svg?react';
import RemoveIcon from '../../assets/remove.svg?react';
import AddIcon from '../../assets/add.svg?react';
import FolderIcon from '../../assets/addFolder.svg?react';
import RenameIcon from '../../assets/rename.svg?react';

import { modal } from '../Modal/modal';
import { ConfirmModal } from '../modal_confirm';
import { t } from 'i18next';
import { useContextMenu } from '../../gui/contextMenu';
import { AllContextMenu } from '../../types/gui';
import { MenuItem } from '@szhsin/react-menu';
import { openMenuByMouseDown } from '../../utils/ash-gui';
import { PromptModal } from '../modal_prompt';

// 部分拖动代码由AI生成

/** 鼠标移动超过该像素数才判定为"拖动"，否则视为点击 */
const DRAG_THRESHOLD = 5;
/** 拖动浮层相对光标的偏移，避免浮层文字挡住鼠标 */
const OVERLAY_OFFSET = 8;

interface IDragItem {
    id: string;
    name: string;
    type: 'target' | 'folder';
}

/**
 * 按关键词过滤 targets 树。
 * 文件夹仅当自身匹配或包含匹配的子节点时保留。
 */
const filterTargetsTree = (targets: TTargetTree, query: string): TTargetTree => {
    const q = query.trim().toLowerCase();
    if (!q) return targets;

    const result: TTargetTree = [];
    for (const node of targets) {
        if ('children' in node) {
            // 文件夹节点
            const children = filterTargetsTree(node.children, q);
            if (children.length > 0 || node.name.toLowerCase().includes(q)) {
                // 保留原型，避免过滤后树节点丢失方法
                const copy = node.cloneAsNode() as TTargetTreeNode;
                copy.children = children;
                result.push(copy);
            }
        } else if (node.name.toLowerCase().includes(q)) {
            // 目标节点
            result.push(node);
        }
    }
    return result;
};

/**
 * 收集某个文件夹在树中的全部子孙文件夹 id。
 * 拖动文件夹时，它的子孙不能作为放置目标（否则会成环）。
 */
const collectFolderDescendants = (
    nodes: TTargetTree,
    folderId: string,
    result: Set<string> = new Set(),
): Set<string> => {
    for (const node of nodes) {
        if ('children' in node) {
            if (node.id === folderId) {
                const walk = (children: TTargetTree) => {
                    for (const child of children) {
                        if ('children' in child) {
                            result.add(child.id);
                            walk(child.children);
                        }
                    }
                };
                walk(node.children);
            } else {
                collectFolderDescendants(node.children, folderId, result);
            }
        }
    }
    return result;
};

const GenerateFoldersAndTargets = ({
    target,
    expandedFolders,
    toggleFolder,
    selected,
    vm,
    mode,
    forceExpand = false,
    onAdd,
    onAddFolder,
    onItemMouseDown,
    dropFolderId,
    draggingItemId,
}: {
    target: TTargetTree[number];
    expandedFolders: Set<string>;
    toggleFolder: (id: string) => void;
    selected: string;
    vm: IVM;
    mode: TTargetMode;
    /**
     * 搜索时强制展开所有文件夹
     */
    forceExpand?: boolean;
    onAdd?: (mode: TTargetMode, parent?: string | null) => void;
    onAddFolder?: (mode: TTargetMode, parent?: string | null) => void;
    onItemMouseDown: (e: ReactMouseEvent<HTMLElement>, item: IDragItem) => void;
    dropFolderId: string | null;
    draggingItemId: string | null;
}) => {
    const isExpand = forceExpand || expandedFolders.has(target.id);
    const handleRemoveClicked = (e: ReactMouseEvent<HTMLButtonElement>) => {
        // 阻止冒泡，防止收起/展开
        e.stopPropagation();
        const handleRemove = (result: boolean) => {
            if (!result) return;
            if (target.type === 'folder') vm.runtime.removeFolder(mode, target.id);
            else vm.runtime.removeTarget(target.id);
        };
        void modal.open(ConfirmModal, {
            message: t('gui:remove.confirm', { name: target.name }),
            callback: handleRemove,
        });
    };
    const handleCreateFolder = (e: ReactMouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (onAddFolder) onAddFolder(mode, target.id);
        if (!isExpand) toggleFolder(target.id);
    };
    const handleCreateTarget = (e: ReactMouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (onAdd) onAdd(mode, target.id);
        if (!isExpand) toggleFolder(target.id);
    };
    const handleRenameTarget = (e: ReactMouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const handleRename = (result: string) => {
            if (!result) return;
            if (target.type === 'folder') vm.runtime.getFolderByID(mode, target.id)?.rename(result);
            else vm.runtime.getTargetByID(target.id)?.rename(result);
        };
        void modal.open(PromptModal, {
            message: t('gui:rename.tip', { name: target.name }),
            defaultValue: target.name,
            callback: handleRename,
        });
    };

    if (target.type === 'target') {
        return (
            <li
                className={classNames(styles.target, {
                    [styles.isSelected]: selected === target.id,
                    [styles.isDraggingSource]: draggingItemId === target.id,
                })}
                onMouseDown={e => {
                    onItemMouseDown(e, {
                        id: target.id,
                        name: target.name,
                        type: 'target',
                    });
                }}
            >
                <span>{target.name}</span>
                <div className={styles.folderLeft}>
                    <button
                        className={classNames(styles.button, styles.remove)}
                        onClick={handleRenameTarget}
                        title={t('gui:target.rename')}
                    >
                        <RenameIcon className={classNames(styles.removeIcon)} />
                    </button>
                    <button
                        className={classNames(styles.button, styles.remove)}
                        onClick={handleRemoveClicked}
                        title={t('gui:target.remove')}
                    >
                        <RemoveIcon className={classNames(styles.removeIcon)} />
                    </button>
                </div>
            </li>
        );
    }

    return (
        <li
            className={classNames(styles.folder, {
                [styles.isDropTarget]: dropFolderId === target.id,
                [styles.isDraggingSource]: draggingItemId === target.id,
            })}
            data-folder-id={target.id}
            onMouseDown={e => {
                onItemMouseDown(e, {
                    id: target.id,
                    name: target.name,
                    type: 'folder',
                });
            }}
        >
            <div
                className={styles.folderTitle}
                onClick={() => {
                    toggleFolder(target.id);
                }}
            >
                <div className={styles.folderRight}>
                    <button className={styles.button}>
                        <ExpandIcon
                            className={classNames(styles.expandIcon, {
                                [styles.isExpand]: isExpand,
                            })}
                        />
                    </button>

                    <span>{target.name}</span>
                </div>
                <div className={styles.folderLeft}>
                    <button
                        className={classNames(styles.button, styles.remove)}
                        onClick={handleCreateTarget}
                        title={t('gui:target.add')}
                    >
                        <AddIcon className={classNames(styles.removeIcon)} />
                    </button>
                    <button
                        className={classNames(styles.button, styles.remove)}
                        onClick={handleCreateFolder}
                        title={t('gui:target.createFolder')}
                    >
                        <FolderIcon className={classNames(styles.removeIcon)} />
                    </button>
                    <button
                        className={classNames(styles.button, styles.remove)}
                        onClick={handleRenameTarget}
                        title={t('gui:target.rename')}
                    >
                        <RenameIcon className={classNames(styles.removeIcon)} />
                    </button>
                    <button
                        className={classNames(styles.button, styles.remove)}
                        onClick={handleRemoveClicked}
                        title={t('gui:target.remove')}
                    >
                        <RemoveIcon className={classNames(styles.removeIcon)} />
                    </button>
                </div>
            </div>

            <ul
                className={classNames(styles.folderItems, {
                    [styles.isExpand]: isExpand,
                })}
                onMouseDown={e => {
                    e.stopPropagation();
                }}
            >
                {isExpand &&
                    target.children.map(child => (
                        <GenerateFoldersAndTargets
                            key={child.id}
                            target={child}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            selected={selected}
                            vm={vm}
                            mode={mode}
                            forceExpand={forceExpand}
                            onAdd={onAdd}
                            onAddFolder={onAddFolder}
                            onItemMouseDown={onItemMouseDown}
                            dropFolderId={dropFolderId}
                            draggingItemId={draggingItemId}
                        />
                    ))}
            </ul>
        </li>
    );
};

export const TargetsList = ({
    mode,
    vm,
    selected,
    expandedFolders,
    toggleFolder,
    onSwitch,
    onAdd,
    onAddFolder,
}: {
    mode: TTargetMode;
    vm: IVM;
    selected: string;
    expandedFolders: Set<string>;
    toggleFolder: (id: string) => void;
    onSwitch: (id: string) => void;
    onAdd?: (mode: TTargetMode, parent?: string | null) => void;
    onAddFolder?: (mode: TTargetMode, parent?: string | null) => void;
}) => {
    const [searchContent, setSearchContent] = useState('');
    const isSearching = searchContent.trim() !== '';
    const tree = filterTargetsTree(vm.runtime.generateTargetsTree(mode), searchContent);

    // 拖动中的临时数据放 ref 里，避免每次 mousemove 都触发整棵树重渲染
    const dragRef = useRef<{
        item: IDragItem;
        startX: number;
        startY: number;
        active: boolean;
    } | null>(null);
    // 只有真正开始拖动（超过阈值）才进入 React 状态
    const [draggingItem, setDraggingItem] = useState<{
        item: IDragItem;
        x: number;
        y: number;
    } | null>(null);
    // 拖动文件夹时，它的子孙文件夹不能作为放置目标（避免成环）
    const draggedFolderSubtree = useMemo(
        () =>
            draggingItem?.item.type === 'folder'
                ? collectFolderDescendants(tree, draggingItem.item.id)
                : null,
        [tree, draggingItem],
    );
    // 当前悬停的文件夹，用于高亮
    const [dropFolderId, setDropFolderId] = useState<string | null>(null);
    // 是否悬停在"移到顶层"区域
    const [dropAtRoot, setDropAtRoot] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    const handleItemMouseDown = (e: ReactMouseEvent<HTMLElement>, item: IDragItem) => {
        // 只响应鼠标左键
        if (e.button !== 0) return;
        if ((e.target as HTMLElement).closest('button')) return;
        e.preventDefault();
        dragRef.current = { item, startX: e.clientX, startY: e.clientY, active: false };
    };

    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => {
            const d = dragRef.current;
            if (!d) return;
            const dx = e.clientX - d.startX;
            const dy = e.clientY - d.startY;
            if (!d.active) {
                if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
                d.active = true;

                setDraggingItem({ item: d.item, x: e.clientX, y: e.clientY });
            }
            if (overlayRef.current) {
                const overlayX = (e.clientX - OVERLAY_OFFSET).toString();
                const overlayY = (e.clientY - OVERLAY_OFFSET).toString();
                overlayRef.current.style.transform = `translate(${overlayX}px, ${overlayY}px)`;
            }
            const el = document.elementFromPoint(e.clientX, e.clientY);
            if ((el as HTMLElement | null)?.closest('[data-root-drop]')) {
                setDropAtRoot(true);
                setDropFolderId(null);
            } else {
                setDropAtRoot(false);
                const folderEl =
                    (el as HTMLElement | null)?.closest<HTMLElement>('[data-folder-id]') ?? null;
                const nextDrop = folderEl ? (folderEl.dataset.folderId ?? null) : null;
                const invalidDrop =
                    nextDrop === null ||
                    nextDrop === d.item.id ||
                    (draggedFolderSubtree?.has(nextDrop) ?? false);
                setDropFolderId(invalidDrop ? null : nextDrop);
                // 悬停在折叠的文件夹上时自动展开
                if (!invalidDrop && !isSearching && !expandedFolders.has(nextDrop)) {
                    toggleFolder(nextDrop);
                }
            }
        };
        const handleWindowMouseUp = (e: MouseEvent) => {
            const d = dragRef.current;
            dragRef.current = null;
            if (!d) return;
            if (!d.active) {
                if (d.item.type === 'target') onSwitch(d.item.id);
                setDraggingItem(null);
                setDropFolderId(null);
                return;
            }
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const moveTo = (newParentID: string | null) => {
                const currentParent =
                    d.item.type === 'folder'
                        ? (vm.runtime.getFolderByID(mode, d.item.id)?.parentID ?? null)
                        : (vm.runtime.getTargetByID(d.item.id)?.parentID ?? null);
                if (newParentID === currentParent) return;
                if (d.item.type === 'folder') vm.runtime.moveFolder(mode, d.item.id, newParentID);
                else vm.runtime.moveTarget(mode, d.item.id, newParentID);
            };
            if ((el as HTMLElement | null)?.closest('[data-root-drop]')) {
                moveTo(null);
            } else {
                const folderEl =
                    (el as HTMLElement | null)?.closest<HTMLElement>('[data-folder-id]') ?? null;
                if (folderEl) {
                    const targetParentID = folderEl.dataset.folderId ?? null;
                    // 不把自己放进自己里面，也不放进自己的子孙里
                    if (
                        targetParentID &&
                        targetParentID !== d.item.id &&
                        !(draggedFolderSubtree?.has(targetParentID) ?? false)
                    ) {
                        moveTo(targetParentID);
                    }
                }
            }
            setDraggingItem(null);
            setDropFolderId(null);
            setDropAtRoot(false);
        };
        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [vm, mode, onSwitch, expandedFolders, toggleFolder, isSearching, draggedFolderSubtree]);

    const { openMenu: openAddMenu } = useContextMenu(AllContextMenu.ADD_TARGET, () => (
        <>
            <MenuItem
                onClick={() => {
                    if (onAdd) onAdd(mode, null);
                }}
            >
                {mode === 'entity' ? t('gui:target.createObject') : t('gui:target.createModule')}
            </MenuItem>
            <MenuItem
                onClick={() => {
                    if (onAddFolder) onAddFolder(mode, null);
                }}
            >
                {t('gui:target.createFolder')}
            </MenuItem>
        </>
    ));

    return (
        <div className={styles.targetsList}>
            <div className={styles.bar}>
                <input
                    className={styles.entitySearch}
                    placeholder={
                        mode === 'entity' ? t('gui:search.entity.tip') : t('gui:search.module.tip')
                    }
                    value={searchContent}
                    onChange={e => {
                        setSearchContent(e.target.value);
                    }}
                />
                {onAdd && (
                    <button
                        className={styles.entityAdd}
                        onMouseDown={openMenuByMouseDown(openAddMenu)}
                        title={t('gui:target.create')}
                    >
                        <AddIcon />
                    </button>
                )}
            </div>
            <div
                className={classNames(styles.rootDropZone, {
                    [styles.isDropTarget]: dropAtRoot,
                })}
                data-root-drop
            >
                {vm.runtime.settings.projectMeta.projectName}
            </div>
            <div className={styles.list}>
                {tree.map(target => (
                    <GenerateFoldersAndTargets
                        key={target.id}
                        target={target}
                        expandedFolders={expandedFolders}
                        toggleFolder={toggleFolder}
                        selected={selected}
                        vm={vm}
                        mode={mode}
                        forceExpand={isSearching}
                        onAdd={onAdd}
                        onAddFolder={onAddFolder}
                        onItemMouseDown={handleItemMouseDown}
                        dropFolderId={dropFolderId}
                        draggingItemId={draggingItem ? draggingItem.item.id : null}
                    />
                ))}
                {isSearching && tree.length === 0 && (
                    <div className={styles.empty}>{t('gui:search.nothing')}</div>
                )}
            </div>
            {draggingItem && (
                <div
                    ref={overlayRef}
                    className={styles.dragOverlay}
                    style={{
                        transform: `translate(${(draggingItem.x - OVERLAY_OFFSET).toString()}px, ${(draggingItem.y - OVERLAY_OFFSET).toString()}px)`,
                    }}
                >
                    {draggingItem.item.name}
                </div>
            )}
        </div>
    );
};
