/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { events, type IVM, type TViewportUpdateEvent } from '../../types/vm/vm';
import styles from './index.module.scss';
import { t } from 'i18next';
import { ToastLayer } from '../../components/toastLayer';
import { ToastHistoryPanel } from '../../components/toastLayer/ToastHistoryPanel';

import NotificationIcon from '../../assets/notifications.svg?react';
import NotificationUnreadIcon from '../../assets/notificationsUnread.svg?react';
import { Toast } from '../../lib/ToastManager';

export const BottomBar = ({ vm }: { vm: IVM }): React.ReactNode => {
    const [noticeY, setNoticeY] = useState(0);
    const [historyOpen, setHistoryOpen] = useState(false);

    const noticeButtonRef = useRef<HTMLButtonElement>(null);

    const [overlayText, setOverlayText] = useState({
        x: '0',
        y: '0',
        scale: '1',
    });
    useEffect(() => {
        const handleViewportUpdate = (data: TViewportUpdateEvent) => {
            if (data.changed === 'scale') {
                setOverlayText(prev => ({ ...prev, scale: data.scale.toFixed(2) }));
            } else {
                setOverlayText(prev => ({ ...prev, x: data.x.toFixed(2), y: data.y.toFixed(2) }));
            }
        };
        const handleResize = () => {
            if (!noticeButtonRef.current) return;
            const rect = noticeButtonRef.current.getBoundingClientRect();
            setNoticeY(rect.top);
        };

        vm.off(events.VIEWPORT_VIEW, handleViewportUpdate as (data: object) => void);
        window.removeEventListener('resize', handleResize);
        window.addEventListener('resize', handleResize);
        handleResize();
        vm.on(events.VIEWPORT_VIEW, handleViewportUpdate as (data: object) => void);
        return () => {
            window.removeEventListener('resize', handleResize);
            vm.off(events.VIEWPORT_VIEW, handleViewportUpdate as (data: object) => void);
        };
    }, [vm, noticeButtonRef]);
    return (
        <>
            <div className={styles.main}>
                <div className={styles.left}>
                    <button className={styles.positionText}>
                        {vm.isEditingProject &&
                            t(`gui:bottomBar.positionText`, {
                                x: overlayText.x,
                                y: overlayText.y,
                                scale: overlayText.scale,
                            })}
                    </button>
                </div>
                <div className={styles.right}>
                    <button
                        ref={noticeButtonRef}
                        onClick={() => {
                            setHistoryOpen(v => !v);
                        }}
                        aria-expanded={historyOpen}
                    >
                        {Toast.getFullHistory().length > 0 ? (
                            <NotificationUnreadIcon />
                        ) : (
                            <NotificationIcon />
                        )}
                    </button>
                </div>
            </div>
            <div className={styles.layer}>
                <ToastLayer y={noticeY} />
                {historyOpen && (
                    <ToastHistoryPanel
                        anchorY={noticeY}
                        anchorRef={noticeButtonRef}
                        onClose={() => {
                            setHistoryOpen(false);
                        }}
                    />
                )}
            </div>
        </>
    );
};
