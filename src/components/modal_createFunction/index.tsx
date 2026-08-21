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
    setPreviewConfig,
    setPreviewBlockColor,
    previewFunctionData,
} from './functionPreview';
import { DropDownIcon, StringIcon, TextIcon } from './icons';
import { ColorPickerButton } from '../colorPickerButton';
import type { IBlockColor, ICustomFunction } from '../../types/blocks';
import type {
    TFunctionFieldType,
    TFunctionInputField,
    TFunctionReturnType,
} from './functionPreview';
import type { JSX } from 'react/jsx-dev-runtime';
import * as Blockly from 'blockly/core';

import DropdownTipIcon from '../../assets/dorpdown.svg?react';
import { spawnRandomString } from '../../utils/ash-data';
import { sendError } from '../../utils/debug';

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

export const CreateFunctionModal = ({ vm, addID }: { vm: IVM; addID: string }) => {
    const { closeSelf } = useModalInstance();
    const [blockColor, setBlockColor] = useState<IBlockColor>(previewBlockColor);
    const [isValue, setIsValue] = useState(true);
    const [returnType, setReturnType] = useState<TFunctionReturnType>(null);

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

    const handleChangeCustomBlock = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextIsValue = !event.target.checked;
        setIsValue(nextIsValue);
        setPreviewConfig({ isValue: nextIsValue, returnType });
    };

    const handleSetReturnType = (result: TFunctionFieldType) => {
        // 返回类型 Modal 只会返回值类型、联合值类型或 null；text/dropdown
        // 是旧字段类型，为避免把它们误当成 Blockly check，明确拒绝。
        if (result === 'text' || result === 'dropdown') return;
        const nextReturnType = result;
        setReturnType(nextReturnType);
        setPreviewConfig({ isValue, returnType: nextReturnType });
    };

    const returnTypeLabel = () => {
        if (returnType === null) return t('gui:createFunction.noReturn');
        const types: TFunctionInputField[] = Array.isArray(returnType) ? returnType : [returnType];
        return types.map(type => t(`gui:createFunction.${type}`)).join(' | ');
    };

    const doneCreateFunction = () => {
        const id = spawnRandomString();
        const functionData: ICustomFunction = {
            body: structuredClone(previewFunctionData),
            color: structuredClone(previewBlockColor),
            id,
            isValue: true,
            returnType: Array.isArray(returnType) ? [...returnType] : returnType,
        };
        const target = vm.runtime.getTargetByID(addID);
        if (target) {
            target.addCustomFunction(id, functionData);
            void closeSelf();
        } else sendError(t('vm:err.target.undefined'), 'warn');
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
            windowID='createFunction'
            fullScreen={false}
            onFullScreen={resizePreviewWorkspace}
            onResize={resizePreviewWorkspace}
            close={async () => {
                await handleButtonClick();
            }}
            title={t('gui:createFunction.title')}
            description={t('gui:createFunction.description')}
            minWidth={400}
            minHeight={350}
        >
            <div className={styles.content}>
                <CreateFunctionWorkspace vm={vm} />
                <span className={styles.mainTitle}>{t('gui:createFunction.addField')}</span>
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
                <span className={styles.mainTitle}>{t('gui:createFunction.setColor')}</span>
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
            <div className={styles.contentRight}>
                <div className={styles.main}>
                    <span className={styles.mainTitle}>
                        {t('gui:createFunction.configFunction')}
                    </span>
                    <label className={styles.functionOption}>
                        <input
                            type='checkbox'
                            checked={!isValue}
                            onChange={handleChangeCustomBlock}
                        />
                        <span>{t('gui:createFunction.customBlock')}</span>
                    </label>
                    <span className={styles.mainTitle}>{t('gui:createFunction.returnType')}</span>
                    <button
                        type='button'
                        className={styles.returnTypeButton}
                        onClick={() => {
                            void modal.open(FieldTypeModal, {
                                purpose: 'return',
                                callback: handleSetReturnType,
                            });
                        }}
                    >
                        {returnTypeLabel()}
                    </button>
                </div>
                <button onClick={doneCreateFunction}>{t('gui:button.done')}</button>
            </div>
        </Modal>
    );
};
