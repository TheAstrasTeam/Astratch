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
import { useShallow } from 'zustand/react/shallow';
import {
    useModalWindowStore,
    getInitialWindowZ,
    clampRectToViewport,
    getDefaultRect,
} from '../../stores/useModalWindowStore';
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
    // useShallow 对合并后的对象做浅比较：zustand 的 action 函数引用稳定，
    // windows[id] 与 activeWindowID 为原始值/稳定引用，
    // 因此只有真正用到的字段变化时才会重渲染
    const [instanceID] = useState(() => windowID ?? `modal_${spawnRandomString()}`);
    const [initialZ] = useState(() => getInitialWindowZ());
    const { windowState, activeWindowID, update, raise } = useModalWindowStore(
        useShallow(s => ({
            windowState: s.windows[instanceID],
            activeWindowID: s.activeWindowID,
            update: s.update,
            raise: s.raise,
        })),
    );

    // 父子关系与阻塞
    const {
        shaking,
        parentChild,
        blockingChildren,
        registerChild,
        unregisterChild,
        registerCloseFunction,
        unregisterCloseFunction,
        setBlocking,
        clearBlocking,
        closeChildren,
        getBlockingChildren,
        triggerShake,
    } = useModalRelationshipStore(
        useShallow(s => ({
            shaking: s.shakeMap[instanceID],
            parentChild: s.parentChild,
            blockingChildren: s.blockingChildren,
            registerChild: s.registerChild,
            unregisterChild: s.unregisterChild,
            registerCloseFunction: s.registerCloseFunction,
            unregisterCloseFunction: s.unregisterCloseFunction,
            setBlocking: s.setBlocking,
            clearBlocking: s.clearBlocking,
            closeChildren: s.closeChildren,
            getBlockingChildren: s.getBlockingChildren,
            triggerShake: s.triggerShake,
        })),
    );
    const isBlocked = (parentChild[instanceID] ?? []).some(c => blockingChildren[c]);

    // @reactleaf/modal 的 closeSelf 在 ModalLayer 每次渲染时都是新引用
    // （context value 也是每次新建的对象），不能放进 effect 依赖数组：
    // 否则本 effect 会在窗口每次重渲染时反复销毁重建，
    // 且其 cleanup 中的 raise(parentWindowID) 会把父窗口提到子窗口之上。
    // 因此用 ref 持有最新引用，effect 只依赖真正需要的值。
    const closeSelfRef = useRef(closeSelf);
    useEffect(() => {
        closeSelfRef.current = closeSelf;
    }, [closeSelf]);

    useEffect(() => {
        useModalWindowStore.getState().register(instanceID);
    }, [instanceID]);

    useEffect(() => {
        registerCloseFunction(instanceID, (...args: Parameters<typeof closeSelf>) =>
            closeSelfRef.current(...args),
        );
        if (parentWindowID) registerChild(parentWindowID, instanceID);
        if (blocking) setBlocking(instanceID, true);
        return () => {
            closeChildren(instanceID);
            if (parentWindowID) useModalWindowStore.getState().raise(parentWindowID);
            unregisterCloseFunction(instanceID);
            unregisterChild(instanceID);
            clearBlocking(instanceID);
        };
    }, [
        instanceID,
        parentWindowID,
        blocking,
        closeChildren,
        unregisterCloseFunction,
        unregisterChild,
        clearBlocking,
        registerCloseFunction,
        registerChild,
        setBlocking,
    ]);

    // 将 store 中的 z-index 同步到 .modal-layer 元素
    useEffect(() => {
        const layer = modalRef.current?.closest<HTMLElement>('.modal-layer');
        if (!layer) return;
        layer.style.zIndex = String(windowState?.z ?? initialZ);
    }, [initialZ, windowState?.z]);

    // 浏览器视口缩小时，已打开的窗口可能变得比视口还大，
    // react-rnd 的 bounds='parent' 约束区间会变为空（left > right），
    // 拖拽时坐标被坍缩到固定角落，表现为"鼠标动了窗口不动"。
    // 因此钳制 store 中的矩形，并重挂载 Rnd 使新尺寸/位置生效
    const [rndKey, setRndKey] = useState(0);
    useEffect(() => {
        const onResize = () => {
            const state = useModalWindowStore.getState();
            const rect = state.windows[instanceID];
            if (!rect) return;
            const clamped = clampRectToViewport(rect);
            if (
                clamped.x !== rect.x ||
                clamped.y !== rect.y ||
                clamped.width !== rect.width ||
                clamped.height !== rect.height
            ) {
                state.update(instanceID, clamped);
                setRndKey(key => key + 1);
            }
        };
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
        };
    }, [instanceID]);

    // 点击 / 触摸时提升窗口层级；若存在阻塞子窗口则提升子窗口并抖动
    const handleRaise = useCallback(() => {
        const blockingChildren = getBlockingChildren(instanceID);
        if (blockingChildren.length > 0) {
            for (const childID of blockingChildren) {
                useModalWindowStore.getState().raise(childID);
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
        void (close?.() ?? closeSelf());
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

    // windowState 缺失时（如 store 初始化前的极端时序）使用统一的默认居中矩形
    const initialRect = windowState ?? getDefaultRect();

    return (
        <Rnd
            key={rndKey}
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
