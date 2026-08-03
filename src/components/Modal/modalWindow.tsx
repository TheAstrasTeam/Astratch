/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import classNames from 'classnames';
import styles from './modalWindow.module.scss';
import { useEffect, useRef, useState } from 'react';

import CloseICON from '../../assets/close.svg?react';
import MiniSizeICON from '../../assets/miniScreen.svg?react';
import FullSizeICON from '../../assets/fullScreen.svg?react';
import { useModalInstance } from '@reactleaf/modal';

export const Modal = ({
    fullScreen,
    onFullScreen,
    close,
    children,
    title,
    description,
}: {
    fullScreen?: boolean;
    onFullScreen?: (isFullScreen: boolean) => void;
    close?: (result?: unknown) => Promise<void>;
    children?: React.ReactNode;
    title?: string;
    description?: string;
}) => {
    const [isFullScreen, setFullScreen] = useState<boolean>(fullScreen ?? false);
    const modalRef = useRef<HTMLDivElement>(null);
    const { closeSelf } = useModalInstance();

    useEffect(() => {
        const modalElement = modalRef.current;
        const layerElement = modalElement?.parentElement;
        if (!modalElement || !layerElement?.classList.contains('modal-layer')) return;

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

    return (
        <div
            ref={modalRef}
            className={classNames(styles.modal, {
                [styles.fullScreen]: isFullScreen,
            })}
        >
            <div className={styles.bar}>
                <div className={styles.barLeft}>
                    <span title={description}>{title}</span>
                </div>
                <div className={styles.barRight}>
                    <button
                        onClick={() => {
                            if (close) void close();
                            else void closeSelf();
                        }}
                        className={styles.controlButton}
                    >
                        <CloseICON />
                    </button>
                    <button
                        className={styles.controlButton}
                        onClick={() => {
                            if (isFullScreen) {
                                setFullScreen(false);
                                if (onFullScreen) onFullScreen(false);
                            } else {
                                setFullScreen(true);
                                if (onFullScreen) onFullScreen(true);
                            }
                        }}
                    >
                        {isFullScreen ? <MiniSizeICON /> : <FullSizeICON />}
                    </button>
                </div>
            </div>
            <div className={styles.content}>{children}</div>
        </div>
    );
};
