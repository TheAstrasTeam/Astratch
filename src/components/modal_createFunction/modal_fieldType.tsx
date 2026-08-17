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
import type { TFunctionFieldType, TFunctionInputField } from './functionPreview';
import type { JSX } from 'react/jsx-dev-runtime';

// 此常量由AI生成：可选择添加的字段类型
const fieldTypes: { type: TFunctionInputField; icon: JSX.Element; label: string }[] = [
    { type: 'boolean', icon: <BooleanIcon />, label: t('gui:createFunction.boolean') },
    { type: 'array', icon: <ArrayIcon />, label: t('gui:createFunction.array') },
    { type: 'object', icon: <ObjectIcon />, label: t('gui:createFunction.object') },
    { type: 'string', icon: <StringIcon />, label: t('gui:createFunction.string') },
    { type: 'number', icon: <NumberIcon />, label: t('gui:createFunction.number') },
    { type: 'function', icon: <FunctionIcon />, label: t('gui:createFunction.function') },
];

export const FieldTypeModal = ({
    callback,
}: {
    callback?: (result: TFunctionFieldType) => void;
}) => {
    const { closeSelf } = useModalInstance();
    const [multiMode, setMultiMode] = useState(false);
    const [selected, setSelected] = useState<TFunctionInputField[]>([]);

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
            fullScreen={false}
            close={closeSelf}
            title={t('gui:createFunction.input')}
            description={t('gui:createFunction.selectInputType')}
        >
            <div className={styles.fieldTypeMenu}>
                <div className={styles.fieldTypeGrid}>
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
