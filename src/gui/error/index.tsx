/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 错误界面

import { t } from 'i18next';
import errorLogo from '../../assets/errorLogo.svg';
import styles from './index.module.scss';

interface ErrorProps {
    onStillEnter?: () => void;
}

const getBrowserName = (): string => {
    const ua = navigator.userAgent;
    if (ua.includes('Edg/')) return 'Microsoft Edge';
    if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Chrome/') || ua.includes('Chromium')) return 'Google Chrome';
    if (ua.includes('Safari/')) return 'Safari';
    return 'Unknown Browser';
};

const Error: React.FC<ErrorProps> = ({ onStillEnter }) => {
    return (
        <div className={styles.main}>
            <img className={styles.icon} src={errorLogo} alt='' />
            <h1 className={styles.title}>{t('gui:error.title')}</h1>
            <p className={styles.description}>
                {t('gui:error.description', { browser: getBrowserName() })}
            </p>
            <p className={styles.stillEnter} onClick={onStillEnter}>
                {t('gui:error.stillEnter')}
            </p>
        </div>
    );
};

export default Error;
