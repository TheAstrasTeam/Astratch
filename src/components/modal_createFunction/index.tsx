/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { modal } from '../Modal/modal';
import { t } from 'i18next';
import styles from './index.module.scss';
import { useCallback } from 'react';
import { type IVM } from '../../types/vm';
import { CreateFunctionWorkspace } from './blockWorkspace';
import { FieldTypeModal } from './modal_fieldType';
import { addFieldForFunctionPreview, previewFunctionBlocksColorScheme, resizePreviewWorkspace, setPreviewBlockColor } from './functionPreview';
import { DropDownIcon, StringIcon, TextIcon } from './icons';
import type { IBlockColor } from '../../types/blocks';
import type { TFunctionFieldType } from './functionPreview';
import type { JSX } from 'react/jsx-dev-runtime';

// 此组件由AI生成：创建函数弹窗中的大号字段类型按钮
const BigSelector = ({
    icon,
    label,
    onClick,
}: {
    icon: JSX.Element;
    label: string;
    onClick: () => void;
}) => {
    return (
        <div className={styles.bigSelector} onClick={onClick}>
            {icon}
            <span>{label}</span>
        </div>
    );
};

export const CreateFunctionModal = ({ vm, addID: _addID }: { vm: IVM; addID?: string }) => {
    const { closeSelf } = useModalInstance();

    const handleButtonClick = useCallback(
        async (close: unknown = null) => {
            await closeSelf(close);
        },
        [closeSelf],
    );

    const handleAddFieldButtonClick = (result: TFunctionFieldType) => {
        addFieldForFunctionPreview({
            type: result,
        });
    };

    const handleAddText = () => {
        addFieldForFunctionPreview({
            type: 'text',
            text: 'Hello World!',
        });
    };

    const handleSetBlockColor = (color: IBlockColor) => {
        setPreviewBlockColor(color);
    }

    return (
        <Modal
            fullScreen={false}
            onFullScreen={resizePreviewWorkspace}
            close={async () => {
                await handleButtonClick();
            }}
            title={t('gui:createFunction.title')}
            description={t('gui:createFunction.description')}
        >
            <div className={styles.content}>
                <CreateFunctionWorkspace vm={vm} />
                <div className={styles.addFieldContent}>
                    <BigSelector
                        icon={<DropDownIcon />}
                        label={t('gui:createFunction.dropdown')}
                        onClick={() => {
                            handleAddFieldButtonClick('dropdown');
                        }}
                    />
                    <BigSelector
                        icon={<StringIcon />}
                        label={t('gui:createFunction.input')}
                        onClick={() => {
                            void modal.open(FieldTypeModal, {
                                callback: handleAddFieldButtonClick,
                            });
                        }}
                    />
                    <BigSelector
                        icon={<TextIcon />}
                        label={t('gui:createFunction.text')}
                        onClick={handleAddText}
                    />
                </div>
                <div className={styles.setBlockColor}>
                    {previewFunctionBlocksColorScheme.map((color, index) => (
                        <div
                            className={styles.setBlockColorButton}
                            key={index}
                            style={{
                                background: color.primary,
                                borderColor: color.secondary,
                            }}
                            onClick={() => {
                                handleSetBlockColor(color);
                            }}
                        />
                    ))}
                    <div
                        className={styles.setBlockColorButton}
                    ></div>
                </div>
            </div>
        </Modal>
    );
};
