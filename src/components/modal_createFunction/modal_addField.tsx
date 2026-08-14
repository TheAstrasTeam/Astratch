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
import { resizePreviewWorkspace } from './functionPreview';
import { ArrayIcon, BooleanIcon, DropDownIcon, FunctionIcon, NumberIcon, ObjectIcon, StringIcon } from './icons';
import type { TFunctionReturnField } from '../../types/blocks';
import type { JSX } from 'react/jsx-dev-runtime';

const Selector = ({
    icon,
    label,
    value,
    callback,
}: {
    icon: JSX.Element;
    label: string;
    value: TFunctionReturnField;
    callback: (result: TFunctionReturnField) => void;
}) => {
    return (
        <div
            className={styles.selector}
            onClick={() => {
                callback(value);
            }}
        >
            {icon}
            <span>{label}</span>
        </div>
    );
};

export const AddFieldModal = ({ callback }: { callback?: (result: TFunctionReturnField) => void }) => {
    const { closeSelf } = useModalInstance();

    const handleButtonClick = useCallback(
        async (close: unknown = null, result: TFunctionReturnField) => {
            if (callback) callback(result);
            await closeSelf(close);
        },
        [callback, closeSelf],
    );

    const handleSelectorClicked = (result: TFunctionReturnField) => {
        void handleButtonClick(null, result);
    };

    return (
        <Modal
            fullScreen={false}
            onFullScreen={resizePreviewWorkspace}
            close={async result => {
                await handleButtonClick(result, null);
            }}
            title={t('gui:createFunction.addField.title')}
            description={t('gui:createFunction.addField.description')}
        >
            <div className={styles.addFieldContent}>
                <Selector
                    icon={<DropDownIcon />}
                    label={t('block:dropdown')}
                    value={'dropdown'}
                    callback={handleSelectorClicked}
                />
                <Selector
                    icon={<BooleanIcon />}
                    label={t('block:boolean')}
                    value={'boolean'}
                    callback={handleSelectorClicked}
                />
                <Selector
                    icon={<ArrayIcon />}
                    label={t('block:array')}
                    value={'array'}
                    callback={handleSelectorClicked}
                />
                <Selector
                    icon={<ObjectIcon />}
                    label={t('block:object')}
                    value={'object'}
                    callback={handleSelectorClicked}
                />
                <Selector
                    icon={<StringIcon />}
                    label={t('block:string')}
                    value={'string'}
                    callback={handleSelectorClicked}
                />
                <Selector
                    icon={<NumberIcon />}
                    label={t('block:number')}
                    value={'number'}
                    callback={handleSelectorClicked}
                />
                <Selector
                    icon={<FunctionIcon />}
                    label={t('block:function')}
                    value={'function'}
                    callback={handleSelectorClicked}
                />
            </div>
        </Modal>
    );
};
