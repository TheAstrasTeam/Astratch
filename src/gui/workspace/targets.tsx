import classNames from 'classnames';
import type { ITarget, IVM } from '../../types/vm';
import styles from './targets.module.scss';

import SpriteIcon from '../../assets/sprite.svg?react';
import { t } from 'i18next';
import { guiInterface } from '../../types/gui';
import { useGUIStore } from '../../stores/useGUIStore';

const TargetsPanel = ({ targets, vm }: { targets: ITarget[]; vm: IVM }) => {
    const setInterface = useGUIStore(state => state.setInterface);

    const handleTargetChange = (id: string) => {
        vm.runtime.switchTarget(id);
    };

    const handleCreateObject = () => {
        const name = prompt(t('gui:objectNameAsk'));
        if (name) vm.runtime.createTarget({ name: name });
    };

    const handleCreateProject = () => {
        setInterface(guiInterface.CREATE_PROJECT);
    };

    if (vm.isEditingProject)
        return (
            <>
                <ul className={styles.targets}>
                    {targets.map(target => (
                        <li
                            key={target.id}
                            className={classNames(styles.target, {
                                [styles.selected]: target.id === vm.runtime.editingTargetID,
                            })}
                            onClick={() => {
                                handleTargetChange(target.id);
                            }}
                        >
                            <SpriteIcon />
                            {target.name}
                        </li>
                    ))}
                </ul>
                <button onClick={handleCreateObject}>{t('gui:createObject')}</button>
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
