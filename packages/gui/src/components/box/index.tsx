import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';

import styles from './index.module.scss';

interface IBox extends React.ComponentProps<'div'> {
    tip?: string;
    tipMode?: 'markdown' | 'html' | 'text';
    tipPosition?: 'pointer' | 'dom';
}

export const Box = ({
    tip,
    tipMode,
    tipPosition = 'pointer',
    children,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    ...props
}: IBox) => {
    const divRef = useRef<HTMLDivElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const posRef = useRef({ x: 0, y: 0 });
    /**
     * - hidden: 隐藏
     * - waiting: 等待出现tip {@link timer}
     * - show：正在显示
     * - hiding：正在渐出
     */
    const [tipAniMode, setTipAniMode] = useState<'hidden' | 'waiting' | 'show' | 'hiding'>(
        'hidden',
    );

    const _updateTipPosition = () => {
        if (!tipRef.current) return;
        tipRef.current.style.left = `${String(posRef.current.x)}px`;
        tipRef.current.style.top = `${String(posRef.current.y)}px`;
    };

    const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
        onMouseEnter?.(event);
        setTipAniMode(tipAniMode === 'hiding' ? 'show' : 'waiting');
    };

    const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
        onMouseLeave?.(event);
        setTipAniMode(tipAniMode === 'show' ? 'hiding' : 'hidden');
    };

    // handleMouseMove
    // 这么做主要是让在移出元素也能动，我真聪明！
    useEffect(() => {
        if (tipAniMode === 'hidden') return;

        const onMove = (e: MouseEvent) => {
            posRef.current = { x: e.clientX + 5, y: e.clientY + 5 };
            _updateTipPosition();
        };

        window.addEventListener('mousemove', onMove);
        return () => {
            window.removeEventListener('mousemove', onMove);
        };
    }, [tipAniMode]);

    const handleTipAnimationEnd = () => {
        if (tipAniMode === 'hiding') setTipAniMode('hidden');
    };

    useEffect(() => {
        if (tipAniMode !== 'waiting') return;
        const timer = setTimeout(() => {
            setTipAniMode('show');
        }, 500);
        return () => {
            clearTimeout(timer);
        };
    }, [tipAniMode]);

    useLayoutEffect(() => {
        _updateTipPosition();
    }, [tipAniMode]);

    return (
        <div
            ref={divRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {children}

            {['show', 'hiding'].includes(tipAniMode) &&
                tip &&
                createPortal(
                    <div
                        ref={tipRef}
                        className={classNames(styles.tip, {
                            [styles.isHiding]: tipAniMode === 'hiding',
                        })}
                        onAnimationEnd={handleTipAnimationEnd}
                        style={{
                            position: 'fixed',
                            pointerEvents: 'none',
                        }}
                    >
                        {tip}
                    </div>,
                    document.body,
                )}
        </div>
    );
};
