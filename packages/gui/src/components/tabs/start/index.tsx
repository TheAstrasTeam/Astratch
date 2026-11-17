import { t } from 'astratch-i18n';
import { Logo } from '../../logo';
import styles from './index.module.scss';

import CreateProjectIcon from '@as/createProject.svg?react';
import OpenProjectIcon from '@as/openProject.svg?react';
import RecentProjectIcon from '@as/recentProject.svg?react';

export const StartTab = () => {
    return (
        <div className={styles.main}>
            <div className={styles.logo}>
                <Logo />
            </div>

            <span className={styles.randomTitle}>准备好把白纸变成绚烂的画了吗？</span>
            <span className={styles.title}>{t('gui:start.fromWhere')}</span>

            <button className={styles.button}>
                <CreateProjectIcon />
                {t('gui:createProject')}
            </button>
            <button className={styles.button}>
                <OpenProjectIcon />
                {t('gui:openProject')}
            </button>
            <button className={styles.button}>
                <RecentProjectIcon />
                {t('gui:recentProject')}
            </button>
        </div>
    );
};
