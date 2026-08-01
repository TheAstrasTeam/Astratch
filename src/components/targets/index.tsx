import { type MouseEvent as ReactMouseEvent } from 'react';
import type { IVM, TTargetMode, TTargetTree, TTargetTreeNode } from '../../types/vm';
import styles from './index.module.scss';
import classNames from 'classnames';

import Expand from '../../assets/chevronRight.svg?react';
import Remove from '../../assets/remove.svg?react';
import { modal } from '../Modal/modal';
import { ConfirmModal } from '../modal_confirm';
import { t } from 'i18next';

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
}: {
    target: TTargetTreeNode;
    expandedFolders: Set<string>;
    toggleFolder: (id: string) => void;
    selected: string;
    vm: IVM;
    mode: TTargetMode;
    onSwitch: (id: string) => void;
    /**
     * 搜索时强制展开所有文件夹，让匹配的 target 可见
     */
    forceExpand?: boolean;
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
                        onClick={handleRemoveClicked}
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
    searchQuery,
}: {
    mode: TTargetMode;
    vm: IVM;
    selected: string;
    expandedFolders: Set<string>;
    toggleFolder: (id: string) => void;
    onSwitch: (id: string) => void;
    searchQuery?: string;
}) => {
    const isSearching = !!searchQuery && searchQuery.trim() !== '';
    const tree = filterTargetsTree(vm.runtime.generateTargetsTree(mode), searchQuery ?? '');

    return (
        <div className={styles.targetsList}>
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
                />
            ))}
            {isSearching && tree.length === 0 && (
                <div className={styles.empty}>{t('gui:search.nothing')}</div>
            )}
        </div>
    );
};
