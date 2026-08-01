import type { ReactNode } from 'react';
import type { TAllContextMenu } from '../../types/gui';

export type MenuContentRenderer = (closeMenu: () => void) => ReactNode;

export const menuContentRegistry = new Map<TAllContextMenu, MenuContentRenderer>();

export function registerContextMenu(id: TAllContextMenu, renderer: MenuContentRenderer) {
    menuContentRegistry.set(id, renderer);
}

export function unregisterContextMenu(id: TAllContextMenu) {
    menuContentRegistry.delete(id);
}
