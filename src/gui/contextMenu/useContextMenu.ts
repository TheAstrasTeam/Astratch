import { useEffect } from 'react';
import type { TAllContextMenu } from '../../types/gui';
import useContextMenuStore from '../../stores/useContextMenuStore';
import type { ContextMenuAnchorPoint } from '../../stores/useContextMenuStore';
import { menuContentRegistry } from './menuRegistry';
import type { MenuContentRenderer } from './menuRegistry';

export function useContextMenu(id: TAllContextMenu, renderMenu: MenuContentRenderer) {
    const openMenu = useContextMenuStore(state => state.openMenu);
    const closeMenu = useContextMenuStore(state => state.closeMenu);

    useEffect(() => {
        menuContentRegistry.set(id, renderMenu);
        return () => {
            menuContentRegistry.delete(id);
        };
    }, [id, renderMenu]);

    const handleOpen = (point: ContextMenuAnchorPoint) => {
        openMenu(id, point);
    };

    return {
        openMenu: handleOpen,
        closeMenu,
    } as const;
}
