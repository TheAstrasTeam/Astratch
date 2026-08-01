import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { IVM, TTargetMode, TTargetTree, TTargetTreeNode } from '../../types/vm';
import styles from './index.module.scss';
import classNames from 'classnames';

import Expand from '../../assets/chevronRight.svg?react';
import Remove from '../../assets/remove.svg?react';
import AddImg from '../../assets/add.svg?react';
import Folder from '../../assets/addFolder.svg?react';

import { modal } from '../Modal/modal';
import { ConfirmModal } from '../modal_confirm';
import { t } from 'i18next';
import { useContextMenu } from '../../gui/contextMenu';
import { AllContextMenu } from '../../types/gui';
import { MenuItem } from '@szhsin/react-menu';
import { openMenuByClick } from '../../utils/ash-gui';

/**
 * 按关键词过滤 targets 树。
 * 文件夹仅当自身匹配或包含匹配的子节点时保留
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
                result.push({ ...node, children });
            }
        } else if (node.name.toLowerCase().includes(q)) {
            // 目标节点
            result.push(node);
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
    onSwitch,
    forceExpand = false,
    onAdd,
    onAddFolder,
}: {
    target: TTargetTreeNode;
    expandedFolders: Set<string>;
    toggleFolder: (id: string) => void;
    selected: string;
    vm: IVM;
    mode: TTargetMode;
    onSwitch: (id: string) => void;
    /**
     * 搜索时强制展开所有文件夹
     */
    forceExpand?: boolean;
    onAdd?: (parent?: string | null) => void;
    onAddFolder?: (parent?: string | null) => void;
}) => {
    const isExpand = forceExpand || expandedFolders.has(target.id);
    const handleRemoveClicked = (e: ReactMouseEvent<HTMLButtonElement>) => {
        // 阻止冒泡,防止收起/展开
        e.stopPropagation();
        const handleRemove = (result: boolean) => {
            if (!result) return;
            if (target.type === 'folder') vm.runtime.removeFolderFolder(mode, target.id);
            else vm.runtime.removeTarget(target.id);
        };
        void modal.open(ConfirmModal, {
            message: t('gui:remove.confirm', { name: target.name }),
            callback: handleRemove,
        });
    };
    const handleSwitchTarget = () => {
        onSwitch(target.id);
    };
    const handleCreateFolder = (e: ReactMouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (onAddFolder) onAddFolder(target.id);
        if (!isExpand) toggleFolder(target.id);
    };
    const handleCreateTarget = (e: ReactMouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (onAdd) onAdd(target.id);
        if (!isExpand) toggleFolder(target.id);
    };

    if (target.type === 'target') {
        return (
            <li
                className={classNames(styles.target, {
                    [styles.isSelected]: selected === target.id,
                })}
                onClick={handleSwitchTarget}
            >
                <span>{target.name}</span>
                <button
                    className={classNames(styles.button, styles.remove)}
                    onClick={handleRemoveClicked}
                >
                    <Remove className={classNames(styles.removeIcon)} />
                </button>
            </li>
        );
    }

    return (
        <li className={styles.folder}>
            <div
                className={styles.folderTitle}
                onClick={() => {
                    toggleFolder(target.id);
                }}
            >
                <div className={styles.folderRight}>
                    <button className={styles.button}>
                        <Expand
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
                        title={t('gui:add')}
                    >
                        <AddImg className={classNames(styles.removeIcon)} />
                    </button>
                    <button
                        className={classNames(styles.button, styles.remove)}
                        onClick={handleCreateFolder}
                        title={t('gui:createFolder')}
                    >
                        <Folder className={classNames(styles.removeIcon)} />
                    </button>
                    <button
                        className={classNames(styles.button, styles.remove)}
                        onClick={handleRemoveClicked}
                        title={t('gui:remove')}
                    >
                        <Remove className={classNames(styles.removeIcon)} />
                    </button>
                </div>
            </div>

            <ul
                className={classNames(styles.folderItems, {
                    [styles.isExpand]: isExpand,
                })}
            >
                {isExpand &&
                    target.children.map(child => (
                        <GenerateFoldersAndTargets
                            key={child.id}
                            target={child as TTargetTreeNode}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            selected={selected}
                            vm={vm}
                            mode={mode}
                            onSwitch={onSwitch}
                            forceExpand={forceExpand}
                            onAdd={onAdd}
                            onAddFolder={onAddFolder}
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
    onAdd?: (parent?: string | null) => void;
    onAddFolder?: (parent?: string | null) => void;
}) => {
    const [searchContent, setSearchContent] = useState('');
    const isSearching = searchContent.trim() !== '';
    const tree = filterTargetsTree(vm.runtime.generateTargetsTree(mode), searchContent);

    const { openMenu: openAddMenu } = useContextMenu(AllContextMenu.ADD_TARGET, () => (
        <>
            <MenuItem
                onClick={() => {
                    if (onAdd) onAdd();
                }}
            >
                {t('gui:createObject')}
            </MenuItem>
            <MenuItem
                onClick={() => {
                    if (onAddFolder) onAddFolder();
                }}
            >
                {t('gui:createFolder')}
            </MenuItem>
        </>
    ));

    return (
        <div className={styles.targetsList}>
            <div className={styles.bar}>
                <input
                    className={styles.objectSearch}
                    placeholder={t('gui:search.object.tip')}
                    value={searchContent}
                    onChange={e => {
                        setSearchContent(e.target.value);
                    }}
                />
                {onAdd && (
                    <button
                        className={styles.objectAdd}
                        onClick={openMenuByClick(openAddMenu)}
                        title={t('gui:create')}
                    >
                        <AddImg />
                    </button>
                )}
            </div>
            <div className={styles.list}>
                {tree.map(target => (
                    <GenerateFoldersAndTargets
                        key={target.id}
                        target={target as TTargetTreeNode}
                        expandedFolders={expandedFolders}
                        toggleFolder={toggleFolder}
                        selected={selected}
                        vm={vm}
                        mode={mode}
                        onSwitch={onSwitch}
                        forceExpand={isSearching}
                        onAdd={onAdd}
                        onAddFolder={onAddFolder}
                    />
                ))}
                {isSearching && tree.length === 0 && (
                    <div className={styles.empty}>{t('gui:search.nothing')}</div>
                )}
            </div>
        </div>
    );
};
