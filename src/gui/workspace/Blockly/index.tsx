/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { type IVM } from '../../../types/vm';
import styles from './index.module.scss';
import { useEffect, useRef } from 'react';
import { MenuItem, MenuDivider } from '@szhsin/react-menu';

import { useContextMenu } from '../../contextMenu';
import { AllContextMenu } from '../../../types/gui';
import { getBlocklyMenuOptions, getBlocklyMenuEvent } from '../../../lib/BlocklyAdapter/index';

const BlocklyWorkspace = ({ vm, targetId }: { vm: IVM; targetId: string }): React.ReactNode => {
    const workspaceDiv = useRef<HTMLDivElement>(null);
    const disposeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        if (!workspaceDiv.current) return;

        if (disposeTimer.current) {
            clearTimeout(disposeTimer.current);
            disposeTimer.current = null;
        }

        if (vm.runtime.editingTargetID !== targetId) vm.runtime.switchTarget(targetId);
        void vm.runtime.blocks.createWorkspace(workspaceDiv.current, false);

        return () => {
            // React 会在下一个 targetId effect 之前运行清理
            // 延迟释放以便目标切换时保持现有的 Blockly 工作区活着
            disposeTimer.current = setTimeout(() => {
                disposeTimer.current = null;
                vm.runtime.blocks.dispose();
            }, 0);
        };
    }, [vm, targetId]);

    return (
        <div className={styles.root}>
            <div ref={workspaceDiv} className={styles.workspace} />
        </div>
    );
};

export default BlocklyWorkspace;
