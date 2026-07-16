import { useEffect } from 'react';
import { ControlledMenu, useMenuState } from '@szhsin/react-menu';
import useContextMenuStore from '../../stores/useContextMenuStore';
import { menuContentRegistry } from './menuRegistry';
import './contextMenuLayer.scss';

export const CONTEXT_MENU_LAYER_ID = 'ash-context-menu-layer';

export function ContextMenuLayer() {
    const openMenuId = useContextMenuStore(state => state.openMenuId);
    const anchorPoint = useContextMenuStore(state => state.anchorPoint);
    const closeMenu = useContextMenuStore(state => state.closeMenu);

    const [menuState, toggleMenu] = useMenuState({ transition: true });

    useEffect(() => {
        if (openMenuId) {
            toggleMenu(true);
        } else {
            toggleMenu(false);
        }
    }, [openMenuId, toggleMenu]);

    const renderContent =
        openMenuId ? menuContentRegistry.get(openMenuId) : undefined;

    return (
        <div id={CONTEXT_MENU_LAYER_ID} className="contextMenuLayer">
            {openMenuId && anchorPoint && renderContent && (
                <ControlledMenu
                    {...menuState}
                    anchorPoint={anchorPoint}
                    onClose={closeMenu}
                >
                    {renderContent(closeMenu)}
                </ControlledMenu>
            )}
        </div>
    );
}
