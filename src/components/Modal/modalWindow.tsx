import classNames from 'classnames';
import styles from './modalWindow.module.scss';
import { useState } from 'react';

import CloseICON from '../../assets/close.svg?react';
import MiniSizeICON from '../../assets/miniScreen.svg?react';
import FullSizeICON from '../../assets/fullScreen.svg?react';

export const Modal = ({
    fullScreen,
    close,
    children,
    title,
    description,
}: {
    fullScreen?: boolean;
    close?: (result?: unknown) => Promise<void>;
    children?: React.ReactNode;
    title?: string;
    description?: string;
}) => {
    const [isFullScreen, setFullScreen] = useState<boolean>(fullScreen ?? false);
    return (
        <div
            className={classNames(styles.modal, {
                [styles.fullScreen]: isFullScreen,
            })}
        >
            <div className={styles.bar}>
                <div className={styles.barLeft}>
                    <span title={description}>{title}</span>
                </div>
                <div className={styles.barRight}>
                    <button
                        onClick={() => {
                            if (close) void close();
                        }}
                        className={styles.controlButton}
                    >
                        <CloseICON />
                    </button>
                    <button
                        className={styles.controlButton}
                        onClick={() => {
                            if (isFullScreen) setFullScreen(false);
                            else setFullScreen(true);
                        }}
                    >
                        {isFullScreen ? <MiniSizeICON /> : <FullSizeICON />}
                    </button>
                </div>
            </div>
            <div className={styles.content}>{children}</div>
        </div>
    );
};
