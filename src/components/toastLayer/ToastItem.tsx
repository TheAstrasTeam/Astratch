import { t } from 'i18next';
import classNames from 'classnames';
import type { IToast } from '../../types/lib';
import styles from './index.module.scss';

import Info from '../../assets/info.svg?react';
import Warn from '../../assets/warn.svg?react';
import Error from '../../assets/error.svg?react';

const getImg = (toast: IToast) => {
    switch (toast.type) {
        case 'warn':
            return <Warn style={{ color: '#eeee00' }} />;
        case 'error':
            return <Error style={{ color: '#ee2222' }} />;
        default:
            return <Info style={{ color: '#0099ee' }} />;
    }
};

export const ToastItem = ({
    toast,
    onClick,
    needSpinner = true,
}: {
    toast: IToast;
    onClick: () => void;
    needSpinner?: boolean;
}) => {
    return (
        <div
            className={styles.toast}
            data-type={toast.type}
            data-archived={toast.archivedAt !== undefined ? 'true' : 'false'}
            onClick={onClick}
        >
            <div className={styles.title}>
                {getImg(toast)}
                <span className={styles.titleText}>{t(`gui:${toast.type}`)}</span>
            </div>
            <div
                className={classNames(styles.content, {
                    [styles.notSpinner]:
                        (toast.type !== 'progress' && toast.type !== 'spinner') || !needSpinner,
                })}
            >
                <span className={styles.text}>{toast.text}</span>
            </div>
            {toast.type === 'progress' && needSpinner && (
                <progress className={styles.progress} value={toast.progress ?? 0} max={1} />
            )}
            {toast.type === 'spinner' && needSpinner && (
                <div className={styles.spinner} aria-hidden />
            )}
        </div>
    );
};
