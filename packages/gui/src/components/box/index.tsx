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

    useEffect(() => {
        if (tipAniMode !== 'waiting') return;
        const timer = setTimeout(() => {
            setTipAniMode('show');
        }, 500);
        return () => {
            clearTimeout(timer);
        };
    }, [tipAniMode]);

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

    /** 下面的是 {@link tipPosition} 为 dom 才需要的喵 */

    useLayoutEffect(() => {
        if (tipPosition !== 'dom' || !divRef.current || !tipRef.current) return;
        const divPos = divRef.current.getBoundingClientRect();
        const screenSize = {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
        };
        const posSize = { width: tipRef.current.offsetWidth, height: tipRef.current.offsetHeight };
        posRef.current.x = Math.min(divPos.right, screenSize.width - posSize.width);
        posRef.current.y = Math.min(divPos.bottom, screenSize.height - posSize.height);
        _updateTipPosition();
    }, [tipAniMode, tipPosition]);

    /** 下面的是 {@link tipPosition} 为 pointer 才需要的喵 */

    // handleMouseMove
    // 这么做主要是让在移出元素也能动，我真聪明！
    // DeepSeek是好女孩吗，一直给我出离奇方案
    useEffect(() => {
        if (tipAniMode === 'hidden' || tipPosition !== 'pointer') return;

        const onMove = (e: MouseEvent) => {
            const screenSize = {
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight,
            };
            const posSize = {
                width: tipRef.current?.offsetWidth ?? 0,
                height: tipRef.current?.offsetHeight ?? 0,
            };
            posRef.current = {
                x: Math.min(e.clientX + 5, screenSize.width - posSize.width),
                y: Math.min(e.clientY + 5, screenSize.height - posSize.height),
            };
            _updateTipPosition();
        };

        window.addEventListener('mousemove', onMove);
        return () => {
            window.removeEventListener('mousemove', onMove);
        };
    }, [tipAniMode, tipPosition]);

    const handleTipAnimationEnd = () => {
        if (tipAniMode === 'hiding') setTipAniMode('hidden');
    };

    useLayoutEffect(() => {
        if (tipPosition !== 'pointer') return;
        _updateTipPosition();
    }, [tipAniMode, tipPosition]);

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
