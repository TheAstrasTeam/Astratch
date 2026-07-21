import { useEffect, useRef, useState } from 'react';
import { events, type IVM, type viewportUpdateEvent } from '../../types/vm';
import styles from './index.module.scss';
import { t } from 'i18next';
import { ToastLayer } from '../../components/toastLayer';
import { ToastHistoryPanel } from '../../components/toastLayer/ToastHistoryPanel';

export const BottomBar = ({ vm }: { vm: IVM }): React.ReactNode => {
    const [noticeY, setNoticeY] = useState(0);
    const [historyOpen, setHistoryOpen] = useState(false);

    const noticeButtonRef = useRef<HTMLButtonElement>(null);

    const [isCreatedProject, setIsCreatedProject] = useState(false);
    const [overlayText, setOverlayText] = useState({
        x: '0',
        y: '0',
        scale: '1',
    });
    useEffect(() => {
        const handleViewportUpdate = (data: viewportUpdateEvent) => {
            if (data.changed === 'scale') {
                setOverlayText(prev => ({ ...prev, scale: data.scale.toFixed(2) }));
            } else {
                setOverlayText(prev => ({ ...prev, x: data.x.toFixed(2), y: data.y.toFixed(2) }));
            }
        };
        const handleCreateProject = () => {
            setIsCreatedProject(true);
        };
        const handleResize = () => {
            if (!noticeButtonRef.current) return;
            const rect = noticeButtonRef.current.getBoundingClientRect();
            setNoticeY(rect.top);
        };

        vm.off(events.VIEWPORT_VIEW, handleViewportUpdate as (data: object) => void);
        vm.off(events.CREATE_PROJECT, handleCreateProject);
        window.removeEventListener('resize', handleResize);
        window.addEventListener('resize', handleResize);
        handleResize();
        vm.on(events.VIEWPORT_VIEW, handleViewportUpdate as (data: object) => void);
        vm.on(events.CREATE_PROJECT, handleCreateProject, true);
        return () => {
            window.removeEventListener('resize', handleResize);
            vm.off(events.VIEWPORT_VIEW, handleViewportUpdate as (data: object) => void);
            vm.off(events.CREATE_PROJECT, handleCreateProject);
        };
    }, [vm, noticeButtonRef]);
    return (
        <div className={styles.main}>
            <div className={styles.left}>
                <button className={styles.positionText}>
                    {isCreatedProject &&
                        t(`gui:bottomBar_positionText`, {
                            x: overlayText.x,
                            y: overlayText.y,
                            scale: overlayText.scale,
                        })}
                </button>
            </div>
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
            <div className={styles.right}>
                <button
                    ref={noticeButtonRef}
                    onClick={() => {
                        setHistoryOpen(v => !v);
                    }}
                    aria-expanded={historyOpen}
                >
                    notices
                </button>
            </div>
        </div>
    );
};
