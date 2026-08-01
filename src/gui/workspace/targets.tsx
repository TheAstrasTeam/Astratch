import classNames from 'classnames';
import { events, type IVM } from '../../types/vm';
import styles from './targets.module.scss';

import { t } from 'i18next';
import { guiInterface } from '../../types/gui';
import { useGUIStore } from '../../stores/useGUIStore';
import { modal } from '../../components/Modal/modal';
import { PromptModal } from '../../components/modal_prompt';
import { useEffect, useState } from 'react';

import AddImg from '../../assets/add.svg?react';
import { isValidTargetName } from '../../utils/ash-string';
import { TargetsList } from '../../components/targets';
import { useTargetsStore } from '../../stores/useTargetsStore';

type targetTab = 'object' | 'module';

const TargetsPanel = ({ vm }: { vm: IVM }) => {
    const setInterface = useGUIStore(state => state.setInterface);

    const [currentTargetTab, setCurrentTargetTab] = useState<targetTab>('object');
    const [searchContent, setSearchContent] = useState<string | null>(null);

    const handleSwitchTargetTab = (tab: targetTab) => {
        setCurrentTargetTab(tab);
    };

    const handleTargetChange = (id: string) => {
        vm.runtime.switchTarget(id);
    };

    const handleCreateObject = () => {
        const handleCreateObjectCallback = (result: string) => {
            if (isValidTargetName(result)) vm.runtime.createTarget({ name: result });
        };
        void modal.open(PromptModal, {
            message: t('gui:objectNameAsk'),
            defaultValue: '',
            callback: handleCreateObjectCallback,
        });
    };

    const handleCreateProject = () => {
        setInterface(guiInterface.CREATE_PROJECT);
    };

    const [selectedTargetID, setSelectedTargetID] = useState(vm.runtime.editingTargetID);
    // React Compiler 的自动 memo 会跳过 props 未变化的子组件渲染
    // 太坏了，害了AI花了很久才修复😭
    const [targetsVersion, setTargetsVersion] = useState(0);

    // 文件夹展开状态放在全局 store 管理，
    // 这样 tab 切换导致本组件卸载/重挂载时展开状态也不会丢失
    const expandedFolders = useTargetsStore(state => state.expandedFolders);
    const toggleFolder = useTargetsStore(state => state.toggleFolder);

    useEffect(() => {
        const handleTargetSwitch = () => {
            setSelectedTargetID(() => vm.runtime.editingTargetID);
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
                            [styles.isEnable]: currentTargetTab === 'object',
                        })}
                        onClick={() => {
                            handleSwitchTargetTab('object');
                        }}
                    >
                        {t('gui:object')}
                    </button>
                    <button
                        className={classNames(styles.targetTab, {
                            [styles.isEnable]: currentTargetTab === 'module',
                        })}
                        onClick={() => {
                            handleSwitchTargetTab('module');
                        }}
                    >
                        {t('gui:module')}
                    </button>
                </div>
                <div>
                    {currentTargetTab === 'object' ? (
                        <div>
                            {/* 
                            [搜索   ] + 
                            模块     edit
                            模块     edit
                            */}
                            <div className={styles.bar}>
                                <input
                                    className={styles.objectSearch}
                                    placeholder={t('gui:search.object.tip')}
                                    value={searchContent ?? ''}
                                    onChange={e => {
                                        setSearchContent(e.target.value);
                                    }}
                                />
                                <button className={styles.objectAdd} onClick={handleCreateObject}>
                                    <AddImg />
                                </button>
                            </div>
                            <ul className={styles.targets}>
                                <TargetsList
                                    key={targetsVersion}
                                    mode='object'
                                    vm={vm}
                                    selected={selectedTargetID}
                                    expandedFolders={expandedFolders}
                                    toggleFolder={toggleFolder}
                                    onSwitch={handleTargetChange}
                                    searchQuery={searchContent ?? ''}
                                />
                            </ul>
                        </div>
                    ) : (
                        <div></div>
                    )}
                </div>
                {/* <button onClick={handleCreateObject}>{t('gui:createObject')}</button> */}
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
