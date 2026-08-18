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
import { useCallback, useState } from 'react';
import { type IVM } from '../../types/vm';
import { CreateFunctionWorkspace } from './blockWorkspace';
import { FieldTypeModal } from './modal_fieldType';
import {
    addFieldForFunctionPreview,
    previewBlockColor,
    previewFunctionBlocksColorScheme,
    resizePreviewWorkspace,
    setPreviewBlockColor,
} from './functionPreview';
import { DropDownIcon, StringIcon, TextIcon } from './icons';
import { ColorPickerButton } from '../colorPickerButton';
import type { IBlockColor } from '../../types/blocks';
import type { TFunctionFieldType } from './functionPreview';
import type { JSX } from 'react/jsx-dev-runtime';
import * as Blockly from 'blockly/core';

import DropdownTipIcon from '../../assets/dorpdown.svg?react';

// 此组件由AI生成：创建函数弹窗中的大号字段类型按钮
const BigSelector = ({
    icon,
    label,
    onClick,
    isDropdown = false,
}: {
    icon: JSX.Element;
    label: string;
    onClick: () => void;
    isDropdown?: boolean;
}) => {
    return (
        <div className={styles.bigSelector} onClick={onClick}>
            {icon}
            <span>
                {label}
                {isDropdown && <DropdownTipIcon />}
            </span>
        </div>
    );
};

export const CreateFunctionModal = ({ vm, addID: _addID }: { vm: IVM; addID?: string }) => {
    const { closeSelf } = useModalInstance();
    const [blockColor, setBlockColor] = useState<IBlockColor>(previewBlockColor);

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
        setBlockColor(color);
        setPreviewBlockColor(color);
    };

    // 此函数由AI生成
    /** 自定义取色：只有单个 hex，按 zelos 同款比例推导 secondary/tertiary。 */
    const handlePickColor = (hex: string) => {
        const color: IBlockColor = {
            primary: hex,
            secondary: Blockly.utils.colour.blend('#000', hex, 0.15) ?? hex,
            tertiary: Blockly.utils.colour.blend('#000', hex, 0.25) ?? hex,
            quaternary: hex,
        };
        setBlockColor(color);
        setPreviewBlockColor(color);
    };

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
                        icon={<DropDownIcon color={blockColor} />}
                        label={t('gui:createFunction.dropdown')}
                        onClick={() => {
                            handleAddFieldButtonClick('dropdown');
                        }}
                    />
                    <BigSelector
                        icon={<StringIcon color={blockColor} />}
                        label={t('gui:createFunction.input')}
                        onClick={() => {
                            void modal.open(FieldTypeModal, {
                                callback: handleAddFieldButtonClick,
                            });
                        }}
                        isDropdown={true}
                    />
                    <BigSelector
                        icon={<TextIcon color={blockColor} />}
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
                    <ColorPickerButton
                        value={blockColor.primary ?? ''}
                        onChange={handlePickColor}
                        className={styles.setBlockColorButtonPicker}
                        title={t('gui:createFunction.pickColor')}
                    />
                </div>
            </div>
        </Modal>
    );
};
