/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import styles from './index.module.scss';
import { useCallback, useEffect, useRef, useState } from 'react';

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

    // 回调 + 关闭的统一出口
    const finish = useCallback(
        (result: string) => {
            if (callback) callback(result);
            void closeSelf();
        },
        [callback, closeSelf],
    );

    // 用 ref 持有最新的输入值与回调，keydown 监听只挂载一次，
    // 不再随每次按键重绑事件监听器
    const nowValueRef = useRef(nowValue);
    const finishRef = useRef(finish);
    useEffect(() => {
        nowValueRef.current = nowValue;
        finishRef.current = finish;
    }, [nowValue, finish]);

    useEffect(() => {
        const handleEnterClick = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' || e.isComposing) return;
            finishRef.current(nowValueRef.current);
        };
        document.addEventListener('keydown', handleEnterClick);
        return () => {
            document.removeEventListener('keydown', handleEnterClick);
        };
    }, []);

    return (
        <Modal
            windowID='prompt'
            fullScreen={false}
            close={closeSelf}
            title={t('gui:prompt.title')}
            description={t('gui:prompt.description')}
            minWidth={400}
            minHeight={350}
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
                            finish(nowValue);
                        }}
                    >
                        {t('gui:button.done')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
