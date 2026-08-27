/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// QuickOpen 搜索模式内容：顶部搜索框 + 结果列表。
// 默认搜索项目内 Target，输入 `>` 前缀切换为命令模式
// （内置命令 + 插件注册的动态命令）。
// 选中 Target 时调用 runtime.switchTarget，由 SWITCH_TARGET 事件
// 自动打开/激活对应标签（见 gui/workspace/index.tsx）。

import { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import styles from './index.module.scss';
import { builtinCommands } from './builtins';
import { useQuickOpenStore } from '../../stores/useQuickOpenStore';
import { useTabsStore } from '../../stores/useTabsStore';
import { useQuickOpenCommandsStore } from '../../stores/useQuickOpenCommandsStore';
import { events, TargetModes, type IVM } from '../../types/vm';
import type { IQuickOpenCommand } from '../../types/gui';
import type { TTargetMode } from '../../types/vm';
import { t } from 'i18next';
import SpriteIcon from '../../assets/sprite.svg?react';
import ModuleIcon from '../../assets/module.svg?react';

interface IAnchorRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface ICommandEntry {
    kind: 'command';
    key: string;
    command: IQuickOpenCommand;
}

interface ITargetEntry {
    kind: 'target';
    key: string;
    id: string;
    name: string;
    mode: TTargetMode;
    /** 是否已作为标签打开 */
    isOpenTab: boolean;
}

type TListEntry = ICommandEntry | ITargetEntry;

/**
 * 简单的大小写不敏感过滤打分：
 * 前缀匹配 > 词边界匹配 > 包含匹配；无匹配返回 -1
 */
const matchScore = (text: string, query: string): number => {
    if (query.length === 0) return 0;
    const lowerText = text.toLowerCase();
    const idx = lowerText.indexOf(query);
    if (idx === -1) return -1;
    if (idx === 0) return 100;
    // 词边界（前一个字符是非字母数字）视为次优
    if (/[^a-z0-9]/.test(lowerText[idx - 1])) return 50;
    return 10;
};

const EntryRow = ({
    entry,
    selected,
    onSelect,
}: {
    entry: TListEntry;
    selected: boolean;
    onSelect: () => void;
}) => {
    const ref = useRef<HTMLDivElement>(null);

    // 选中项变化时滚入视野
    useEffect(() => {
        if (selected) ref.current?.scrollIntoView({ block: 'nearest' });
    }, [selected]);

    return (
        <div
            ref={ref}
            className={classNames(styles.entry, { [styles.isSelected]: selected })}
            // 鼠标点击条目也可以直接提交
            onMouseDown={e => {
                e.preventDefault();
                onSelect();
            }}
        >
            {entry.kind === 'command' ? (
                <span className={styles.entryPrefix}>{'>'}</span>
            ) : (
                <>
                    {entry.mode === TargetModes.ENTITY ? (
                        <SpriteIcon className={styles.entryIcon} />
                    ) : (
                        <ModuleIcon className={styles.entryIcon} />
                    )}
                    <span className={styles.entryTitle}>{entry.name}</span>
                    {!entry.isOpenTab && (
                        <span className={styles.entryBadge}>{t('gui:quickOpen.openNew')}</span>
                    )}
                </>
            )}
            {entry.kind === 'command' && (
                <span className={styles.entryTitle}>
                    {t(entry.command.title, { defaultValue: entry.command.title })}
                </span>
            )}
        </div>
    );
};

const SearchPanel = ({
    vm,
    anchorRect,
}: {
    vm: IVM;
    anchorRect: IAnchorRect | null;
}): React.ReactNode => {
    const isOpen = useQuickOpenStore(state => state.isOpen);
    const query = useQuickOpenStore(state => state.query);
    const index = useQuickOpenStore(state => state.index);
    const setQuery = useQuickOpenStore(state => state.setQuery);
    const move = useQuickOpenStore(state => state.move);
    const close = useQuickOpenStore(state => state.close);
    const tabs = useTabsStore(state => state.tabs);
    const mruTabIds = useTabsStore(state => state.mruTabIds);
    const pluginCommands = useQuickOpenCommandsStore(state => state.commands);

    const inputRef = useRef<HTMLInputElement>(null);
    // Target 数据来自 vm.runtime.targets（非响应式），
    // 订阅结构变化事件强制重算结果列表
    const [targetsRevision, setTargetsRevision] = useState(0);

    useEffect(() => {
        const handleStructureChanged = () => {
            setTargetsRevision(revision => revision + 1);
        };
        vm.on(events.UPDATE_TARGET_STRUCTURE, handleStructureChanged);
        return () => {
            vm.off(events.UPDATE_TARGET_STRUCTURE, handleStructureChanged);
        };
    }, [vm]);

    // 打开时聚焦输入框
    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const entries = useMemo<TListEntry[]>(() => {
        void targetsRevision; // 仅作为重算依赖

        // 命令模式：`>` 前缀，标题 + 关键词联合过滤，按匹配质量排序
        if (query.startsWith('>')) {
            const q = query.slice(1).trim().toLowerCase();
            return [...builtinCommands, ...[...pluginCommands.values()].map(r => r.command)]
                .map(command => {
                    const title = t(command.title, { defaultValue: command.title });
                    const haystack = `${title} ${command.keywords ?? ''}`.toLowerCase();
                    return { command, score: matchScore(haystack, q) };
                })
                .filter(item => item.score >= 0)
                .sort((a, b) => b.score - a.score)
                .map(item => ({ kind: 'command', key: item.command.id, command: item.command }));
        }

        // Target 模式：按名称/ID 过滤，已打开的排前，其余按匹配质量与名称排序
        const q = query.trim().toLowerCase();
        const openIds = new Set(mruTabIds.filter(id => tabs.some(tab => tab.id === id)));
        return [...vm.runtime.targets.values()]
            .map(target => ({
                target,
                score: Math.max(matchScore(target.name, q), matchScore(target.id, q)),
            }))
            .filter(item => item.score >= 0)
            .sort((a, b) => {
                const aOpen = openIds.has(a.target.id) ? 1 : 0;
                const bOpen = openIds.has(b.target.id) ? 1 : 0;
                if (aOpen !== bOpen) return bOpen - aOpen;
                if (a.score !== b.score) return b.score - a.score;
                return a.target.name.localeCompare(b.target.name);
            })
            .map(item => ({
                kind: 'target',
                key: item.target.id,
                id: item.target.id,
                name: item.target.name,
                mode: item.target.mode,
                isOpenTab: openIds.has(item.target.id),
            }));
    }, [query, pluginCommands, vm, targetsRevision, mruTabIds, tabs]);

    // 高亮越界兜底（列表随输入缩短时）
    const safeIndex = entries.length === 0 ? 0 : Math.min(index, entries.length - 1);

    /**
     * 提交指定下标的条目并关闭面板：
     * 命令 → 执行；Target → switchTarget（SWITCH_TARGET 事件自动 openTab）
     */
    const commitIndex = (targetIndex: number) => {
        const entry = entries.at(targetIndex);
        if (entry === undefined) return;
        close();
        if (entry.kind === 'command') {
            void entry.command.run(vm);
            return;
        }
        vm.runtime.switchTarget(entry.id);
    };

    // 高度与菜单栏搜索框一致，实现视觉重合
    const inputStyle = anchorRect ? { height: anchorRect.height } : undefined;

    return (
        <>
            <input
                ref={inputRef}
                className={styles.searchInput}
                placeholder={t('gui:quickOpen.placeholder')}
                value={query}
                style={inputStyle}
                onChange={e => {
                    setQuery(e.target.value);
                }}
                onKeyDown={e => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        move(1, entries.length);
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        move(-1, entries.length);
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        commitIndex(safeIndex);
                    }
                    // Esc 由 useQuickOpen 的全局捕获监听统一处理
                }}
            />
            <div className={styles.resultList}>
                {entries.length === 0 && (
                    <div className={styles.empty}>{t('gui:quickOpen.noResults')}</div>
                )}
                {entries.map((entry, i) => (
                    <EntryRow
                        key={entry.key}
                        entry={entry}
                        selected={i === safeIndex}
                        onSelect={() => {
                            commitIndex(i);
                        }}
                    />
                ))}
            </div>
        </>
    );
};

export { SearchPanel };
