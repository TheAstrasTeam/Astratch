import { t } from 'astratch-i18n';

import styles from './index.module.scss';

import LogoIcon from '@as/logo/transparent.svg?react';
import { useQuickOpen } from '../../quickOpen/api';

export const Menubar = () => {
    const openQuickOpen = useQuickOpen(state => state.openQuickOpen);
    return (
        <div className={styles.main}>
            <div className={styles.left}>
                <LogoIcon className={styles.logoIcon} />
            </div>
            <div className={styles.center}>
                <div className={styles.quickOpenInput} onClick={openQuickOpen}>
                    {t('gui:quickOpen_tip')}
                </div>
            </div>
            <div className={styles.right}></div>
        </div>
    );
};
