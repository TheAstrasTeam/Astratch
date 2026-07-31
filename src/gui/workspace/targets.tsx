import classNames from 'classnames';
import { events, type ITarget, type IVM } from '../../types/vm';
import styles from './targets.module.scss';

import SpriteIcon from '../../assets/sprite.svg?react';
import { t } from 'i18next';
import { guiInterface } from '../../types/gui';
import { useGUIStore } from '../../stores/useGUIStore';
import { modal } from '../../components/Modal/modal';
import { PromptModal } from '../../components/modal_prompt';
import { useEffect, useState } from 'react';

import AddImg from '../../assets/add.svg?react';
import { isValidTargetName } from '../../utils/ash-string';

type targetTab = 'object' | 'module';

const TargetsPanel = ({ targets, vm }: { targets: ITarget[]; vm: IVM }) => {
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

    const filterTargetContent = () => {
        return targets.filter(
            target =>
                !searchContent ||
                // 转小写防止严格比较造成的问题
                target.name.toLowerCase().includes(searchContent.toLocaleLowerCase()),
        );
    }

    const [selectedTargetID, setSelectedTargetID] = useState(vm.runtime.editingTargetID);

    useEffect(() => {
        const handleTargetSwitch = () => {
            setSelectedTargetID(vm.runtime.editingTargetID);
        };

        vm.on(events.SWITCH_TARGET, handleTargetSwitch);
        return () => {
            vm.off(events.SWITCH_TARGET, handleTargetSwitch);
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
                                {filterTargetContent().map(target => (
                                    <li
                                        key={target.id}
                                        className={classNames(styles.target, {
                                            [styles.selected]: target.id === selectedTargetID,
                                        })}
                                        onClick={() => {
                                            handleTargetChange(target.id);
                                        }}
                                    >
                                        <SpriteIcon />
                                        {target.name}
                                    </li>
                                ))}
                                {!filterTargetContent().length && (
                                    <span>{t('gui:search.nothing')}</span>
                                )}
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
