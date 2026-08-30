/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { modal } from '../Modal/modal';
import { isModalOpen } from '../Modal/modal';
import { t } from 'i18next';
import styles from './index.module.scss';
import { useCallback, useMemo, useState } from 'react';
import { type IVM } from '../../types/vm/vm';
import { CreateFunctionWorkspace } from './blockWorkspace';
import { FieldTypeModal } from './modal_fieldType';
import { CreateDropdownModal } from '../modal_createDropdown';
import {
    addFieldForFunctionPreview,
    previewBlockColor,
    previewFunctionBlocksColorScheme,
    resizePreviewWorkspace,
    setPreviewConfig,
    setPreviewBlockColor,
    previewFunctionData,
    type IFunctionPreviewInitialState,
} from './functionPreview';
import { DropDownIcon, StringIcon, TextIcon } from './icons';
import { ColorPickerButton } from '../colorPickerButton';
import { AllCheckers, type IBlockColor, type ICustomFunction } from '../../types/vm/blocks';
import type {
    IFunctionDropdownField,
    TFunctionFieldType,
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

export interface ICreateFunctionModalProps {
    vm: IVM;
    addID: string;
    editFunctionId?: string;
}

export const CreateFunctionModal = ({ vm, addID, editFunctionId }: ICreateFunctionModalProps) => {
    const { closeSelf } = useModalInstance();
    const existingFunction = editFunctionId
        ? vm.runtime.getTargetByID(addID)?.getFunction(editFunctionId)
        : null;
    const initial = useMemo<IFunctionPreviewInitialState | undefined>(
        () =>
            existingFunction
                ? {
                      data: existingFunction.body,
                      color: existingFunction.color,
                      isValue: existingFunction.isValue,
                      returnType: existingFunction.returnType ?? null,
                  }
                : undefined,
        [existingFunction],
    );
    const [blockColor, setBlockColor] = useState<IBlockColor>(initial?.color ?? previewBlockColor);
    const [isValue, setIsValue] = useState(initial?.isValue ?? true);
    const [returnType, setReturnType] = useState<TFunctionReturnType>(initial?.returnType ?? null);

    const handleButtonClick = useCallback(
        async (close: unknown = null) => {
            await closeSelf(close);
        },
        [closeSelf],
    );

    const handleAddFieldButtonClick = (result: TFunctionFieldType | typeof AllCheckers.NONE) => {
        // 输入类型 Modal 不会返回 NONE（那是返回值语境的占位），防御一下。
        if (result === 'text' || result === AllCheckers.NONE) return;
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

    const handleSetReturnType = (result: TFunctionFieldType | typeof AllCheckers.NONE) => {
        // 返回类型 Modal 只会返回值类型、联合值类型、null（未知）或 NONE；
        // text 是旧字段类型，为避免把它误当成 Blockly check，明确拒绝。
        if (result === 'text') return;
        const nextReturnType = result;
        setReturnType(nextReturnType);
        setPreviewConfig({ isValue, returnType: nextReturnType });
    };

    const returnTypeLabel = () => {
        if (returnType === null) return t('gui:createFunction.nullReturn');
        if (returnType === AllCheckers.NONE) return t('gui:createFunction.noneReturn');
        // checker 是大写开头（'Boolean'），i18n key 是全小写。
        // 联合类型 TFunctionTypeUnion 不含 null，无需过滤。
        const types = Array.isArray(returnType) ? returnType : [returnType];
        return types.map(type => t(`gui:createFunction.${type.toLowerCase()}`)).join(' | ');
    };

    const doneCreateFunction = () => {
        const id = editFunctionId ?? spawnRandomString();
        const functionData: ICustomFunction = {
            body: structuredClone(previewFunctionData),
            color: structuredClone(previewBlockColor),
            id,
            // 保持新建函数原有的默认值语义；编辑时保存用户在弹窗里选择的显示模式。
            isValue: editFunctionId ? isValue : true,
            returnType: Array.isArray(returnType) ? [...returnType] : returnType,
        };
        const target = vm.runtime.getTargetByID(addID);
        if (target) {
            const saved = editFunctionId
                ? target.replaceCustomFunction(id, functionData)
                : target.addCustomFunction(id, functionData);
            if (saved) void closeSelf();
        } else sendError({ text: 'vm:err.target.undefined' }, 'warn');
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
            title={t(editFunctionId ? 'gui:createFunction.editTitle' : 'gui:createFunction.title')}
            description={t('gui:createFunction.description')}
            minWidth={780}
            minHeight={570}
        >
            <div className={styles.content}>
                <CreateFunctionWorkspace vm={vm} initial={initial} />
                <span className={styles.mainTitle}>{t('gui:createFunction.addField')}</span>
                <div className={styles.addFieldContent}>
                    <BigSelector
                        icon={<DropDownIcon color={blockColor} />}
                        label={t('gui:createFunction.dropdown')}
                        onClick={() => {
                            if (isModalOpen(CreateDropdownModal)) return;
                            void modal.open(CreateDropdownModal, {
                                parentWindowID: 'createFunction',
                                blocking: true,
                                callback: (field: IFunctionDropdownField) => {
                                    addFieldForFunctionPreview({ type: field });
                                },
                            });
                        }}
                    />
                    <BigSelector
                        icon={<StringIcon color={blockColor} />}
                        label={t('gui:createFunction.input')}
                        onClick={() => {
                            if (isModalOpen(FieldTypeModal)) return;
                            void modal.open(FieldTypeModal, {
                                callback: handleAddFieldButtonClick,
                                parentWindowID: 'createFunction',
                                blocking: true,
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
                            if (isModalOpen(FieldTypeModal)) return;
                            void modal.open(FieldTypeModal, {
                                purpose: 'return',
                                callback: handleSetReturnType,
                                parentWindowID: 'createFunction',
                                blocking: true,
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
