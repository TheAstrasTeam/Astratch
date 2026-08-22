/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { allBuiltInTabs, events, type IVM, type TallBuiltInTabs } from '../../types/vm';
import styles from './index.module.scss';
import BlocklyWorkspace from './Blockly/index';
import { useEffect, useMemo, useState, type FunctionComponent, type SVGProps } from 'react';
import classNames from 'classnames';

import SpriteIcon from '../../assets/sprite.svg?react';
import AddonsIcon from '../../assets/addons.svg?react';
import DebuggerIcon from '../../assets/debugger.svg?react';
import EmptyTip from '../../assets/empty.svg?react';
import EmptyTip2 from '../../assets/empty2.svg?react';

import { t } from 'i18next';
import SelectBar from '../../components/workspace/selectBar';
import { useGUIStore } from '../../stores/useGUIStore';
import { guiInterface } from '../../types/gui';
import Start from '../start';
import CreateProject from '../createProjet';
import TargetsPanel from './targets';
import AddonsPanel from './addons';
import SplitPane from '../../components/splitPane';
import { debounce } from '../../utils/ash-debounce';
import { BottomBar } from '../bottomBar';
import { shortcutManager } from '../../lib/ShortcutManager';
import { SHORTCUTS } from '../../types/lib';
import TabBar from '../../tabs/TabBar';
import { useTabsStore } from '../../stores/useTabsStore';

const TabButton = ({
    id,
    selected,
    callback,
    ICON,
}: {
    id: TallBuiltInTabs;
    selected: string;
    callback?: (id: TallBuiltInTabs) => void;
    ICON: FunctionComponent<SVGProps<SVGSVGElement>>;
}) => {
    return (
        <button
            className={classNames(styles.switchTab, {
                [styles.enabled]: id === selected,
            })}
            onClick={() => callback?.(id)}
        >
            <ICON />
        </button>
    );
};

const WorkSpace = ({ vm }: { vm: IVM }): React.ReactNode => {
    const nowGuiInterface = useGUIStore(state => state.guiInterface);
    const [, setTargetsRevision] = useState(0);
    const [tabSelected, setTabSelect] = useState<TallBuiltInTabs>(allBuiltInTabs.TARGETS);
    const tabs = useTabsStore(state => state.tabs);
    const activeTabId = useTabsStore(state => state.activeTabId);

    const activeTab = activeTabId ? tabs.find(tab => tab.id === activeTabId) : null;

    useEffect(() => {
        const handleTargetsUpdate = () => {
            setTargetsRevision(revision => revision + 1);
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
                setTabSelect(allBuiltInTabs.TARGETS);
            },
            [SHORTCUTS.SWITCH_TAB_ADDON.id]: () => {
                setTabSelect(allBuiltInTabs.ADDONS);
            },
            [SHORTCUTS.SWITCH_TAB_DEBUG.id]: () => {
                setTabSelect(allBuiltInTabs.DEBUG);
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
        if (nowGuiInterface === guiInterface.START) {
            return <Start vm={vm} />;
        }
        if (nowGuiInterface === guiInterface.CREATE_PROJECT) {
            return <CreateProject vm={vm} />;
        }
        // 编辑器
        if (activeTab) return <BlocklyWorkspace vm={vm} targetId={activeTab.targetId} />;
        else
            return (
                <div className={styles.empty}>
                    {showEmptyTip() ? <EmptyTip /> : <EmptyTip2 />}
                    <h1>{t('gui:selectNothing')}</h1>
                </div>
            );
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
                    <AddonsPanel />
                </SelectBar>
            );
    };

    return (
        <div className={styles.main}>
            <div className={styles.workspace}>
                <SplitPane
                    direction='horizontal'
                    defaultRatio={0.2}
                    minFirst={50}
                    minSecond={150}
                    first={
                        <div className={styles.sidebarCol}>
                            <div className={styles.sidebarHeader}>
                                <div className={styles.switchTabs}>
                                    <TabButton
                                        selected={tabSelected}
                                        id={allBuiltInTabs.TARGETS}
                                        ICON={SpriteIcon}
                                        callback={setTabSelect}
                                    />
                                    <TabButton
                                        selected={tabSelected}
                                        id={allBuiltInTabs.ADDONS}
                                        ICON={AddonsIcon}
                                        callback={setTabSelect}
                                    />
                                    <TabButton
                                        selected={tabSelected}
                                        id={allBuiltInTabs.DEBUG}
                                        ICON={DebuggerIcon}
                                        callback={setTabSelect}
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
