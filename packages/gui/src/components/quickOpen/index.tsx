import { useEffect, useRef, useState, type AnimationEvent } from 'react';
import classNames from 'classnames';
import { t } from 'astratch-i18n';

import { keydownHandler, useQuickOpen } from './api';
import { quickOpenManager } from '../../lib/QuickOpenManager';

import { Hr } from '../hr';

import styles from './index.module.scss';

const HomeGoto = ({ setInputContent }: { setInputContent: (text: string) => void }) => {
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const items = Array.from(quickOpenManager.listModes());

    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        keydownHandler.registerQuickOpenKeydown(key => {
            if (key === 'ArrowDown') {
                setHighlightedIndex(index => Math.min(index + 1, items.length - 1));
            } else if (key === 'ArrowUp') {
                setHighlightedIndex(index => Math.max(index - 1, 0));
            } else {
                setInputContent(`${items[highlightedIndex][1].prefix} `);
            }
        });
        return () => {
            keydownHandler.registerQuickOpenKeydown(null);
        };
    }, [highlightedIndex, items, items.length, setInputContent]);

    useEffect(() => {
        itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }, [highlightedIndex]);

    return (
        <div className={styles.home}>
            {items.map(([, item], index) => {
                const Icon = item.icon;
                return (
                    <div
                        className={classNames(styles.homeGoto, {
                            [styles.isHovering]: highlightedIndex === index,
                        })}
                        onClick={() => {
                            setInputContent(`${item.prefix} `);
                        }}
                        key={item.id}
                        ref={el => {
                            itemRefs.current[index] = el;
                        }}
                        onMouseEnter={() => {
                            setHighlightedIndex(index);
                        }}
                    >
                        {Icon && (
                            <div className={styles.photo}>
                                <Icon />
                            </div>
                        )}
                        <div className={styles.texts}>
                            <div className={styles.firstLine}>
                                <span>{item.translate ? t(item.nameID) : item.name}</span>
                                <div className={styles.gotoCommand}>{item.prefix}</div>
                            </div>
                            <span className={styles.description}>
                                {item.translate ? t(item.descriptionID) : item.description}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const QuickOpenPanel = ({ closing }: { closing: boolean }) => {
    const { closeQuickOpen, finishCloseQuickOpen } = useQuickOpen(state => state);
    const [inputText, setInputText] = useState('');

    const isTouchingMain = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleMouseUp = () => {
            if (!isTouchingMain.current) closeQuickOpen();
        };
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [closeQuickOpen]);

    const handleEnteredMain = () => {
        isTouchingMain.current = true;
    };

    const handleLeavedMain = () => {
        isTouchingMain.current = false;
    };

    const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
        // 插件 renderer 里子元素的动画也会跑到这里
        // 冒泡，戳！
        if (event.target !== event.currentTarget) return;
        if (closing) finishCloseQuickOpen();
    };

    const setInputContent = (text: string) => {
        if (!inputRef.current) return;
        setInputText(text);
        inputRef.current.focus();
    };

    const renderUI = () => {
        const items = Array.from(quickOpenManager.listModes());
        // 前缀后必须带空格才算（如果要用`>Hello`=...，你喜欢就好）
        const matched = items.find(
            ([, item]) => item.prefix && inputText.startsWith(`${item.prefix} `),
        );

        if (matched) {
            const Renderer = matched[1].Renderer;
            const content = inputText.slice(matched[1].prefix.length).trimStart();
            return (
                <div className={styles.home}>
                    <Renderer content={content} close={closeQuickOpen} />
                </div>
            );
        }

        return <HomeGoto setInputContent={setInputContent} />;
    };

    return (
        <div
            className={classNames(styles.main, {
                [styles.hiding]: closing,
            })}
            onAnimationEnd={handleAnimationEnd}
            onMouseEnter={handleEnteredMain}
            onMouseLeave={handleLeavedMain}
        >
            <input
                ref={inputRef}
                value={inputText}
                onChange={event => {
                    setInputText(event.target.value);
                }}
                onKeyDown={event => {
                    if (
                        event.key === 'ArrowUp' ||
                        event.key === 'ArrowDown' ||
                        event.key === 'Enter'
                    ) {
                        if (keydownHandler.handler) {
                            event.preventDefault();
                            keydownHandler.handler(event.key);
                        }
                    }
                }}
            />
            <Hr />
            {renderUI()}
        </div>
    );
};

export const QuickOpen_coverLayer = () => {
    const phase = useQuickOpen(state => state.phase);
    if (phase === 'closed') return null;
    return <QuickOpenPanel closing={phase === 'closing'} />;
};
