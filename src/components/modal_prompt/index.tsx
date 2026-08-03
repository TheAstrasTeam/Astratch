/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import styles from './index.module.scss';
import { useCallback, useEffect, useState } from 'react';

export const PromptModal = ({
    message,
    defaultValue,
    callback,
}: {
    message: string;
    defaultValue: string;
    callback: ((result: string) => void) | undefined;
}) => {
    const [nowValue, setValue] = useState<string>(defaultValue);
    const { closeSelf } = useModalInstance();

    const handleButtonClick = useCallback(
        async (result: string, close: unknown = null) => {
            if (callback) callback(result);
            await closeSelf(close);
        },
        [callback, closeSelf],
    );

    useEffect(() => {
        const handleEnterClick = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' || e.isComposing) return;
            void handleButtonClick(nowValue);
        };
        document.addEventListener('keydown', handleEnterClick);
        return () => {
            document.removeEventListener('keydown', handleEnterClick);
        };
    }, [handleButtonClick, nowValue]);

    return (
        <Modal
            fullScreen={false}
            close={async result => {
                await handleButtonClick(nowValue, result);
            }}
            title={t('gui:prompt.title')}
            description={t('gui:prompt.description')}
        >
            <div className={styles.content}>
                <div className={styles.state}>
                    <span>{message}</span>
                    <input
                        className={styles.text}
                        value={nowValue}
                        onChange={e => {
                            setValue(e.target.value);
                        }}
                        autoFocus
                    />
                </div>
                <div className={styles.buttons}>
                    <button
                        onClick={() => {
                            void handleButtonClick(nowValue);
                        }}
                    >
                        {t('gui:button.done')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
