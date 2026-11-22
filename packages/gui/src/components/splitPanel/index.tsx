import {
    useRef,
    useState,
    type ReactNode,
    type PointerEvent,
    type Ref,
    useImperativeHandle,
} from 'react';
import styles from './index.module.scss';
import classNames from 'classnames';
import { Menu } from '../menus/renderer';

export interface ISplitPanelHandle {
    setSizePercent: (value: number) => void;
    setHidingFirst: (value: boolean) => void;
    setHidingSecond: (value: boolean) => void;
    getWidthPercent: () => number;
}

/** 分割面板（这里的size均是0~100），可以通过设置ref(`const XXX = useRef<ISplitPanelHandle>(null)`)将其挂载到ref上来控制*/
export const SplitPanel = ({
    FirstElement,
    SecondElement,
    direction,
    minFirstElementSize = 0,
    minSecondElementSize = 0,
    defaultSize = 50,
    /** 是否可以在目标尺寸过小的时候隐藏对应的元素 */
    hideElement = 'none',
    /** 用于在外部影响这个面板 */
    ref,
    /** 右键手柄打开的右键菜单 */
    contextMenu,
}: {
    FirstElement: ReactNode;
    SecondElement: ReactNode;
    direction: 'vertical' | 'horizontal';
    minFirstElementSize?: number;
    minSecondElementSize?: number;
    defaultSize?: number;
    hideElement?: 'first' | 'second' | 'both' | 'none';
    contextMenu?: () => ReactNode;
    ref?: Ref<ISplitPanelHandle>;
}) => {
    const isMoving = useRef(false);
    const [sizePercent, setSizePercent] = useState(defaultSize);

    const hideFirst = ['first', 'both'].includes(hideElement);
    const hideSecond = ['second', 'both'].includes(hideElement);
    const [isHidingFirst, setHidingFirst] = useState(false);
    const [isHidingSecond, setHidingSecond] = useState(false);

    const checkHide = (newValue?: number) => {
        if ((newValue ?? sizePercent) < minFirstElementSize / 2 && hideFirst) setHidingFirst(true);
        else setHidingFirst(false);
        if (100 - (newValue ?? sizePercent) < minSecondElementSize / 2 && hideSecond)
            setHidingSecond(true);
        else setHidingSecond(false);
    };

    const onResize = (event: PointerEvent<HTMLDivElement>) => {
        if (event.buttons !== 1 || !isMoving.current) return;
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const total = direction === 'horizontal' ? rect.width : rect.height;
        if (total === 0) return;
        const size =
            ((direction === 'horizontal' ? event.clientX - rect.left : event.clientY - rect.top) /
                total) *
            100;
        setSizePercent(size);
        checkHide(size);
    };

    useImperativeHandle(
        ref,
        () => ({
            setSizePercent,
            setHidingFirst,
            setHidingSecond,
            getWidthPercent: () => sizePercent,
        }),
        [sizePercent],
    );

    const ContextMenu = contextMenu?.();

    return (
        <div
            className={styles.main}
            onPointerMove={onResize}
            onPointerUp={() => {
                isMoving.current = false;
            }}
            style={{
                flexDirection: direction === 'horizontal' ? 'row' : 'column',
            }}
        >
            <div
                style={{
                    [direction === 'horizontal' ? 'width' : 'height']:
                        `${String(isHidingSecond ? 100 : sizePercent)}%`,
                    [direction === 'horizontal' ? 'minWidth' : 'minHeight']:
                        `${String(minFirstElementSize)}%`,
                    [direction === 'horizontal' ? 'height' : 'width']: '100%',
                    display: isHidingFirst ? 'none' : '',
                }}
                className={styles.firstElement}
            >
                {FirstElement}
            </div>
            {contextMenu ? (
                <Menu
                    keyMode='right'
                    classname={classNames(styles.sizeHandle, {
                        [styles.vertical]: direction === 'vertical',
                    })}
                    Button={
                        <div
                            onPointerDown={() => {
                                isMoving.current = true;
                            }}
                            onLostPointerCapture={() => {
                                isMoving.current = false;
                            }}
                            onDoubleClick={() => {
                                setSizePercent(defaultSize);
                                checkHide(defaultSize);
                            }}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                        />
                    }
                    positioningByPointer={true}
                >
                    {ContextMenu}
                </Menu>
            ) : (
                <div
                    className={classNames(styles.sizeHandle, {
                        [styles.vertical]: direction === 'vertical',
                    })}
                    onPointerDown={() => {
                        isMoving.current = true;
                    }}
                    onLostPointerCapture={() => {
                        isMoving.current = false;
                    }}
                    onDoubleClick={() => {
                        setSizePercent(defaultSize);
                        checkHide(defaultSize);
                    }}
                />
            )}

            <div
                style={{
                    [direction === 'horizontal' ? 'width' : 'height']:
                        `${String(isHidingFirst ? 100 : 100 - sizePercent)}%`,
                    [direction === 'horizontal' ? 'minWidth' : 'minHeight']:
                        `${String(minSecondElementSize)}%`,
                    [direction === 'horizontal' ? 'height' : 'width']: '100%',
                    display: isHidingSecond ? 'none' : '',
                }}
                className={styles.secondElement}
            >
                {SecondElement}
            </div>
        </div>
    );
};
