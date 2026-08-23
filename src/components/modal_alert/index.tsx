/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import styles from './index.module.scss';

export const AlertModal = ({
    message,
    callback,
}: {
    message: string;
    callback: (() => void) | undefined;
}) => {
    const { closeSelf } = useModalInstance();

    // 回调 + 关闭的统一出口
    const finish = async () => {
        if (callback) callback();
        await closeSelf();
    };

    return (
        <Modal
            windowID='alert'
            fullScreen={false}
            close={closeSelf}
            title={t('gui:alert.title')}
            description={t('gui:alert.description')}
            minWidth={400}
            minHeight={350}
        >
            <div className={styles.content}>
                <div className={styles.text}>{message}</div>
                <button onClick={() => void finish()}>{t('gui:button.ok')}</button>
            </div>
        </Modal>
    );
};
