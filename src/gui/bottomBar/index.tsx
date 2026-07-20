import { useEffect, useState } from 'react';
import { events, type IVM, type viewportUpdateEvent } from '../../types/vm';
import styles from './index.module.scss';
import { t } from 'i18next';

export const BottomBar = ({ vm }: { vm: IVM }): React.ReactNode => {
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

        vm.on(events.VIEWPORT_VIEW, handleViewportUpdate as (data: object) => void);
        vm.on(events.CREATE_PROJECT, handleCreateProject, true);
        return () => {
            vm.off(events.VIEWPORT_VIEW, handleViewportUpdate as (data: object) => void);
            vm.off(events.CREATE_PROJECT, handleCreateProject);
        };
    }, [vm]);
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
            <div className={styles.right}>
                <button>notices</button>
            </div>
        </div>
    );
};
