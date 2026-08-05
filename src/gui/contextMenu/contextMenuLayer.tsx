/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { ControlledMenu, useMenuState } from '@szhsin/react-menu';
import useContextMenuStore from '../../stores/useContextMenuStore';
import { menuContentRegistry } from './menuRegistry';
import './contextMenuLayer.scss';

export const CONTEXT_MENU_LAYER_ID = 'ash-context-menu-layer';

/** 拖动距离不超过该值视为普通点击 */
const RELEASE_THRESHOLD = 4;

export function ContextMenuLayer() {
    const openMenuId = useContextMenuStore(state => state.openMenuId);
    const anchorPoint = useContextMenuStore(state => state.anchorPoint);
    const closeMenu = useContextMenuStore(state => state.closeMenu);

    const [menuState, toggleMenu] = useMenuState({ transition: true });

    // 按下记录：用于"按住拖到选项松手触发"
    const pressRef = useRef<{
        element: Element | null;
        inMenu: boolean;
        x: number;
        y: number;
    } | null>(null);

    useEffect(() => {
        toggleMenu(!!openMenuId);
    }, [openMenuId, toggleMenu]);

    useEffect(() => {
        // Blockly 对 pointerdown 调了 preventDefault，会抑制 mouse 事件派发，故用 pointer 事件
        const mouse = (e: PointerEvent) =>
            e.pointerType === 'mouse' && (e.button === 0 || e.button === 2);

        const onDown = (e: PointerEvent) => {
            if (!mouse(e)) return;
            const el = e.target as Element | null;
            pressRef.current = {
                element: el,
                inMenu: !!el?.closest('.szh-menu-container'),
                x: e.clientX,
                y: e.clientY,
            };
        };

        const onUp = (e: PointerEvent) => {
            if (!mouse(e)) return;
            const press = pressRef.current;
            pressRef.current = null;
            if (!press || press.inMenu || !useContextMenuStore.getState().openMenuId) return;

            const el = document.elementFromPoint(e.clientX, e.clientY);
            const item = (el as HTMLElement | null)?.closest<HTMLElement>('.szh-menu__item');
            if (item && !item.classList.contains('szh-menu__item--disabled')) {
                item.click();
                return;
            }
            // 松手在按下的按钮上、或右键原地松手，视为普通点击，保持菜单打开
            const sameButton =
                el !== null &&
                !!el.closest('button') &&
                el.closest('button') === press.element?.closest('button');
            const inPlace =
                Math.hypot(e.clientX - press.x, e.clientY - press.y) < RELEASE_THRESHOLD;
            if (!sameButton && !(inPlace && e.button === 2)) closeMenu();
        };

        window.addEventListener('pointerdown', onDown, true);
        window.addEventListener('pointerup', onUp, true);
        return () => {
            window.removeEventListener('pointerdown', onDown, true);
            window.removeEventListener('pointerup', onUp, true);
        };
    }, [closeMenu]);

    const renderContent = openMenuId ? menuContentRegistry.get(openMenuId) : undefined;

    return (
        <div id={CONTEXT_MENU_LAYER_ID} className='contextMenuLayer'>
            {openMenuId && anchorPoint && renderContent && (
                <ControlledMenu {...menuState} anchorPoint={anchorPoint} onClose={closeMenu}>
                    {renderContent(closeMenu)}
                </ControlledMenu>
            )}
        </div>
    );
}
