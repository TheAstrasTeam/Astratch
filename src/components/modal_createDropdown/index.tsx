/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 创建函数字段选择框的配置弹窗。
 * @author AI
 */

import { useModalInstance } from '@reactleaf/modal';
import { useMemo, useState, type ChangeEvent } from 'react';
import { t } from 'i18next';
import { Modal } from '../Modal/modalWindow';
import styles from './index.module.scss';
import type {
    IFunctionDropdownField,
    IFunctionDropdownOption,
} from '../modal_createFunction/functionPreview';

const emptyOption = (): IFunctionDropdownOption => ({ label: '', value: '' });

export interface ICreateDropdownModalProps {
    callback?: (field: IFunctionDropdownField) => void;
    initial?: IFunctionDropdownField;
    parentWindowID?: string;
    blocking?: boolean;
}

export const CreateDropdownModal = ({
    callback,
    initial,
    parentWindowID,
    blocking,
}: ICreateDropdownModalProps) => {
    const { closeSelf } = useModalInstance();
    const [options, setOptions] = useState<IFunctionDropdownOption[]>(() =>
        initial?.options.length ? structuredClone(initial.options) : [emptyOption()],
    );
    const [allowBlocks, setAllowBlocks] = useState(initial?.allowBlocks ?? false);

    const invalid = useMemo(
        () =>
            options.some(option => !option.value.trim()) ||
            new Set(options.map(option => option.value)).size !== options.length,
        [options],
    );

    const updateOption = (
        index: number,
        key: keyof IFunctionDropdownOption,
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const value = event.currentTarget.value;
        setOptions(previous =>
            previous.map((option, optionIndex) =>
                optionIndex === index ? { ...option, [key]: value } : option,
            ),
        );
    };

    const finish = async () => {
        if (invalid) return;
        callback?.({
            type: 'dropdown',
            options: options.map(option => ({
                value: option.value,
                ...(option.label?.trim() ? { label: option.label } : {}),
            })),
            allowBlocks,
            value:
                initial?.value && options.some(option => option.value === initial.value)
                    ? initial.value
                    : options[0].value,
        });
        await closeSelf();
    };

    return (
        <Modal
            windowID='createDropdown'
            fullScreen={false}
            close={closeSelf}
            parentWindowID={parentWindowID}
            blocking={blocking}
            title={t('gui:createFunction.dropdownTitle')}
            description={t('gui:createFunction.dropdownDescription')}
            minWidth={560}
            minHeight={360}
        >
            <div className={styles.content}>
                <div className={styles.options}>
                    <div className={styles.header}>
                        <span>{t('gui:createFunction.dropdownDisplayName')}</span>
                        <span>{t('gui:createFunction.dropdownActualValue')}</span>
                        <span aria-hidden='true' />
                    </div>
                    {options.map((option, index) => (
                        <div className={styles.row} key={index}>
                            <input
                                value={option.label ?? ''}
                                placeholder={
                                    option.value || t('gui:createFunction.dropdownDisplayName')
                                }
                                onChange={event => {
                                    updateOption(index, 'label', event);
                                }}
                            />
                            <input
                                required
                                value={option.value}
                                placeholder={t('gui:createFunction.dropdownActualValue')}
                                onChange={event => {
                                    updateOption(index, 'value', event);
                                }}
                            />
                            <button
                                type='button'
                                className={styles.remove}
                                disabled={options.length <= 1}
                                onClick={() => {
                                    setOptions(previous => previous.filter((_, i) => i !== index));
                                }}
                            >
                                {t('gui:createFunction.dropdownRemoveItem')}
                            </button>
                        </div>
                    ))}
                    <button
                        type='button'
                        className={styles.add}
                        onClick={() => {
                            setOptions(previous => [...previous, emptyOption()]);
                        }}
                    >
                        {t('gui:createFunction.dropdownAddItem')}
                    </button>
                </div>
                <label className={styles.allowBlocks}>
                    <input
                        type='checkbox'
                        checked={allowBlocks}
                        onChange={event => {
                            setAllowBlocks(event.currentTarget.checked);
                        }}
                    />
                    <span>{t('gui:createFunction.dropdownAllowBlocks')}</span>
                </label>
                <button type='button' disabled={invalid} onClick={() => void finish()}>
                    {t('gui:button.done')}
                </button>
            </div>
        </Modal>
    );
};
