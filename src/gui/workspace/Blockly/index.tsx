import { events, type IVM, type viewportUpdateEvent } from '../../../types/vm';
import styles from './index.module.scss';
import { useEffect, useRef, useState } from 'react';
import { MenuItem, MenuDivider } from '@szhsin/react-menu';

import { useContextMenu } from '../../contextMenu';
import { AllContextMenu } from '../../../types/gui';
import { getBlocklyMenuOptions, getBlocklyMenuEvent } from '../../../vm/blocks';

import { t } from 'i18next';

const BlocklyWorkspace = ({ vm }: { vm: IVM }): React.ReactNode => {
    const workspaceDiv = useRef<HTMLDivElement>(null);

    const [overlayText, setOverlayText] = useState('');

    useContextMenu(AllContextMenu.BLOCKLY, closeMenu => {
        const options = getBlocklyMenuOptions();
        if (!options?.length) return null;
        return options.map((opt, i) => {
            if ('separator' in opt) return <MenuDivider key={i} />;
            return (
                <MenuItem
                    key={i}
                    disabled={!opt.enabled}
                    onClick={selectEvent => {
                        const menuOpenEvent = getBlocklyMenuEvent();
                        const location =
                            menuOpenEvent instanceof PointerEvent
                                ? { x: menuOpenEvent.clientX, y: menuOpenEvent.clientY }
                                : { x: 0, y: 0 };
                        (opt.callback as (...args: unknown[]) => void)(
                            opt.scope,
                            menuOpenEvent,
                            (selectEvent as unknown as React.MouseEvent).nativeEvent,
                            location,
                        );
                        closeMenu();
                    }}
                >
                    {typeof opt.text === 'string' ? (
                        opt.text
                    ) : (
                        <span
                            dangerouslySetInnerHTML={{
                                __html: opt.text.outerHTML,
                            }}
                        />
                    )}
                </MenuItem>
            );
        });
    });

    useEffect(() => {
        const handleViewportUpdate = (data: viewportUpdateEvent) => {
            if (data.changed === 'scale')
                setOverlayText(`${t('gui:scale')}: ${data.scale.toFixed(2)}`);
            else setOverlayText(`x: ${data.x.toFixed(2)}, y: ${data.y.toFixed(2)}`);
        };
        const handleTargetChanged = () => {
            restartWorkspace();
        };
        const restartWorkspace = () => {
            if (!workspaceDiv.current) return;
            if (vm.runtime.blocks.workspaceSvg) vm.runtime.blocks.dispose();

            void vm.runtime.blocks.createWorkspace(workspaceDiv.current);
        };

        vm.off(events.SWITCH_TARGET, handleTargetChanged);
        vm.off(events.VIEWPORT_VIEW, handleViewportUpdate as (data: object) => void);
        vm.on(events.SWITCH_TARGET, handleTargetChanged);
        vm.on(events.VIEWPORT_VIEW, handleViewportUpdate as (data: object) => void);
        restartWorkspace();
        return () => {
            vm.off(events.SWITCH_TARGET, handleTargetChanged);
            vm.runtime.blocks.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.root}>
            <div ref={workspaceDiv} className={styles.workspace} />
            <div className={styles.overlay} key={overlayText}>
                {overlayText}
            </div>
        </div>
    );
};

export default BlocklyWorkspace;
