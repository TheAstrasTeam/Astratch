/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import styles from './index.module.scss';
import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { DATA_VISIBILITY, type IVM, type TDATA_VISIBILITY } from '../../types/vm';

export const CreateDataModal = ({ vm, addID }: { vm: IVM; addID?: string }) => {
    const [nowValue, setValue] = useState<string>('');
    const [nowMode, setMode] = useState<TDATA_VISIBILITY>(DATA_VISIBILITY.PUBLIC);
    const [AddID, _] = useState(() => addID ?? vm.runtime.editingTargetID);
    const { closeSelf } = useModalInstance();

    const handleButtonClick = useCallback(
        async (close: unknown = null) => {
            vm.runtime.createData(
                AddID,
                nowValue,
                null,
                nowMode === DATA_VISIBILITY.PRIVATE,
                false,
            );
            await closeSelf(close);
        },
        [AddID, closeSelf, nowMode, nowValue, vm.runtime],
    );

    const handleModeChanged = (e: ChangeEvent<HTMLSelectElement, HTMLSelectElement>) => {
        setMode(e.currentTarget.value as TDATA_VISIBILITY);
    };

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
                await handleButtonClick(result);
            }}
            title={t('gui:prompt.title')}
            description={t('gui:prompt.description')}
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
