/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 *
 * 此文件由AI修改
 */

import classNames from 'classnames';
import styles from './modalWindow.module.scss';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';

import CloseICON from '../../assets/close.svg?react';
import MiniSizeICON from '../../assets/miniScreen.svg?react';
import FullSizeICON from '../../assets/fullScreen.svg?react';
import { useModalInstance } from '@reactleaf/modal';
import { useModalWindowStore, getInitialWindowZ } from '../../stores/useModalWindowStore';
import { spawnRandomString } from '../../utils/ash-data';

export const Modal = ({
    fullScreen,
    onFullScreen,
    onResize,
    close,
    children,
    title,
    description,
    windowID,
    minWidth,
    minHeight,
}: {
    fullScreen?: boolean;
    onFullScreen?: (isFullScreen: boolean) => void;
    /**
     * 模态框尺寸调整完成后触发，用于刷新内部内容。
     * 在这里英文创建函数的预览 Blockly 工作区而添加。
     */
    onResize?: () => void;
    close?: () => Promise<void>;
    children?: React.ReactNode;
    title?: string;
    description?: string;
    windowID?: string;
    minWidth?: string | number;
    minHeight?: string | number;
}) => {
    const [isFullScreen, setFullScreen] = useState<boolean>(fullScreen ?? false);
    const modalRef = useRef<HTMLDivElement>(null);
    const { closeSelf } = useModalInstance();

    // 持久化窗口状态
    const [instanceID] = useState(() => windowID ?? `modal_${spawnRandomString()}`);
    const [initialZ] = useState(() => getInitialWindowZ());
    const windowState = useModalWindowStore(s => s.windows[instanceID]);
    const update = useModalWindowStore(s => s.update);
    const raise = useModalWindowStore(s => s.raise);

    useEffect(() => {
        useModalWindowStore.getState().register(instanceID);
    }, [instanceID]);

    // 将 store 中的 z-index 同步到 .modal-layer 元素
    useEffect(() => {
        const layer = modalRef.current?.closest<HTMLElement>('.modal-layer');
        if (!layer) return;
        layer.style.zIndex = String(windowState?.z ?? initialZ);
    }, [initialZ, windowState?.z]);

    // 点击 / 触摸时提升窗口层级
    const handleRaise = useCallback(() => {
        raise(instanceID);
    }, [instanceID, raise]);

    // 防止点击 layer 背景（非模态框区域）时误关闭
    useEffect(() => {
        const modalElement = modalRef.current;
        const layerElement = modalElement?.closest<HTMLElement>('.modal-layer');
        if (!modalElement || !layerElement) return;

        let pointerStartedInside = false;
        const onPointerDown = (event: PointerEvent) => {
            pointerStartedInside = modalElement.contains(event.target as Node);
        };
        const onLayerClick = (event: MouseEvent) => {
            if (pointerStartedInside && event.target === layerElement) {
                event.stopImmediatePropagation();
            }
            pointerStartedInside = false;
        };

        layerElement.addEventListener('pointerdown', onPointerDown, true);
        layerElement.addEventListener('click', onLayerClick);
        return () => {
            layerElement.removeEventListener('pointerdown', onPointerDown, true);
            layerElement.removeEventListener('click', onLayerClick);
        };
    }, []);

    const handleClose = useCallback(() => {
        if (close) void close();
        else void closeSelf();
    }, [close, closeSelf]);

    const handleToggleFullScreen = useCallback(() => {
        const next = !isFullScreen;
        setFullScreen(next);
        if (onFullScreen) onFullScreen(next);
    }, [isFullScreen, onFullScreen]);

    const inner = (
        <div
            ref={modalRef}
            className={classNames(styles.modal, {
                [styles.fullScreen]: isFullScreen,
            })}
            onMouseDownCapture={handleRaise}
            onTouchStartCapture={handleRaise}
        >
            <div className={styles.bar}>
                <div className={styles.barLeft}>
                    <span title={description}>{title}</span>
                </div>
                <div className={styles.barRight}>
                    <button onClick={handleClose} className={styles.controlButton}>
                        <CloseICON />
                    </button>
                    <button onClick={handleToggleFullScreen} className={styles.controlButton}>
                        {isFullScreen ? <MiniSizeICON /> : <FullSizeICON />}
                    </button>
                </div>
            </div>
            <div className={styles.content}>{children}</div>
        </div>
    );

    if (isFullScreen) {
        return inner;
    }

    const initialRect = windowState ?? {
        x: Math.max(0, Math.round((window.innerWidth - 480) / 2)),
        y: Math.max(0, Math.round((window.innerHeight - 360) / 2)),
        width: 480,
        height: 360,
    };

    return (
        <Rnd
            className={styles.rndWrap}
            style={{ display: 'flex' }}
            bounds='parent'
            default={{
                x: initialRect.x,
                y: initialRect.y,
                width: initialRect.width,
                height: initialRect.height,
            }}
            minWidth={minWidth ?? Math.min(300, window.innerWidth)}
            minHeight={minHeight ?? 200}
            dragHandleClassName={styles.bar}
            cancel={`.${styles.controlButton}`}
            enableResizing
            onDragStop={(_e: unknown, data: { x: number; y: number }) => {
                update(instanceID, { x: data.x, y: data.y });
            }}
            onResizeStop={(
                _e: unknown,
                _dir: string,
                ref: HTMLElement,
                _delta: { width: number; height: number },
                position: { x: number; y: number },
            ) => {
                update(instanceID, {
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                    x: position.x,
                    y: position.y,
                });
                if (onResize) onResize();
            }}
        >
            {inner}
        </Rnd>
    );
};
