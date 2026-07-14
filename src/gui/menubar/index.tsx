import type { IVM } from '../../types/vm';
import styles from './index.module.scss';
import logo from '../../assets/ashIconLight.svg';
import { t } from 'i18next';

const MenuBar = ({ vm }: { vm: IVM }): React.ReactNode => {
    return (
        <div className={styles.menubarContents}>
            <div className={styles.menubarContentsLeft}>
                <img className={styles.menubarContentLogo} src={logo} />
            </div>
            <div className={styles.menubarContentsCenter}>
                <input
                    className={styles.search}
                    placeholder={t('gui:searchTip')}
                ></input>
            </div>
            <div className={styles.menubarContentsRight}>Right</div>
        </div>
    );
};

export default MenuBar;
