import type { VM } from '../../vm';
import styles from './index.module.css'


const WorkSpace = ({ vm }: {vm: VM}): React.ReactNode => {
    return (
        <div className={styles.workspace} >
            {/* 等待LTY制作renderer然后套用 */}
        </div>
    )
}

export default WorkSpace;