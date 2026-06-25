import type { IVM } from '../../types/vm';
import styles from './index.module.css';
import BlocklyWorkspace from './Blockly/index';

const WorkSpace = ({ vm }: { vm: IVM }): React.ReactNode => {
    return (
        <div className={styles.workspace}>
            <BlocklyWorkspace vm={vm} />
        </div>
    );
};

export default WorkSpace;
