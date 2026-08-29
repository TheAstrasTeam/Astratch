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
import {
    AnyIcon,
    ArrayIcon,
    BooleanIcon,
    FunctionIcon,
    NumberIcon,
    ObjectIcon,
    StringIcon,
} from './icons';
import {
    previewBlockColor,
    type TFunctionFieldType,
    type TFunctionInputField,
} from './functionPreview';
import { AllCheckers } from '../../types/vm/blocks';
import type { JSX } from 'react/jsx-dev-runtime';

export const FieldTypeModal = ({
    callback,
    purpose = 'input',
    parentWindowID,
    blocking,
}: {
    callback?: (result: TFunctionFieldType | typeof AllCheckers.NONE) => void;
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
            type: AllCheckers.ANY,
            icon: <AnyIcon color={previewBlockColor} />,
            label: t('gui:createFunction.any'),
        },
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

    const handleSelectSingle = async (result: TFunctionFieldType | typeof AllCheckers.NONE) => {
        if (callback) callback(result);
        await closeSelf();
    };

    const handleToggle = (type: TFunctionInputField) => {
        // 多类型联合里不允许出现 null（万能只能单独使用，null|X = null）。
        if (multiMode && type === null) return;
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
            // null（万能）吞并一切：联合里出现 null 就等价于单独的 null；
            // 否则滤掉 null 得到不含万能的类型联合。
            const result: TFunctionFieldType = selected.includes(null)
                ? null
                : selected.length === 1
                  ? selected[0]
                  : selected.filter(
                        (type): type is Exclude<TFunctionInputField, null> => type !== null,
                    );
            if (callback) callback(result);
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
                        // 多类型模式下未知（null）不可选：万能只能单独使用。
                        const anyBlocked = multiMode && type === null;
                        return (
                            <div
                                key={type}
                                className={classNames(styles.selector, {
                                    [styles.selectorSelected]: isSelected,
                                })}
                                style={
                                    anyBlocked ? { opacity: 0.4, cursor: 'not-allowed' } : undefined
                                }
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
