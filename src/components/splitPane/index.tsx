/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 *
 * @author AI
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { SplitPaneContext, type TSplitPaneMoveSource } from './context';
import styles from './index.module.scss';

export const DIVIDER_WIDTH = 4;

/** 程序化调整尺寸时的过渡动画时长（ms），需与 scss 中 transition 时长保持一致 */
export const ANIMATION_DURATION_MS = 300;

export type { ISplitPaneApi } from './context';

interface ISplitPaneProps {
    direction?: 'horizontal' | 'vertical';
    defaultRatio?: number;
    minFirst?: number;
    minSecond?: number;
    onMove?: (ratio: number) => void;
    onOver?: () => void;
    first: React.ReactNode;
    second: React.ReactNode;
    className?: string;
}

const SplitPane = ({
    direction = 'horizontal',
    defaultRatio = 0.5,
    minFirst = 50,
    minSecond = 50,
    onMove,
    onOver,
    first,
    second,
    className,
}: ISplitPaneProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const firstPaneRef = useRef<HTMLDivElement>(null);
    const secondPaneRef = useRef<HTMLDivElement>(null);
    const moveListenersRef = useRef(
        new Set<(ratio: number, source: TSplitPaneMoveSource) => void>(),
    );
    const [ratio, setRatio] = useState(defaultRatio);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const animTimerRef = useRef<number | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        // 拖拽需要即时跟手，取消进行中的过渡动画
        setIsAnimating(false);
        setIsDragging(true);
    }, []);

    const clampRatio = useCallback(
        (value: number, totalSize: number) => {
            if (totalSize <= 0) return value;
            const min = Math.max(0, minFirst / totalSize);
            const max = Math.min(1, 1 - minSecond / totalSize);
            return Math.min(Math.max(value, min), max);
        },
        [minFirst, minSecond],
    );

    const emitMove = useCallback((ratio: number, source: TSplitPaneMoveSource) => {
        for (const listener of moveListenersRef.current) {
            listener(ratio, source);
        }
    }, []);

    const subscribeMove = useCallback(
        (listener: (ratio: number, source: TSplitPaneMoveSource) => void) => {
            moveListenersRef.current.add(listener);
            return () => {
                moveListenersRef.current.delete(listener);
            };
        },
        [],
    );

    useEffect(() => {
        if (!isDragging) return;
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const totalSize = direction === 'horizontal' ? rect.width : rect.height;
            const offset =
                direction === 'horizontal' ? e.clientX - rect.left : e.clientY - rect.top;
            const newRatio = clampRatio(offset / totalSize, totalSize);
            setRatio(newRatio);
            onMove?.(newRatio);
            emitMove(newRatio, 'drag');
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            onOver?.();
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, direction, minFirst, minSecond, onMove, onOver, clampRatio, emitMove]);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const totalSize =
            direction === 'horizontal' ? container.clientWidth : container.clientHeight;
        const clamped = clampRatio(ratio, totalSize);
        if (clamped !== ratio) {
            setRatio(clamped);
            onMove?.(clamped);
            emitMove(clamped, 'api');
        }
    }, [direction, ratio, clampRatio, onMove, emitMove]);

    // 保持 API 引用稳定，内部始终读取最新依赖
    const latestRef = useRef({ direction, clampRatio, onMove });
    useEffect(() => {
        latestRef.current = { direction, clampRatio, onMove };
    });

    const applyRatio = useCallback(
        (firstSize: number, totalSize: number, animate: boolean) => {
            const { clampRatio: clamp, onMove: move } = latestRef.current;
            const clamped = clamp(firstSize / totalSize, totalSize);
            if (animate) {
                setIsAnimating(true);
                if (animTimerRef.current !== null) window.clearTimeout(animTimerRef.current);
                animTimerRef.current = window.setTimeout(() => {
                    setIsAnimating(false);
                    animTimerRef.current = null;
                    emitMove(clamped, 'api');
                }, ANIMATION_DURATION_MS + 50);
            }
            setRatio(clamped);
            move?.(clamped);
            emitMove(clamped, 'api');
        },
        [emitMove],
    );

    const setFirstSize = useCallback(
        (size: number, animate = true) => {
            const container = containerRef.current;
            if (!container) return;
            const totalSize =
                latestRef.current.direction === 'horizontal'
                    ? container.clientWidth
                    : container.clientHeight;
            if (totalSize <= 0) return;
            applyRatio(size, totalSize, animate);
        },
        [applyRatio],
    );

    const setSecondSize = useCallback(
        (size: number, animate = true) => {
            const container = containerRef.current;
            if (!container) return;
            const totalSize =
                latestRef.current.direction === 'horizontal'
                    ? container.clientWidth
                    : container.clientHeight;
            if (totalSize <= 0) return;
            applyRatio(totalSize - DIVIDER_WIDTH - size, totalSize, animate);
        },
        [applyRatio],
    );

    const getFirstSize = useCallback(() => {
        const pane = firstPaneRef.current;
        if (!pane) return 0;
        return latestRef.current.direction === 'horizontal' ? pane.clientWidth : pane.clientHeight;
    }, []);

    const getSecondSize = useCallback(() => {
        const pane = secondPaneRef.current;
        if (!pane) return 0;
        return latestRef.current.direction === 'horizontal' ? pane.clientWidth : pane.clientHeight;
    }, []);

    const api = useMemo(
        () => ({
            setFirstSize,
            setSecondSize,
            getFirstSize,
            getSecondSize,
            isDragging,
            subscribeMove,
        }),
        [getFirstSize, getSecondSize, setFirstSize, setSecondSize, isDragging, subscribeMove],
    );

    // 卸载时清理动画定时器
    useEffect(
        () => () => {
            if (animTimerRef.current !== null) window.clearTimeout(animTimerRef.current);
        },
        [],
    );

    const isHorizontal = direction === 'horizontal';

    return (
        <SplitPaneContext.Provider value={api}>
            <div
                ref={containerRef}
                className={classNames(styles.splitPane, styles[direction], className, {
                    [styles.dragging]: isDragging,
                    [styles.animating]: isAnimating,
                })}
            >
                <div
                    ref={firstPaneRef}
                    className={styles.pane}
                    style={{
                        [isHorizontal ? 'width' : 'height']: `${String(ratio * 100)}%`,
                        flexShrink: 0,
                        [isHorizontal ? 'minWidth' : 'minHeight']: `${String(minFirst)}px`,
                    }}
                >
                    {first}
                </div>
                <div
                    className={classNames(styles.divider, {
                        [styles.dividerHorizontal]: isHorizontal,
                        [styles.dividerVertical]: !isHorizontal,
                        [styles.dividerDragging]: isDragging,
                    })}
                    onMouseDown={handleMouseDown}
                />
                <div
                    ref={secondPaneRef}
                    className={classNames(styles.pane, styles.paneFlex)}
                    style={{ [isHorizontal ? 'minWidth' : 'minHeight']: `${String(minSecond)}px` }}
                >
                    {second}
                </div>
            </div>
        </SplitPaneContext.Provider>
    );
};

export default SplitPane;
