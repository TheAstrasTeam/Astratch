import { useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useModal, type IModalInfo } from '../../lib/ModalManager';

import styles from './index.module.scss';

interface TResizeHandlers {
    onStart: (
        event: ReactPointerEvent<HTMLDivElement>,
        horizontal: 'left' | 'right' | null,
        vertical: 'top' | 'bottom' | null,
    ) => void;
    onMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
    onEnd: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

/**
 * 边和角共用的拉伸手柄
 * @author AI
 */
const ResizeHandle = ({
    className,
    dataSide,
    handlers,
}: {
    className: string;
    /** `top` / `bottom` / `left` / `right`，或 `top-left` 这类角 */
    dataSide: string;
    handlers: TResizeHandlers;
}) => (
    <div
        className={className}
        data-side={dataSide}
        onPointerDown={event => {
            handlers.onStart(
                event,
                ...([
                    dataSide.endsWith('left')
                        ? 'left'
                        : dataSide.endsWith('right')
                          ? 'right'
                          : null,
                    dataSide.startsWith('top')
                        ? 'top'
                        : dataSide.startsWith('bottom')
                          ? 'bottom'
                          : null,
                ] as ['left' | 'right' | null, 'top' | 'bottom' | null]),
            );
        }}
        onPointerMove={handlers.onMove}
        onPointerUp={handlers.onEnd}
        onPointerCancel={handlers.onEnd}
    />
);

/**
 * 单个 modal
 *
 * 拆成独立组件，是为了让 `renderer()` 的结果能被 useMemo 缓存：
 * 拖动只改变位置，不应该让 modal 里的重组件（Blockly、VM 面板等）跟着重建。
 *
 * 注意这里不订阅 store，方法通过 `getState()` 现取，
 * 否则一个 modal 移动会让所有 modal 重渲染。
 *
 * @author AI
 * @checked
 */
const ModalItem = ({
    info,
    registerRef,
}: {
    info: IModalInfo;
    registerRef: (el: HTMLDivElement | null) => void;
}) => {
    const dragStartRef = useRef<{
        pointerId: number;
        clientX: number;
        clientY: number;
        x: number;
        y: number;
    } | null>(null);
    const resizeStartRef = useRef<{
        pointerId: number;
        horizontal: 'left' | 'right' | null;
        vertical: 'top' | 'bottom' | null;
        clientX: number;
        clientY: number;
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
    useEffect(() => {
        useModal
            .getState()
            .setModalPos(
                info.id,
                clamp(
                    info.x,
                    0,
                    Math.max(0, 1 - info.width / document.documentElement.clientWidth),
                ),
                clamp(
                    info.y,
                    0,
                    Math.max(0, 1 - info.height / document.documentElement.clientHeight),
                ),
            );
        // 故意的，需要缓存
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 缓存用
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const content = useMemo(() => info.renderer(), [info.renderer]);

    const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !info.canMove) return;
        const modal = useModal.getState().getModal(info.id);
        if (!modal) return;
        dragStartRef.current = {
            pointerId: event.pointerId,
            clientX: event.clientX,
            clientY: event.clientY,
            x: modal.x,
            y: modal.y,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const start = dragStartRef.current;
        if (start?.pointerId !== event.pointerId) return;

        // position: fixed 的百分比相对不含滚动条的包含块，所以用 clientWidth 而不是 innerWidth
        const { clientWidth: viewportWidth, clientHeight: viewportHeight } =
            document.documentElement;
        if (viewportWidth === 0 || viewportHeight === 0) return;

        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { getModal, setModalPos } = useModal.getState();
        const modal = getModal(info.id);
        if (!modal) return;

        // 整块 modal 不越出视口；视口比 modal 还小时退化为贴边
        const maxX = Math.max(0, 1 - modal.width / viewportWidth);
        const maxY = Math.max(0, 1 - modal.height / viewportHeight);

        // 位移以按下瞬间为基准累加，clamp 只作用于最终显示值
        const rawX = start.x + (event.clientX - start.clientX) / viewportWidth;
        const rawY = start.y + (event.clientY - start.clientY) / viewportHeight;

        setModalPos(info.id, clamp(rawX, 0, maxX), clamp(rawY, 0, maxY));
    };

    const handleDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (dragStartRef.current?.pointerId !== event.pointerId) return;
        dragStartRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
    };

    /**
     * 尺寸拉伸
     *
     * @author AI
     * @checked
     */
    const handleResizeStart = (
        event: ReactPointerEvent<HTMLDivElement>,
        horizontal: 'left' | 'right' | null,
        vertical: 'top' | 'bottom' | null,
    ) => {
        if (event.button !== 0) return;
        if (!horizontal && !vertical) return;
        const modal = useModal.getState().getModal(info.id);
        if (!modal) return;
        resizeStartRef.current = {
            pointerId: event.pointerId,
            horizontal,
            vertical,
            clientX: event.clientX,
            clientY: event.clientY,
            x: modal.x,
            y: modal.y,
            width: modal.width,
            height: modal.height,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleResizeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const start = resizeStartRef.current;
        if (start?.pointerId !== event.pointerId) return;

        const { clientWidth: viewportWidth, clientHeight: viewportHeight } =
            document.documentElement;
        if (viewportWidth === 0 || viewportHeight === 0) return;

        // eslint-disable-next-line @typescript-eslint/unbound-method
        const { getModal, setModalPos, setModalSize } = useModal.getState();
        if (!getModal(info.id)) return;

        // 与拖动同理：位移从按下瞬间算起，被 clamp 吃掉的部分依然留在 delta 里
        const deltaX = event.clientX - start.clientX;
        const deltaY = event.clientY - start.clientY;

        let { x, width } = start;
        if (start.horizontal === 'right') {
            // 右边不能越过视口右侧
            const maxWidth = Math.max(250, viewportWidth - start.x * viewportWidth);
            width = clamp(start.width + deltaX, 250, maxWidth);
        } else if (start.horizontal === 'left') {
            // 右边由按下时的状态定死，宽度变化后再反推 x
            const right = Math.max(
                250,
                Math.min(start.x * viewportWidth + start.width, viewportWidth),
            );
            width = clamp(start.width - deltaX, 250, right);
            x = (right - width) / viewportWidth;
        }

        let { y, height } = start;
        if (start.vertical === 'bottom') {
            // 底边不能越过视口底部；用起始 y，拉伸过程中它不会变
            const maxHeight = Math.max(300, viewportHeight - start.y * viewportHeight);
            height = clamp(start.height + deltaY, 300, maxHeight);
        } else if (start.vertical === 'top') {
            // 底边由按下时的状态定死，高度变化后再反推 y
            const bottom = Math.max(
                300,
                Math.min(start.y * viewportHeight + start.height, viewportHeight),
            );
            height = clamp(start.height - deltaY, 300, bottom);
            y = (bottom - height) / viewportHeight;
        }

        setModalSize(info.id, width, height);
        // 只有拖左 / 上边时位置才会变
        if (start.horizontal === 'left' || start.vertical === 'top') setModalPos(info.id, x, y);
    };

    const handleResizeEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (resizeStartRef.current?.pointerId !== event.pointerId) return;
        resizeStartRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const resizeHandlers: TResizeHandlers = {
        onStart: handleResizeStart,
        onMove: handleResizeMove,
        onEnd: handleResizeEnd,
    };

    return (
        <div
            ref={registerRef}
            style={{
                width: info.width,
                height: info.height,
                left: `${String(info.x * 100)}%`,
                top: `${String(info.y * 100)}%`,
                zIndex: info.zIndex,
            }}
            className={styles.modal}
            onPointerDownCapture={() => {
                useModal.getState().bringToFront(info.id);
            }}
        >
            {info.canResize && (
                <>
                    <ResizeHandle
                        className={styles.resizeWidth}
                        dataSide='left'
                        handlers={resizeHandlers}
                    />
                    <ResizeHandle
                        className={styles.resizeWidth}
                        dataSide='right'
                        handlers={resizeHandlers}
                    />
                    <ResizeHandle
                        className={styles.resizeHeight}
                        dataSide='top'
                        handlers={resizeHandlers}
                    />
                    <ResizeHandle
                        className={styles.resizeHeight}
                        dataSide='bottom'
                        handlers={resizeHandlers}
                    />
                </>
            )}

            {/* 四个角：两个轴同时生效，靠 z-index 压在边手柄上面 */}
            {info.canResize &&
                (['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(
                    dataSide => (
                        <ResizeHandle
                            key={dataSide}
                            className={styles.resizeCorner}
                            dataSide={dataSide}
                            handlers={resizeHandlers}
                        />
                    ),
                )}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div
                    className={styles.titlebar}
                    onPointerDown={handleDragStart}
                    onPointerMove={handleDragMove}
                    onPointerUp={handleDragEnd}
                    onPointerCancel={handleDragEnd}
                >
                    <span>{info.name}</span>
                </div>
                <div style={{ flex: '1', minHeight: 0, overflow: 'auto' }}>{content}</div>
            </div>
        </div>
    );
};

export const Modal_coverLayer = () => {
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const modals = useModal();

    return (
        <div className={styles.main}>
            {Array.from(modals.modalStorage).map(([id, modalInfo], index) => (
                <ModalItem
                    key={id}
                    info={modalInfo}
                    registerRef={el => {
                        itemRefs.current[index] = el;
                    }}
                />
            ))}
        </div>
    );
};
