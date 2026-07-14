import { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import styles from './index.module.scss';

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
    const [ratio, setRatio] = useState(defaultRatio);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const totalSize = direction === 'horizontal' ? rect.width : rect.height;
            const offset =
                direction === 'horizontal' ? e.clientX - rect.left : e.clientY - rect.top;

            let newRatio = offset / totalSize;
            newRatio = Math.max(
                minFirst / totalSize,
                Math.min(1 - minSecond / totalSize, newRatio),
            );
            newRatio = Math.max(0, Math.min(1, newRatio));

            setRatio(newRatio);
            onMove?.(newRatio);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            onOver?.()
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, direction, minFirst, minSecond, onMove, onOver]);

    const isHorizontal = direction === 'horizontal';

    return (
        <div
            ref={containerRef}
            className={classNames(styles.splitPane, styles[direction], className, {
                [styles.dragging]: isDragging,
            })}
        >
            <div
                className={styles.pane}
                style={{
                    [isHorizontal ? 'width' : 'height']: `${String(ratio * 100)}%`,
                    flexShrink: 0,
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
            <div className={classNames(styles.pane, styles.paneFlex)}>{second}</div>
        </div>
    );
};

export default SplitPane;
