import type { IVM } from '../../types/vm';
import styles from './index.module.scss';
import logo from '../../assets/ashIconLight.svg';

const MenuBar = ({ vm }: { vm: IVM }): React.ReactNode => {
    return (
        <div className={styles.menubarContents}>
            <div className={styles.menubarContentsLeft}>
                <img className={styles.menubarContentLogo} src={logo} />
            </div>
            <div className={styles.menubarContentsCenter}></div>
            <div className={styles.menubarContentsRight}></div>
        </div>
    );
};

export default MenuBar;
