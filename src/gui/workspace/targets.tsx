import classNames from 'classnames';
import type { ITarget, IVM } from '../../types/vm';
import styles from './targets.module.scss';

import SpriteIcon from '../../assets/sprite.svg?react';
import { t } from 'i18next';

const TargetsPanel = ({ targets, vm }: { targets: ITarget[]; vm: IVM }) => {
    const handleTargetChange = (id: string) => {
        vm.runtime.switchTarget(id);
    };

    const handleCreateObject = () => {
        const name = prompt(t('gui:objectNameAsk'));
        if (name) vm.runtime.createTarget({ name: name });
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
    else return (
        <div className={styles.notInProjectContent}>
            <span className={styles.notInProjectSpan}>尚未打开任何一个项目</span>
        </div>
    );
};

export default TargetsPanel;
