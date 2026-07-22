import { useEffect, useState } from 'react';
import { Toast } from '../../lib/ToastManager';
import type { IToast } from '../../types/lib';
import styles from './index.module.scss';
import { ToastItem } from './ToastItem';

const SUBSCRIBE_ID = 'toastLayer';

export const ToastLayer = ({ y }: { y: number }) => {
    const [toasts, setToasts] = useState<IToast[]>(() =>
        Array.from(Toast.getAllHistory().values()),
    );

    useEffect(() => {
        const unsubscribe = Toast.on(SUBSCRIBE_ID, data => {
            if (data.type === 'refresh') {
                setToasts(Array.from(Toast.getAllHistory().values()));
            } else {
                setToasts(prev =>
                    prev.map(t => (t.id === data.id ? { ...t, progress: data.progress } : t)),
                );
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <div
            className={styles.layer}
            style={{
                top: `${y.toString()}px`,
            }}
        >
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClick={() => Toast.interact(toast.id)} />
            ))}
        </div>
    );
};
