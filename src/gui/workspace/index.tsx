/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { allBuiltInTabs, events, type IVM, type TallBuiltInTabs } from '../../types/vm/vm';
import { useSidebarStore } from '../../stores/useSidebarStore';
import styles from './index.module.scss';
import BlocklyWorkspace from './Blockly/index';
import { Fragment, useEffect, useMemo, useState, type FunctionComponent, type SVGProps } from 'react';
import classNames from 'classnames';

import SpriteIcon from '../../assets/sprite.svg?react';
import AddonsIcon from '../../assets/addons.svg?react';
import DebuggerIcon from '../../assets/debugger.svg?react';
import EmptyTip from '../../assets/empty.svg?react';
import EmptyTip2 from '../../assets/empty2.svg?react';

import { t } from 'i18next';
import SelectBar from '../../components/workspace/selectBar';
import { getSpecialTabDefinition } from '../../tabs/specialTabs';
import TargetsPanel from './targets';
import AddonsPanel from './addons';
import SplitPane from '../../components/splitPane';
import { debounce } from '../../utils/ash-debounce';
import { BottomBar } from '../bottomBar';
import { shortcutManager } from '../../lib/ShortcutManager';
import { SHORTCUTS } from '../../types/lib';
import TabBar from '../../tabs/TabBar';
import { useTabsStore } from '../../stores/useTabsStore';

// 应用生命周期内是否已执行过「首挂载自动打开欢迎标签」。
// 模块级：语言切换等重挂组件也不会重复触发。
let welcomeTabAutoOpened = false;

const TabButton = ({
    id,
    selected,
    ICON,
}: {
    id: TallBuiltInTabs;
    selected: string;
    ICON: FunctionComponent<SVGProps<SVGSVGElement>>;
}) => {
    return (
        <button
            className={classNames(styles.switchTab, {
                [styles.enabled]: id === selected,
            })}
            onClick={() => {
                useSidebarStore.getState().select(id);
            }}
        >
            <ICON />
        </button>
    );
};

// 渲染快捷键：组合键拆分为独立按键（有底板），加号作为无底板的分隔符
const renderHotKey = (hotKey: string): React.ReactNode => (
    <span className={styles.hotKeyGroup}>
        {hotKey.split('+').map((part, index) => (
            <Fragment key={index}>
                {index > 0 && <span className={styles.hotKeySeparator}>+</span>}
                <kbd>{part}</kbd>
            </Fragment>
        ))}
    </span>
);

