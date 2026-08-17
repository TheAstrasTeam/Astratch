/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成：可复用取色按钮
// 外观完全由调用方通过 className 控制，本组件只负责
// 「可见按钮 + 隐藏的原生取色输入框 + 取色回调」的解耦组合。

import { useRef } from 'react';
import styles from './index.module.scss';

interface IColorPickerButtonProps {
    /** 当前颜色值（#RRGGBB）。 */
    value: string;
    onChange: (color: string) => void;
    className?: string;
    title?: string;
}

/**
 * 取色按钮
 */
export const ColorPickerButton = ({
    value,
    onChange,
    className,
    title,
}: IColorPickerButtonProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // 此函数由AI生成
    /** 程序化点击隐藏的取色输入框，弹出系统取色器。 */
    const openPicker = () => {
        inputRef.current?.click();
    };

    return (
        <button
            type='button'
            className={className}
            style={{ backgroundColor: value }}
            title={title}
            aria-label={title}
            onClick={openPicker}
        >
            <input
                ref={inputRef}
                type='color'
                value={value}
                onChange={event => {
                    onChange(event.target.value);
                }}
                className={styles.hiddenInput}
                tabIndex={-1}
            />
        </button>
    );
};
