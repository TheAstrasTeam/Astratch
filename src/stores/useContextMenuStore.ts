import { create, type UseBoundStore, type StoreApi } from 'zustand';
import type { TAllContextMenu } from '../types/gui';

export interface ContextMenuAnchorPoint {
    x: number;
    y: number;
}

interface ContextMenuState {
    openMenuId: TAllContextMenu | null;
    anchorPoint: ContextMenuAnchorPoint | null;
    openMenu: (id: TAllContextMenu, point: ContextMenuAnchorPoint) => void;
    closeMenu: () => void;
}

const useContextMenuStore: UseBoundStore<StoreApi<ContextMenuState>> = create(set => ({
    openMenuId: null,
    anchorPoint: null,
    openMenu: (id: TAllContextMenu, point: ContextMenuAnchorPoint) => {
        set({ openMenuId: id, anchorPoint: point });
    },
    closeMenu: () => {
        set({ openMenuId: null, anchorPoint: null });
    },
}));

export default useContextMenuStore;

export const openContextMenu = (id: TAllContextMenu, point: ContextMenuAnchorPoint) => {
    useContextMenuStore.getState().openMenu(id, point);
};

export const closeContextMenu = () => {
    useContextMenuStore.getState().closeMenu();
};
