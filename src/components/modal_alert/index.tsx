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

    const handleButtonClick = async (result: unknown = null) => {
        if (callback) callback();
        await closeSelf(result);
    };

    return (
        <Modal
            fullScreen={false}
            close={handleButtonClick}
            title={t('gui:alert.title')}
            description={t('gui:alert.description')}
        >
            <div className={styles.content}>
                <div className={styles.text}>{message}</div>
                <button onClick={() => void handleButtonClick()}>{t('gui:button.ok')}</button>
            </div>
        </Modal>
    );
};
