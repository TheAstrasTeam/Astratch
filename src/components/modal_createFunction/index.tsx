/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import styles from './index.module.scss';
import { useCallback } from 'react';
import { type IVM } from '../../types/vm';
import { CreateFunctionWorkspace } from './blockWorkspace';
import { addFieldForFunctionPreview, resizePreviewWorkspace } from './functionPreview';
import { modal } from '../Modal/modal';
import { AddFieldModal } from './modal_addField';

export const CreateFunctionModal = ({ vm, addID: _addID }: { vm: IVM; addID?: string }) => {
    const { closeSelf } = useModalInstance();

    const handleButtonClick = useCallback(
        async (close: unknown = null) => {
            await closeSelf(close);
        },
        [closeSelf],
    );

    const handleAddFieldButtonClick = () => {
        void modal.open(AddFieldModal, {
            callback: (result) => {
                addFieldForFunctionPreview({
                    type: result
                });
            }
        })
    }

    const handleAddText = () => {
        addFieldForFunctionPreview({
            type: 'text',
            text: 'Hello World!'
        });
    }

    return (
        <Modal
            fullScreen={false}
            onFullScreen={resizePreviewWorkspace}
            close={async result => {
                await handleButtonClick(result);
            }}
            title={t('gui:createFunction.title')}
            description={t('gui:createFunction.description')}
        >
            <div className={styles.content}>
                <CreateFunctionWorkspace vm={vm} />
                <button onClick={handleAddFieldButtonClick}>
                    {t('gui:createFunction.addField')}
                </button>
                <button onClick={handleAddText}>
                    {t('gui:createFunction.addText')}
                </button>
            </div>
        </Modal>
    );
};
