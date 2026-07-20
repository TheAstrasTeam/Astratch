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
    const [targets, setTargets] = useState<ITarget[]>(vm.runtime.targets);
    const [tabSelected, setTabSelect] = useState<TallBuiltInTabs>(allBuiltInTabs.TARGETS);

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

    const renderEditorContent = () => {
        if (nowGuiInterface === guiInterface.START) {
            return <Start vm={vm} />;
        }
        if (nowGuiInterface === guiInterface.CREATE_PROJECT) {
            return <CreateProject vm={vm} />;
        }
        return <BlocklyWorkspace vm={vm} />;
    };
    const renderToolBar = () => {
        if (tabSelected === allBuiltInTabs.TARGETS)
            return (
                <SelectBar title={t('gui:object')}>
                    <TargetsPanel targets={targets} vm={vm} />
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
