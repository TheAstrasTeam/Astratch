/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    allBuiltInTabs,
    events,
    type ITarget,
    type IVM,
    type TallBuiltInTabs,
} from '../../types/vm';
import styles from './index.module.scss';
import BlocklyWorkspace from './Blockly/index';
import { useEffect, useMemo, useState, type FunctionComponent, type SVGProps } from 'react';
import classNames from 'classnames';

import SpriteIcon from '../../assets/sprite.svg?react';
import EmptyTip from '../../assets/empty.svg?react';
import EmptyTip2 from '../../assets/empty2.svg?react';

import { t } from 'i18next';
import SelectBar from '../../components/workspace/selectBar';
import { useGUIStore } from '../../stores/useGUIStore';
import { guiInterface } from '../../types/gui';
import Start from '../start';
import CreateProject from '../createProjet';
import TargetsPanel from './targets';
import SplitPane from '../../components/splitPane';
import { debounce } from '../../utils/ash-debounce';
import { BottomBar } from '../bottomBar';
import { shortcutManager } from '../../lib/ShortcutManager';
import { SHORTCUTS } from '../../types/lib';

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
    const [selectedTarget, setSelectedTarget] = useState<ITarget | null>(
        vm.runtime.targets.get(vm.runtime.editingTargetID) ?? null,
    );

    useEffect(() => {
        const handleTargetsUpdate = () => {
            setTargetsRevision(revision => revision + 1);
            setSelectedTarget(vm.runtime.targets.get(vm.runtime.editingTargetID) ?? null);
        };
        const handleSwitchTargetTab = () => {
            setSelectedTarget(vm.runtime.targets.get(vm.runtime.editingTargetID) ?? null);
        };

        vm.off(events.UPDATE_TARGET_STRUCTURE, handleTargetsUpdate);
        vm.off(events.SWITCH_TARGET, handleSwitchTargetTab);
        vm.off(events.CREATE_PROJECT, handleSwitchTargetTab);
        vm.on(events.UPDATE_TARGET_STRUCTURE, handleTargetsUpdate);
        vm.on(events.SWITCH_TARGET, handleSwitchTargetTab);
        vm.on(events.CREATE_PROJECT, handleSwitchTargetTab);
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
            vm.off(events.SWITCH_TARGET, handleSwitchTargetTab);
            vm.off(events.CREATE_PROJECT, handleSwitchTargetTab);
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
        if (selectedTarget) return <BlocklyWorkspace vm={vm} />;
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
    };

    return (
        <div className={styles.main}>
            <div className={styles.toolBar}>
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
                        ICON={SpriteIcon}
                        callback={setTabSelect}
                    />
                    <TabButton
                        selected={tabSelected}
                        id={allBuiltInTabs.DEBUG}
                        ICON={SpriteIcon}
                        callback={setTabSelect}
                    />
                </div>
                <div className={styles.toolBarLeft}>
                    <button>{'Testing'}</button>
                </div>
                <div className={styles.toolBarRight}>
                    <button>{'Testing'}</button>
                </div>
            </div>
            <div className={styles.workspace}>
                <SplitPane
                    direction='horizontal'
                    defaultRatio={0.2}
                    minFirst={50}
                    minSecond={150}
                    first={renderToolBar()}
                    second={renderEditorContent()}
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
