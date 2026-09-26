import {
    useEffect,
    useRef,
    useState,
    type AnimationEvent,
    type FunctionComponent,
    type SVGProps,
} from 'react';
import classNames from 'classnames';
import { t } from 'astratch-i18n';

import { useQuickOpen } from './api';
import { quickOpenManager } from '../../lib/QuickOpenManager';

import { Hr } from '../hr';

import styles from './index.module.scss';

const HomeGoto = ({
    Img,
    name,
    command,
    description,
    onClick,
}: {
    Img: FunctionComponent<SVGProps<SVGSVGElement>>;
    name: string;
    description: string;
    command: string;
    onClick: () => void;
}) => (
    <div className={styles.homeGoto} onClick={onClick}>
        <div className={styles.photo}>
            <Img />
        </div>
        <div className={styles.texts}>
            <div className={styles.firstLine}>
                <span>{name}</span>
                <div className={styles.gotoCommand}>{command}</div>
            </div>
            <span className={styles.description}>{description}</span>
        </div>
    </div>
);

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

        return (
            <div className={styles.home}>
                {items.map(([, item]) => (
                    <HomeGoto
                        key={item.id}
                        Img={item.icon}
                        name={item.translate ? t(item.nameID) : item.name}
                        description={item.translate ? t(item.descriptionID) : item.description}
                        command={item.prefix}
                        onClick={() => {
                            setInputContent(`${item.prefix} `);
                        }}
                    />
                ))}
            </div>
        );
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
