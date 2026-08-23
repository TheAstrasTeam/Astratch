/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import styles from './index.module.scss';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { DATA_VISIBILITY, type IVM, type TDATA_VISIBILITY } from '../../types/vm';

export const CreateDataModal = ({ vm, addID }: { vm: IVM; addID?: string }) => {
    const [nowValue, setValue] = useState<string>('');
    const [nowMode, setMode] = useState<TDATA_VISIBILITY>(DATA_VISIBILITY.PUBLIC);
    const [AddID, _] = useState(() => addID ?? vm.runtime.editingTargetID);
    const { closeSelf } = useModalInstance();

    // 创建 + 关闭的统一出口
    const finish = useCallback(() => {
        if (nowValue.trim())
            vm.runtime
                .getTargetByID(AddID)
                ?.createData(nowValue, null, nowMode === DATA_VISIBILITY.PRIVATE, false);
        void closeSelf();
    }, [AddID, closeSelf, nowMode, nowValue, vm.runtime]);

    const handleModeChanged = (e: ChangeEvent<HTMLSelectElement, HTMLSelectElement>) => {
        setMode(e.currentTarget.value as TDATA_VISIBILITY);
    };

    // 用 ref 持有最新回调，keydown 监听只挂载一次，
    // 不再随每次按键重绑事件监听器
    const finishRef = useRef(finish);
    useEffect(() => {
        finishRef.current = finish;
    }, [finish]);

    useEffect(() => {
        const handleEnterClick = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' || e.isComposing) return;
            finishRef.current();
        };
        document.addEventListener('keydown', handleEnterClick);
        return () => {
            document.removeEventListener('keydown', handleEnterClick);
        };
    }, []);

    return (
        <Modal
            windowID='createData'
            fullScreen={false}
            close={closeSelf}
            title={t('gui:prompt.title')}
            description={t('gui:prompt.description')}
            minWidth={500}
            minHeight={350}
        >
            <div className={styles.content}>
                <div className={styles.state}>
                    <span>{t('blocks:data.createTip')}</span>
                    <input
                        className={styles.text}
                        value={nowValue}
                        onChange={e => {
                            setValue(e.target.value);
                        }}
                        autoFocus
                    />
                    <br />
                    <span>{t('blocks:data.createTip2')}</span>
                    <select value={nowMode} onChange={handleModeChanged}>
                        <option value={DATA_VISIBILITY.PUBLIC}>{t('gui:data.forPublic')}</option>
                        <option value={DATA_VISIBILITY.PRIVATE}>{t('gui:data.forSelf')}</option>
                    </select>
                </div>
                <div className={styles.buttons}>
                    <button
                        onClick={() => {
                            finish();
                        }}
                    >
                        {t('gui:button.done')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
