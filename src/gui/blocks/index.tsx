import type { IVM } from '../../types/vm';
import styles from './index.module.css'


const WorkSpace = ({ vm }: {vm: IVM}): React.ReactNode => {
    return (
        <div className={styles.workspace} >
            {/* 等待LTY制作renderer然后套用 */}
        </div>
    )
}

export default WorkSpace;