/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成：选择「输入」字段具体类型的弹窗

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import styles from './index.module.scss';
import { useState } from 'react';
import classNames from 'classnames';
import { ArrayIcon, BooleanIcon, FunctionIcon, NumberIcon, ObjectIcon, StringIcon } from './icons';
import {
    previewBlockColor,
    type TFunctionFieldType,
    type TFunctionInputField,
} from './functionPreview';
import { AllCheckers } from '../../types/blocks';
import type { JSX } from 'react/jsx-dev-runtime';

export const FieldTypeModal = ({
    callback,
    purpose = 'input',
    parentWindowID,
    blocking,
}: {
    callback?: (result: TFunctionFieldType) => void;
    purpose?: 'input' | 'return';
    parentWindowID?: string;
    blocking?: boolean;
}) => {
    const { closeSelf } = useModalInstance();
    const [multiMode, setMultiMode] = useState(false);
    const [selected, setSelected] = useState<TFunctionInputField[]>([]);
    const [fieldTypes, _] = useState<
        { type: TFunctionInputField; icon: JSX.Element; label: string }[]
    >([
        {
            type: AllCheckers.BOOLEAN,
            icon: <BooleanIcon color={previewBlockColor} />,
            label: t('gui:createFunction.boolean'),
        },
        {
            type: AllCheckers.ARRAY,
            icon: <ArrayIcon color={previewBlockColor} />,
            label: t('gui:createFunction.array'),
        },
        {
            type: AllCheckers.OBJECT,
            icon: <ObjectIcon color={previewBlockColor} />,
            label: t('gui:createFunction.object'),
        },
        {
            type: AllCheckers.STRING,
            icon: <StringIcon color={previewBlockColor} />,
            label: t('gui:createFunction.string'),
        },
        {
            type: AllCheckers.NUMBER,
            icon: <NumberIcon color={previewBlockColor} />,
            label: t('gui:createFunction.number'),
        },
        {
            type: AllCheckers.FUNCTION,
            icon: <FunctionIcon color={previewBlockColor} />,
            label: t('gui:createFunction.function'),
        },
    ]);

    const handleSelectSingle = async (result: TFunctionFieldType) => {
        if (callback) callback(result);
        await closeSelf();
    };

    const handleToggle = (type: TFunctionInputField) => {
        setSelected(prev =>
            prev.includes(type) ? prev.filter(item => item !== type) : [...prev, type],
        );
    };

    const handleMultiModeChange = (checked: boolean) => {
        setMultiMode(checked);
        setSelected([]);
    };

    const handleConfirm = async () => {
        if (selected.length > 0) {
            if (callback) callback(selected.length === 1 ? selected[0] : selected);
        }
        await closeSelf();
    };

    const handleItemClick = (type: TFunctionInputField) => {
        if (!multiMode) {
            void handleSelectSingle(type);
            return;
        }
        handleToggle(type);
    };

    return (
        <Modal
            windowID='fieldType'
            fullScreen={false}
            close={closeSelf}
            minWidth={300}
            minHeight={240}
            parentWindowID={parentWindowID}
            blocking={blocking}
            title={t(
                purpose === 'return' ? 'gui:createFunction.returnType' : 'gui:createFunction.input',
            )}
            description={t(
                purpose === 'return'
                    ? 'gui:createFunction.selectReturnType'
                    : 'gui:createFunction.selectInputType',
            )}
        >
            <div className={styles.fieldTypeMenu}>
                <div className={styles.fieldTypeGrid}>
                    {purpose === 'return' && (
                        <>
                            <div
                                className={styles.selector}
                                onClick={() => {
                                    void handleSelectSingle(AllCheckers.NONE);
                                }}
                            >
                                <span className={styles.noTypeIcon} aria-hidden='true'>
                                    -
                                </span>
                                <span>{t('gui:createFunction.noneReturn')}</span>
                            </div>
                            <div
                                className={styles.selector}
                                onClick={() => {
                                    void handleSelectSingle(null);
                                }}
                            >
                                <span className={styles.noTypeIcon} aria-hidden='true'>
                                    ?
                                </span>
                                <span>{t('gui:createFunction.nullReturn')}</span>
                            </div>
                        </>
                    )}
                    {fieldTypes.map(({ type, icon, label }) => {
                        const isSelected = multiMode && selected.includes(type);
                        return (
                            <div
                                key={type}
                                className={classNames(styles.selector, {
                                    [styles.selectorSelected]: isSelected,
                                })}
                                onClick={() => {
                                    handleItemClick(type);
                                }}
                            >
                                {icon}
                                <span>{label}</span>
                            </div>
                        );
                    })}
                </div>
                <label className={styles.fieldTypeMulti}>
                    <div>
                        <input
                            type='checkbox'
                            checked={multiMode}
                            onChange={event => {
                                handleMultiModeChange(event.target.checked);
                            }}
                        />

                        {t('gui:createFunction.multiType')}
                    </div>
                    {multiMode && (
                        <button
                            className={styles.fieldTypeConfirm}
                            disabled={selected.length === 0}
                            onClick={() => {
                                void handleConfirm();
                            }}
                        >
                            {t('gui:button.done')}
                        </button>
                    )}
                </label>
            </div>
        </Modal>
    );
};
