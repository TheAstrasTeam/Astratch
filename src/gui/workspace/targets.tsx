/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import classNames from 'classnames';
import { events, type ITarget, type IVM, type TTargetMode } from '../../types/vm';
import styles from './targets.module.scss';

import { t } from 'i18next';
import { guiInterface } from '../../types/gui';
import { useGUIStore } from '../../stores/useGUIStore';
import { modal } from '../../components/Modal/modal';
import { PromptModal } from '../../components/modal_prompt';
import { useEffect, useState } from 'react';

import { isValidTargetName, spawnRandomString } from '../../utils/ash-string';
import { TargetsList } from '../../components/targets';
import { useTargetsStore } from '../../stores/useTargetsStore';

import SpriteIcon from '../../assets/sprite.svg?react';
import SizeIcon from '../../assets/magnifyingGlass.svg?react';
import DirectionIcon from '../../assets/direction.svg?react';
import ArrowIcon from '../../assets/arrow.svg?react';

const TargetsPanel = ({ vm }: { vm: IVM }) => {
    const setInterface = useGUIStore(state => state.setInterface);

    const [currentTargetTab, setCurrentTargetTab] = useState<TTargetMode>('entity');

    const handleSwitchTargetTab = (tab: TTargetMode) => {
        setCurrentTargetTab(tab);
    };

    const handleTargetChange = (id: string) => {
        vm.runtime.switchTarget(id);
    };

    const handleCreateObject = (mode: TTargetMode, parent: string | null = null) => {
        const handleCreateObjectCallback = (result: string) => {
            if (isValidTargetName(result)) vm.runtime.createTarget({ name: result, parent, mode });
        };
        void modal.open(PromptModal, {
            message: mode === 'entity' ? t('gui:modal.ask.entity') : t('gui:modal.ask.module'),
            defaultValue: '',
            callback: handleCreateObjectCallback,
        });
    };
    const handleCreateFolder = (mode: TTargetMode, parent: string | null = null) => {
        const handleCreateObjectCallback = (result: string) => {
            if (isValidTargetName(result))
                vm.runtime.addFolder(mode, {
                    name: result,
                    id: spawnRandomString(),
                    color: '#0099ff',
                    parentID: parent,
                });
        };
        void modal.open(PromptModal, {
            message: t('gui:target.folderNameAsk'),
            defaultValue: '',
            callback: handleCreateObjectCallback,
        });
    };

    const handleCreateProject = () => {
        setInterface(guiInterface.CREATE_PROJECT);
    };

    const [selectedTargetID, setSelectedTargetID] = useState(vm.runtime.editingTargetID);
    const [selectedTarget, setSelectedTarget] = useState<ITarget | null>(
        vm.runtime.targets.get(selectedTargetID) ?? null,
    );
    // React Compiler 的自动 memo 会跳过 props 未变化的子组件渲染
    // 太坏了，害了AI花了很久才修复😭
    const [targetsVersion, setTargetsVersion] = useState(0);

    // 文件夹展开状态放在全局 store 管理，
    // 这样 tab 切换导致本组件卸载/重挂载时展开状态也不会丢失
    const expandedFolders = useTargetsStore(state => state.expandedFolders);
    const toggleFolder = useTargetsStore(state => state.toggleFolder);

    const [isOpenTargetPanel, setOpenTargetPanel] = useState<boolean>(false);
    const [hasToggledTargetPanel, setHasToggledTargetPanel] = useState<boolean>(false);

    useEffect(() => {
        const handleTargetSwitch = () => {
            setSelectedTargetID(() => vm.runtime.editingTargetID);
            setSelectedTarget(vm.runtime.targets.get(vm.runtime.editingTargetID) ?? null);
            setTargetsVersion(v => v + 1);
        };

        vm.off(events.SWITCH_TARGET, handleTargetSwitch);
        vm.off(events.CREATE_PROJECT, handleTargetSwitch);
        vm.off(events.UPDATE_TARGET_STRUCTURE, handleTargetSwitch);
        vm.on(events.SWITCH_TARGET, handleTargetSwitch);
        vm.on(events.UPDATE_TARGET_STRUCTURE, handleTargetSwitch);
        vm.on(events.CREATE_PROJECT, handleTargetSwitch);
        return () => {
            vm.off(events.SWITCH_TARGET, handleTargetSwitch);
            vm.off(events.CREATE_PROJECT, handleTargetSwitch);
            vm.off(events.UPDATE_TARGET_STRUCTURE, handleTargetSwitch);
        };
    }, [vm]);

    const handleTargetPanelClick = () => {
        setHasToggledTargetPanel(true);
        setOpenTargetPanel(!isOpenTargetPanel);
    }

    if (vm.isEditingProject)
        return (
            <>
                <div className={styles.targetsTab}>
                    <button
                        className={classNames(styles.targetTab, {
                            [styles.isEnable]: currentTargetTab === 'entity',
                        })}
                        onClick={() => {
                            handleSwitchTargetTab('entity');
                        }}
                    >
                        {t('gui:target.entity')}
                    </button>
                    <button
                        className={classNames(styles.targetTab, {
                            [styles.isEnable]: currentTargetTab === 'module',
                        })}
                        onClick={() => {
                            handleSwitchTargetTab('module');
                        }}
                    >
                        {t('gui:target.module')}
                    </button>
                </div>
                <div
                    className={classNames(styles.targetsList, {
                        [styles.closeList]: isOpenTargetPanel,
                        [styles.openList]: hasToggledTargetPanel && !isOpenTargetPanel,
                    })}
                >
                    {currentTargetTab === 'entity' ? (
                        <TargetsList
                            key={targetsVersion}
                            mode='entity'
                            vm={vm}
                            selected={selectedTargetID}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            onSwitch={handleTargetChange}
                            onAdd={handleCreateObject}
                            onAddFolder={handleCreateFolder}
                        />
                    ) : (
                        <TargetsList
                            key={targetsVersion}
                            mode='module'
                            vm={vm}
                            selected={selectedTargetID}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            onSwitch={handleTargetChange}
                            onAdd={handleCreateObject}
                            onAddFolder={handleCreateFolder}
                        />
                    )}
                </div>
                {selectedTargetID && selectedTarget && (
                    <div className={classNames(styles.targetPanel, {
                        [styles.isExpand]: isOpenTargetPanel
                    })} onClick={handleTargetPanelClick}>
                        {selectedTarget.mode === 'entity' && (
                            <div className={styles.targetPanelTop}>
                                <div className={styles.targetPanelInfo}>
                                    <SizeIcon />
                                    <span>{selectedTarget.size}</span>
                                </div>
                                <div className={styles.targetPanelInfo}>
                                    <DirectionIcon
                                        style={{
                                            transform: `rotate(${String(selectedTarget.direction ?? 90)}deg)`,
                                        }}
                                    />
                                    <span>{selectedTarget.direction}</span>
                                </div>
                                <div className={styles.targetPanelInfo}>
                                    <ArrowIcon />
                                    <span>{selectedTarget.x}</span>
                                </div>
                                <div className={styles.targetPanelInfo}>
                                    <ArrowIcon className={styles.targetPanelInfoY} />
                                    <span>{selectedTarget.y}</span>
                                </div>
                            </div>
                        )}
                        <div className={styles.targetPanelBottom}>
                            <div className={styles.targetPanelLeft}>
                                <SpriteIcon className={styles.targetPanelIcon} />
                            </div>
                            <div className={styles.targetPanelRight}>
                                <span className={styles.targetPanelTitle}>
                                    {selectedTarget.mode === 'module'
                                        ? t('gui:target.module')
                                        : t('gui:target.entity')}
                                </span>
                                <span className={styles.targetPanelContent}>
                                    {selectedTarget.name}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    else
        return (
            <div className={styles.notInProjectContent}>
                <span className={styles.notInProjectSpan}>{t('gui:panel.notInProject')}</span>
                <button onClick={handleCreateProject}>
                    {/* 至于为什么这里用start，你懂什么，这叫复用 */}
                    {t('gui:start.createProject')}
                </button>
            </div>
        );
};

export default TargetsPanel;
