import { useEffect, useRef, useState } from 'react';
import { Toast } from '../../lib/ToastManager';
import type { IToast } from '../../types/lib';
import { ToastItem } from './ToastItem';
import styles from './index.module.scss';
import Close from '../../assets/close.svg?react'
import { t } from 'i18next';

const SUBSCRIBE_ID = 'toastHistoryPanel';

export const ToastHistoryPanel = ({
    anchorY,
    anchorRef,
    onClose,
}: {
    anchorY: number;
    anchorRef: React.RefObject<HTMLElement | null>;
    onClose: () => void;
}) => {
    const [toasts, setToasts] = useState<IToast[]>(() => Toast.getFullHistory());
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = Toast.on(SUBSCRIBE_ID, data => {
            if (data.type === 'refresh') {
                setToasts(Toast.getFullHistory());
            }
        });

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                panelRef.current?.contains(target) ||
                anchorRef.current?.contains(target)
            ) {
                return;
            }
            onClose();
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);

        return () => {
            unsubscribe();
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div
            ref={panelRef}
            className={styles.historyPanel}
            style={{
                top: `${anchorY.toString()}px`,
            }}
        >
            <div className={styles.historyHeader}>
                <span>{t('gui:toast')}</span>
                <button className={styles.historyClose} onClick={onClose} aria-label='close'>
                    <Close />
                </button>
            </div>
            <div className={styles.historyList}>
                {toasts.length === 0 ? (
                    <div className={styles.historyEmpty}>{t('gui:toast.noRecords')}</div>
                ) : (
                    toasts.map(toast => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onClick={() => Toast.trigger(toast.id)}
                            needSpinner={false}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
