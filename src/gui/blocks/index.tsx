import {
    allBuiltInTabs,
    events,
    type TallBuiltInTabs,
    type ITarget,
    type IVM,
} from '../../types/vm';
import styles from './index.module.scss';
import BlocklyWorkspace from './Blockly/index';
import { useEffect, useState, type FunctionComponent, type SVGProps } from 'react';
import classNames from 'classnames';

import SpriteIcon from '../../assets/sprite.svg?react';
import { t } from 'i18next';
import SelectBar from '../../components/workspace/selectBar';

const TabButton = ({
    id,
    selected,
    callback,
    ICON,
}: {
    id: string;
    selected: string;
    callback?: (id: string) => void;
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
    const [targets, setTargets] = useState<ITarget[]>(vm.runtime.targets);
    const [tabSelected, setTabSelect] = useState<string>(allBuiltInTabs.TARGETS);

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
        <div className={styles.main}>
            <div className={styles.mainContents}>
                <div className={styles.pageContent}>
                    <div className={styles.tabs}>
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
                        <SelectBar title={t('gui:object')}>
                            <ul className={styles.targets}>
                                {targets.map(target => (
                                    <li
                                        key={target.id}
                                        className={classNames(styles.target, {
                                            [styles.selected]:
                                                target.id === vm.runtime.editingTargetID,
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
                        </SelectBar>
                    </div>
                    <div className={styles.editor}>
                        <div className={styles.toolBar}>
                            <div className={styles.toolBarLeft}></div>
                            <div className={styles.toolBarRight}>
                                <button>{'Testing'}</button>
                            </div>
                        </div>
                        <BlocklyWorkspace vm={vm} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkSpace;
