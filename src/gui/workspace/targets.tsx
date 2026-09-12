/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import classNames from 'classnames';
import { events, type ITarget, type IVM, type TTargetMode } from '../../types/vm/vm';
import styles from './targets.module.scss';

import { t } from 'i18next';
import { useTabsStore } from '../../stores/useTabsStore';
import { modal } from '../../components/Modal/modal';
import { PromptModal } from '../../components/modal_prompt';
import { useEffect, useState } from 'react';

import { isValidTargetName, spawnRandomString } from '../../utils/ash-data';
import { TargetsList } from '../../components/targets';
import { TargetAttributes } from '../../components/targetAttributes';
import { useTargetsStore } from '../../stores/useTargetsStore';

const TargetsPanel = ({ vm }: { vm: IVM }) => {
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
        useTabsStore.getState().openSpecialTab('create_project');
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

    useEffect(() => {
        const handleTargetSwitch = () => {
            const target = vm.runtime.targets.get(vm.runtime.editingTargetID) ?? null;
            setSelectedTargetID(() => vm.runtime.editingTargetID);
            setSelectedTarget(target ? { ...target } : null);
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

                <div className={styles.targetsList}>
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
                    <TargetAttributes vm={vm} targetID={selectedTargetID} />
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
