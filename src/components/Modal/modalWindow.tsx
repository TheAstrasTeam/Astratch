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
import { useModalRelationshipStore } from '../../stores/useModalRelationshipStore';
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
    parentWindowID,
    blocking,
}: {
    fullScreen?: boolean;
    onFullScreen?: (isFullScreen: boolean) => void;
    onResize?: () => void;
    close?: () => Promise<void>;
    children?: React.ReactNode;
    title?: string;
    description?: string;
    windowID?: string;
    minWidth?: string | number;
    minHeight?: string | number;
    parentWindowID?: string;
    blocking?: boolean;
}) => {
    const [isFullScreen, setFullScreen] = useState<boolean>(fullScreen ?? false);
    const modalRef = useRef<HTMLDivElement>(null);
    const { closeSelf } = useModalInstance();

    // 持久化窗口状态
    const [instanceID] = useState(() => windowID ?? `modal_${spawnRandomString()}`);
    const [initialZ] = useState(() => getInitialWindowZ());
    const windowState = useModalWindowStore(s => s.windows[instanceID]);
    const activeWindowID = useModalWindowStore(s => s.activeWindowID);
    const update = useModalWindowStore(s => s.update);
    const raise = useModalWindowStore(s => s.raise);

    // 父子关系与阻塞
    const shaking = useModalRelationshipStore(s => s.shakeMap[instanceID]);
    const parentChild = useModalRelationshipStore(s => s.parentChild);
    const blockingChildren = useModalRelationshipStore(s => s.blockingChildren);
    const isBlocked = (parentChild[instanceID] ?? []).some(c => blockingChildren[c]);
    const registerChild = useModalRelationshipStore(s => s.registerChild);
    const unregisterChild = useModalRelationshipStore(s => s.unregisterChild);
    const registerCloseFunction = useModalRelationshipStore(s => s.registerCloseFunction);
    const unregisterCloseFunction = useModalRelationshipStore(s => s.unregisterCloseFunction);
    const setBlocking = useModalRelationshipStore(s => s.setBlocking);
    const clearBlocking = useModalRelationshipStore(s => s.clearBlocking);
    const closeChildren = useModalRelationshipStore(s => s.closeChildren);
    const getBlockingChildren = useModalRelationshipStore(s => s.getBlockingChildren);
    const triggerShake = useModalRelationshipStore(s => s.triggerShake);

    useEffect(() => {
        useModalWindowStore.getState().register(instanceID);
    }, [instanceID]);

    useEffect(() => {
        registerCloseFunction(instanceID, closeSelf);
        if (parentWindowID) registerChild(parentWindowID, instanceID);
        if (blocking) setBlocking(instanceID, true);
        return () => {
            closeChildren(instanceID);
            unregisterCloseFunction(instanceID);
            unregisterChild(instanceID);
            clearBlocking(instanceID);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instanceID, parentWindowID, blocking]);

    // 将 store 中的 z-index 同步到 .modal-layer 元素
    useEffect(() => {
        const layer = modalRef.current?.closest<HTMLElement>('.modal-layer');
        if (!layer) return;
        layer.style.zIndex = String(windowState?.z ?? initialZ);
    }, [initialZ, windowState?.z]);

    // 点击 / 触摸时提升窗口层级；若存在阻塞子窗口则不提升
    const handleRaise = useCallback(() => {
        const blockingChildren = getBlockingChildren(instanceID);
        if (blockingChildren.length > 0) {
            for (const childID of blockingChildren) {
                triggerShake(childID);
            }
            return;
        }
        raise(instanceID);
    }, [instanceID, raise, getBlockingChildren, triggerShake]);

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
            data-window-id={instanceID}
            className={classNames(styles.modal, {
                [styles.fullScreen]: isFullScreen,
                [styles.shaking]: shaking,
                [styles.inactive]: activeWindowID !== null && activeWindowID !== instanceID,
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
            {isBlocked && <div className={styles.blockOverlay} />}
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