const WorkSpace = ({ vm }: { vm: IVM }): React.ReactNode => {
    const [, setTargetsRevision] = useState(0);
    const tabSelected = useSidebarStore(state => state.selectedTab);
    const tabs = useTabsStore(state => state.tabs);
    const activeTabId = useTabsStore(state => state.activeTabId);
    // 快捷键变化时触发重渲染，保证空界面提示随设置更新
    const [, setShortcutRevision] = useState(0);

    const activeTab = activeTabId ? tabs.find(tab => tab.id === activeTabId) : null;

    useEffect(() => {
        return shortcutManager.onChange(() => {
            setShortcutRevision(revision => revision + 1);
        });
    }, []);

    // 应用启动后首次挂载且没有任何标签时，自动打开「欢迎」标签页。
    // 用模块级标记保证整个应用生命周期只执行一次（语言切换等会重挂组件）。
    useEffect(() => {
        if (welcomeTabAutoOpened) return;
        welcomeTabAutoOpened = true;
        const { tabs: currentTabs, activeTabId: currentActive } = useTabsStore.getState();
        if (currentTabs.length === 0 && currentActive === null) {
            useTabsStore.getState().openSpecialTab('welcome');
        }
    }, []);

    useEffect(() => {
        const handleTargetsUpdate = () => {
            setTargetsRevision(revision => revision + 1);
            // 目标被删除/移动时，同步关闭目标已不存在的 blockly 标签，
            // 避免留下无法加载的幽灵标签。
            const { tabs } = useTabsStore.getState();
            const removedTabIDs = tabs
                .filter(tab => tab.type === 'blockly' && !vm.runtime.targets.has(tab.targetId))
                .map(tab => tab.id);
            removedTabIDs.forEach(id => {
                useTabsStore.getState().closeTab(id);
            });
        };
        const handleProjectCreated = () => {
            const editingTargetID = vm.runtime.getEditingTarget()?.id ?? '';
            const target = vm.runtime.targets.get(editingTargetID);
            if (!target && vm.runtime.targets.size > 0) {
                const first = vm.runtime.targets.values().next().value;
                if (first) {
                    vm.runtime.switchTarget(first.id);
                }
            }
            const latest = vm.runtime.getEditingTarget();
            if (latest) useTabsStore.getState().openTab(latest.id, latest.name, latest.mode);
            // 创建/打开项目成功后进入编辑器，关闭欢迎、创建项目等内置页面标签
            // 这样会显示第一个角色
            useTabsStore.getState().closeSpecialTabs();
        };
        // 任何位置触发目标切换时，同步打开/激活对应标签。
        // 保证左侧列表、创建目标、以及其它调用 switchTarget 的路径行为一致。
        const handleSwitchTarget = () => {
            const target = vm.runtime.getEditingTarget();
            if (target) useTabsStore.getState().openTab(target.id, target.name, target.mode);
        };

        vm.off(events.UPDATE_TARGET_STRUCTURE, handleTargetsUpdate);
        vm.off(events.CREATE_PROJECT, handleProjectCreated);
        vm.off(events.SWITCH_TARGET, handleSwitchTarget);
        vm.on(events.UPDATE_TARGET_STRUCTURE, handleTargetsUpdate);
        vm.on(events.CREATE_PROJECT, handleProjectCreated);
        vm.on(events.SWITCH_TARGET, handleSwitchTarget);
        const unbindShortcutCommands = shortcutManager.bindCommands({
            [SHORTCUTS.SWITCH_TAB_TARGET.id]: () => {
                useSidebarStore.getState().select(allBuiltInTabs.TARGETS);
            },
            [SHORTCUTS.SWITCH_TAB_ADDON.id]: () => {
                useSidebarStore.getState().select(allBuiltInTabs.ADDONS);
            },
            [SHORTCUTS.SWITCH_TAB_DEBUG.id]: () => {
                useSidebarStore.getState().select(allBuiltInTabs.DEBUG);
            },
        });
        return () => {
            vm.off(events.UPDATE_TARGET_STRUCTURE, handleTargetsUpdate);
            vm.off(events.CREATE_PROJECT, handleProjectCreated);
            vm.off(events.SWITCH_TARGET, handleSwitchTarget);
            unbindShortcutCommands();
        };
    }, [vm]);

    const svgResizeDebounced = useMemo(
        () =>
            debounce(
                () => {
                    vm.runtime.blocks.refreshBlocklySize();
                },
                50,
                false,
            ),
        [vm],
    );

    const renderEditorContent = () => {
        const showEmptyTip = () => Math.random() < 0.5;
        // 无标签时保持显示 empty 图片
        if (!activeTab) {
            return (
                <div className={styles.empty}>
                    {showEmptyTip() ? <EmptyTip /> : <EmptyTip2 />}
                    <h1>{t('gui:selectNothing')}</h1>
                    <ul className={styles.shortcutHints}>
                        <li>
                            <span>{t('gui:empty.shortcutHints.commands')}</span>
                            {renderHotKey(
                                shortcutManager.formatHotKey(
                                    shortcutManager.getHotKey(SHORTCUTS.QUICK_OPEN_COMMAND.id),
                                ),
                            )}
                        </li>
                        <li>
                            <span>{t('gui:empty.shortcutHints.settings')}</span>
                            {renderHotKey(
                                shortcutManager.formatHotKey(
                                    shortcutManager.getHotKey(SHORTCUTS.OPEN_SETTINGS.id),
                                ),
                            )}
                        </li>
                    </ul>
                </div>
            );
        }
        // 内置页面标签（欢迎/创建项目等）由注册表渲染
        if (activeTab.type !== 'blockly') {
            return getSpecialTabDefinition(activeTab.type).render(vm);
        }
        // 编辑器（blockly 工作区）
        return <BlocklyWorkspace vm={vm} targetId={activeTab.targetId} />;
    };
    const renderToolBar = () => {
        if (tabSelected === allBuiltInTabs.TARGETS)
            return (
                <SelectBar title={t('gui:target.title')}>
                    <TargetsPanel vm={vm} />
                </SelectBar>
            );
        if (tabSelected === allBuiltInTabs.ADDONS)
            return (
                <SelectBar title={t('gui:addon.title')}>
                    <AddonsPanel vm={vm} />
                </SelectBar>
            );
    };

    return (
        <div className={styles.main}>
            <div className={styles.workspace}>
                <SplitPane
                    direction='horizontal'
                    defaultRatio={0.2}
                    minFirst={300}
                    minSecond={400}
                    first={
                        <div className={styles.sidebarCol}>
                            <div className={styles.sidebarHeader}>
                                <div className={styles.switchTabs}>
                                    <TabButton
                                        selected={tabSelected}
                                        id={allBuiltInTabs.TARGETS}
                                        ICON={SpriteIcon}
                                    />
                                    <TabButton
                                        selected={tabSelected}
                                        id={allBuiltInTabs.ADDONS}
                                        ICON={AddonsIcon}
                                    />
                                    <TabButton
                                        selected={tabSelected}
                                        id={allBuiltInTabs.DEBUG}
                                        ICON={DebuggerIcon}
                                    />
                                </div>
                            </div>
                            <div className={styles.sidebarBody}>{renderToolBar()}</div>
                        </div>
                    }
                    second={
                        <div className={styles.editorCol}>
                            <TabBar />
                            <div className={styles.editorBody}>{renderEditorContent()}</div>
                        </div>
                    }
                    onMove={svgResizeDebounced}
                    onOver={() => {
                        vm.runtime.blocks.refreshBlocklySize();
                    }}
                />
            </div>
            <BottomBar vm={vm} />
        </div>
    );
};

export default WorkSpace;
