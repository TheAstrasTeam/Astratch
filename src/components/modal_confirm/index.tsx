/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import styles from './index.module.scss';

export const ConfirmModal = ({
    message,
    callback,
}: {
    message: string;
    callback: ((result: boolean) => void) | undefined;
}) => {
    const { closeSelf } = useModalInstance();

    // 回调 + 关闭的统一出口
    const finish = async (result: boolean) => {
        if (callback) callback(result);
        await closeSelf();
    };

    return (
        <Modal
            windowID='confirm'
            fullScreen={false}
            close={closeSelf}
            title={t('gui:confirm.title')}
            description={t('gui:confirm.description')}
            minWidth={400}
            minHeight={350}
        >
            <div className={styles.content}>
                <div className={styles.text}>{message}</div>
                <div className={styles.buttons}>
                    <button
                        onClick={() => {
                            void finish(true);
                        }}
                    >
                        {t('gui:button.ok')}
                    </button>
                    <button
                        onClick={() => {
                            void finish(false);
                        }}
                    >
                        {t('gui:button.no')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
