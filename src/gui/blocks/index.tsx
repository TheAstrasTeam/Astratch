import { events, type ITarget, type IVM } from '../../types/vm';
import styles from './index.module.scss';
import BlocklyWorkspace from './Blockly/index';
import { useEffect, useState } from 'react';
import classNames from 'classnames';

import SpriteIcon from '../../assets/sprite.svg?react';
import { t } from 'i18next';

const WorkSpace = ({ vm }: { vm: IVM }): React.ReactNode => {
    const [targets, setTargets] = useState<ITarget[]>(vm.runtime.targets);
    useEffect(() => {
        const handleTargetsUpdate = () => {
            setTargets([...vm.runtime.targets]);
        };
        // 在开发模式下useEffect会执行两次
        // 所以要先卸载
        vm.off(events.UPDATE_PROJECT, handleTargetsUpdate);
        vm.on(events.UPDATE_PROJECT, handleTargetsUpdate);
        return () => {
            vm.off(events.UPDATE_PROJECT, handleTargetsUpdate);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTargetChange = (id: string) => {
        vm.runtime.switchTarget(id);
    };

    const handleCreateObject = () => {
        const name = prompt(t('gui:objectNameAsk'));
        if (name) vm.runtime.createTarget({ name: name });
    };

    return (
        <div className={styles.workspace}>
            <div className={styles.targetsBar}>
                <span className={styles.targetsBarTitle}>{t('gui:object')}</span>
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
            </div>
            <BlocklyWorkspace vm={vm} />
        </div>
    );
};

export default WorkSpace;
