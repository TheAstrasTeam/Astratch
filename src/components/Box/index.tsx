/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/** @author AI + KOSHINO */

import type React from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import Markdown from 'react-markdown';
import styles from './index.module.scss';
import { type ReactNode } from 'react';

import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { spawnBlockAST, spawnBlocksSvg } from '../../utils/ash-DSLToBlocks';

interface IBox extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
    title?: string;
    titleSec?: number;
    titleType?: 'markdown' | 'dom' | 'text';
    children: React.ReactNode;
}

const TIP_ANIMATION_MS = 200;

interface IAnchor {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

// 包裹层是 display: contents，没有自己的盒子；用 Range 量出 children 的实际包围盒
const measureAnchor = (wrapper: HTMLDivElement | null): IAnchor | null => {
    if (wrapper === null) return null;
    const range = document.createRange();
    range.selectNodeContents(wrapper);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
};

// 生成实际的位置
const computeTipPos = (anchor: IAnchor, tip: HTMLElement): { left: number; top: number } => {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const { offsetWidth, offsetHeight } = tip;

    let left = anchor.left;
    if (left + offsetWidth > viewportWidth) {
        left = anchor.right - offsetWidth;
    }
    left = Math.min(left, viewportWidth - offsetWidth);

    let top = anchor.bottom;
    if (top + offsetHeight > viewportHeight) {
        top = anchor.top - offsetHeight;
    }
    top = Math.min(top, viewportHeight - offsetHeight);

    return { left, top };
};

interface AsyncAshBlockProps {
    children?: ReactNode;
    className?: string;
}

const AsyncAshBlock = ({ children }: AsyncAshBlockProps) => {
    const [content, setContent] = useState<string | null>(null);

    useEffect(() => {
        void (async () => {
            const ast = await spawnBlockAST(children as string);
            if (!ast) return;
            const svg = await spawnBlocksSvg(ast);
            setContent(svg);
        })();
    }, [children]);

    if (content === null) return null;

    return <div className={styles.ashBlock} dangerouslySetInnerHTML={{ __html: content }} />;
};

/* 承载容器 */
export const Box = ({
    title,
    titleSec = 0.5,
    titleType = 'text',
    children,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    ...props
}: IBox) => {
    const [mounted, setMounted] = useState<boolean>(false);
    const [leaving, setLeaving] = useState<boolean>(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 避免在已卸载组件上 setState
    useEffect(
        () => () => {
            if (showTimer.current !== null) clearTimeout(showTimer.current);
            if (hideTimer.current !== null) clearTimeout(hideTimer.current);
        },
        [],
    );

    const clearShowTimer = () => {
        if (showTimer.current !== null) {
            clearTimeout(showTimer.current);
            showTimer.current = null;
        }
    };
    const clearHideTimer = () => {
        if (hideTimer.current !== null) {
            clearTimeout(hideTimer.current);
            hideTimer.current = null;
        }
    };

    const applyTipPos = useCallback(() => {
        const tip = tipRef.current;
        const anchor = measureAnchor(wrapperRef.current);
        if (tip === null || anchor === null) return;
        const { left, top } = computeTipPos(anchor, tip);
        tip.style.left = `${String(left)}px`;
        tip.style.top = `${String(top)}px`;
    }, []);

    // tooltip 首次挂载时定位（贴 box 右下，越界自动翻转/钳制）；useLayoutEffect 早于绘制，不会闪烁
    useLayoutEffect(() => {
        if (mounted) applyTipPos();
    }, [mounted, applyTipPos]);

    const cancelHide = () => {
        clearHideTimer();
        setLeaving(false);
    };

    const scheduleHide = () => {
        clearShowTimer();
        if (mounted) {
            setLeaving(true);
            hideTimer.current = setTimeout(() => {
                hideTimer.current = null;
                setMounted(false);
                setLeaving(false);
            }, TIP_ANIMATION_MS);
        }
    };

    const handleEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        clearShowTimer();
        clearHideTimer();
        if (mounted) {
            setLeaving(false);
        } else {
            showTimer.current = setTimeout(
                () => {
                    showTimer.current = null;
                    setMounted(true);
                    setLeaving(false);
                },
                Math.max(0, titleSec) * 1000,
            );
        }
        onMouseEnter?.(e);
    };

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        // 位置锚定在 box 而非指针；重算以跟上滚动/布局变化
        applyTipPos();
        onMouseMove?.(e);
    };

    const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        // 指针移入 tip（含 tip 内的 iframe 等）不算离开 box
        const related = e.relatedTarget;
        if (related instanceof Node && tipRef.current?.contains(related)) {
            return;
        }
        scheduleHide();
        onMouseLeave?.(e);
    };

    const handleTipEnter = () => {
        cancelHide();
    };

    const handleTipLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        // 指针移回 box，或仍在 tip 内（如进入 iframe），都不关闭
        const related = e.relatedTarget;
        if (
            related instanceof Node &&
            (tipRef.current?.contains(related) || wrapperRef.current?.contains(related))
        ) {
            return;
        }
        scheduleHide();
    };

    /** 'html' 分支会在移动鼠标后重新渲染，所以加了memo */
    const tipContent = useMemo(() => {
        if (!title) return null;
        switch (titleType) {
            case 'dom':
                return <div dangerouslySetInnerHTML={{ __html: title }} />;
            case 'markdown':
                return (
                    <div className={styles.markdown}>
                        <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                            components={{
                                code: ({ className, children, ...props }) => {
                                    const match = /language-(\w+)/.exec(className ?? '');
                                    const language = match ? match[1] : '';

                                    if (language === 'ash') {
                                        return (
                                            <AsyncAshBlock className={className} {...props}>
                                                {children}
                                            </AsyncAshBlock>
                                        );
                                    }

                                    return (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                            }}
                        >
                            {title}
                        </Markdown>
                    </div>
                );
            default:
                return <span>{title}</span>;
        }
    }, [title, titleType]);

    return (
        <div
            ref={wrapperRef}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onMouseMove={handleMove}
            style={{
                display: 'contents',
            }}
            {...props}
        >
            {children}
            {mounted &&
                title &&
                createPortal(
                    <div
                        ref={tipRef}
                        className={classNames(styles.tipBox, { [styles.leaving]: leaving })}
                        onMouseEnter={handleTipEnter}
                        onMouseLeave={handleTipLeave}
                        aria-hidden={leaving}
                    >
                        {tipContent}
                    </div>,
                    document.body,
                )}
        </div>
    );
};
