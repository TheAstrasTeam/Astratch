import { QuickOpen_coverLayer } from '../quickOpen';
import { Menubar } from './menubar';
import styles from './index.module.scss';
import { BottomBar } from './bottomBar';
import { Workspace } from '../workspace';

export const Editor = () => {
    return (
        <div className={styles.main}>
            <div className={styles.editor}>
                <Menubar />
                <Workspace />
                <BottomBar />
            </div>
            <QuickOpen_coverLayer />
        </div>
    );
};
