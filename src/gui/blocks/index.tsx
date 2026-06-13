import type { IFVM } from '../../typescript/interface';
import styles from './index.module.css'


const WorkSpace = ({ vm }: {vm: IFVM}): React.ReactNode => {
    return (
        <div className={styles.workspace} >
            {/* 等待LTY制作renderer然后套用 */}
        </div>
    )
}

export default WorkSpace;