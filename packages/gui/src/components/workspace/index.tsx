import styles from './index.module.scss';
import { Sidebar } from './sidebar';

export const Workspace = () => {
    return (
        <div className={styles.main}>
            <Sidebar />
        </div>
    );
};
