import { useRef, useState, type PointerEvent } from 'react';
import { EditingWorkspace } from './editingWorkspace';
import styles from './index.module.scss';
import { Sidebar } from './sidebar';

export const Workspace = () => {
    const isMoving = useRef(false);
    const [widthPercent, setWidthPercent] = useState(0);
    const onResize = (event: PointerEvent<HTMLDivElement>) => {
        if (event.buttons !== 1 || !isMoving.current) return;
        setWidthPercent((event.clientX / document.documentElement.offsetWidth) * 100);
    };

    return (
        <div
            className={styles.main}
            onPointerMove={onResize}
            onPointerUp={() => {
                isMoving.current = false;
            }}
        >
            <Sidebar width={`${String(widthPercent)}%`} />

            <div
                className={styles.sizeHandle}
                onPointerDown={() => {
                    isMoving.current = true;
                }}
                onLostPointerCapture={() => {
                    isMoving.current = false;
                }}
            />

            <EditingWorkspace width={`${String(100 - widthPercent)}%`} />
        </div>
    );
};
