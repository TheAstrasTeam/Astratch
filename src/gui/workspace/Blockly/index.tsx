import { useEffect, useRef, useState } from 'react';
import { events, type IVM } from '../../../types/vm';
import styles from './index.module.scss';

const BlocklyWorkspace = ({ vm }: { vm: IVM }): React.ReactNode => {
    const workspaceDiv = useRef<HTMLDivElement>(null);

    //缩放 工作区位置显示 by chatgpt我也不知道什么版本＆dpskv4p
    const overlayTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
    const lastScaleRef = useRef<number | null>(null);
    const lastPositionRef = useRef({ x: 0, y: 0 });
    const workspaceChangeListenerRef = useRef<((event: unknown) => void) | null>(null);
    const [overlayText, setOverlayText] = useState('');
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [transition, setTransition] = useState('opacity 0.5s ease');
    useEffect(() => {
        const showOverlay = (text: string) => {
            setOverlayText(text);
            setOverlayVisible(true);
            setTransition('none');
            requestAnimationFrame(() => {
                setTransition('opacity 0.5s ease');
            });
            if (overlayTimerRef.current) window.clearTimeout(overlayTimerRef.current);
            overlayTimerRef.current = window.setTimeout(() => {
                setOverlayVisible(false);
            }, 300);
        };

        const handleWorkspaceViewportChange = (_event: unknown) => {
            const workspace = vm.runtime.blocks.workspaceSvg;
            if (!workspace) return;

            const nextScale = Number(workspace.scale ?? 1);
            const nextX = Math.round(workspace.scrollX ?? 0);
            const nextY = Math.round(workspace.scrollY ?? 0);

            const previousScale = lastScaleRef.current;
            const previousPosition = lastPositionRef.current;
            const hasScaleChanged = previousScale !== null && Math.abs(nextScale - previousScale) > 0.001;
            const hasPositionChanged =
                Math.abs(nextX - previousPosition.x) > 1 || Math.abs(nextY - previousPosition.y) > 1;

            if (hasScaleChanged) {
                showOverlay(`${Math.round(nextScale * 100)}%`);
            } else if (hasPositionChanged) {
                showOverlay(`x=${nextX} y=${nextY}`);
            }

            lastScaleRef.current = nextScale;
            lastPositionRef.current = { x: nextX, y: nextY };
        };

        const handleTargetChanged = () => {
            restartWorkspace();
        };
        const restartWorkspace = () => {
            if (!workspaceDiv.current) return;
            if (vm.runtime.blocks.workspaceSvg) vm.runtime.blocks.dispose();

            void vm.runtime.blocks.createWorkspace(workspaceDiv.current).then(() => {
                const workspace = vm.runtime.blocks.workspaceSvg;
                if (!workspace) return;
                if (workspaceChangeListenerRef.current) {
                    workspace.removeChangeListener(workspaceChangeListenerRef.current);
                }
                workspaceChangeListenerRef.current = handleWorkspaceViewportChange;
                workspace.addChangeListener(handleWorkspaceViewportChange);
            });
        };

        vm.off(events.SWITCH_TARGET, handleTargetChanged);
        vm.on(events.SWITCH_TARGET, handleTargetChanged);
        restartWorkspace();
        return () => {
            vm.off(events.SWITCH_TARGET, handleTargetChanged);
            if (workspaceChangeListenerRef.current) {
                vm.runtime.blocks.workspaceSvg?.removeChangeListener(workspaceChangeListenerRef.current);
                workspaceChangeListenerRef.current = null;
            }
            if (overlayTimerRef.current) window.clearTimeout(overlayTimerRef.current);
            vm.runtime.blocks.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.root}>
            <div ref={workspaceDiv} className={styles.workspace} />
            <div
                className={styles.overlay}
                style={{ opacity: overlayVisible ? 1 : 0, transition }}
            >
                {overlayText}
            </div>
        </div>
    );
};

export default BlocklyWorkspace;
