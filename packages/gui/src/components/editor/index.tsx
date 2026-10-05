import { QuickOpen_coverLayer } from '../quickOpen';
import { Menubar } from './menubar';
import styles from './index.module.scss';

export const Editor = () => {
    return (
        <div>
            <div className={styles.main}>
                <Menubar />
            </div>
            <QuickOpen_coverLayer />
        </div>
    );
};
