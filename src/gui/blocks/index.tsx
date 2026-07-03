import { events, type ITarget, type IVM } from '../../types/vm';
import styles from './index.module.scss';
import BlocklyWorkspace from './Blockly/index';
import { useEffect, useState } from 'react';

const WorkSpace = ({ vm }: { vm: IVM }): React.ReactNode => {
    const [targets, setTargets] = useState<ITarget[]>(vm.runtime.targets);
    useEffect(() => {
        const handleTargetsUpdate = () => {
            setTargets([...vm.runtime.targets])
        }
        // 在开发模式下useEffect会执行两次
        // 所以要先卸载
        vm.off(events.UPDATE_PROJECT, handleTargetsUpdate)
        vm.on(events.UPDATE_PROJECT, handleTargetsUpdate);
        return(() => {
            vm.off(events.UPDATE_PROJECT, handleTargetsUpdate)
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <div className={styles.workspace}>
            <div className={styles.targets}>
                <ul>
                {targets.map(target => (
                    <li key={target.id}>{target.name}</li>
                ))}
                </ul>
            </div>
            <BlocklyWorkspace vm={vm} />
        </div>
    );
};

export default WorkSpace;
