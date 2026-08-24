/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// Ctrl+Tab 快速切换浮层：按 MRU 快照列出标签，高亮当前选中项。
// 仅高亮不实际切换（避免 Blockly 工作区反复销毁重建），松开修饰键时由
// useTabSwitcher 提交。层级压在所有可拖动模态框之上。

import { useEffect, useRef } from 'react';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useTabSwitcher } from '../useTabSwitcher';
import { useTabSwitcherStore } from '../../stores/useTabSwitcherStore';
import { useTabsStore } from '../../stores/useTabsStore';
import { TargetModes } from '../../types/vm';
import SpriteIcon from '../../assets/sprite.svg?react';
import ModuleIcon from '../../assets/module.svg?react';

const Entry = ({ tabID, selected }: { tabID: string; selected: boolean }): React.ReactNode => {
    const tab = useTabsStore(state => state.tabs.find(t => t.id === tabID));
    const ref = useRef<HTMLDivElement>(null);

    // 选中项变化时滚入视野
    useEffect(() => {
        if (selected) ref.current?.scrollIntoView({ block: 'nearest' });
    }, [selected]);

    if (!tab) return null;
    return (
        <div
            ref={ref}
            className={classNames(styles.entry, { [styles.isSelected]: selected })}
            // 鼠标点击条目也可以直接提交（此时通常还按着修饰键）
            onMouseDown={e => {
                e.preventDefault();
                useTabsStore.getState().setActiveTab(tab.id);
                useTabSwitcherStore.getState().reset();
            }}
        >
            {tab.mode === TargetModes.ENTITY ? (
                <SpriteIcon className={styles.entryIcon} />
            ) : (
                <ModuleIcon className={styles.entryIcon} />
            )}
            <span className={styles.entryTitle}>{tab.title}</span>
        </div>
    );
};

const TabSwitcher = (): React.ReactNode => {
    useTabSwitcher();
    const isOpen = useTabSwitcherStore(state => state.isOpen);
    const entries = useTabSwitcherStore(state => state.entries);
    const index = useTabSwitcherStore(state => state.index);

    if (!isOpen) return null;

    return (
        <div className={styles.tabSwitcher}>
            {entries.map((tabID, i) => (
                <Entry key={tabID} tabID={tabID} selected={i === index} />
            ))}
        </div>
    );
};

export default TabSwitcher;
