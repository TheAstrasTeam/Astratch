import type { ReactNode } from 'react';
import { create, type StoreApi, type UseBoundStore } from 'zustand';

export interface IModalInfo {
    renderer: () => ReactNode;
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    canFullscreen: boolean;
    zIndex: number;
    canMove: boolean;
    canResize: boolean;
}

interface IModalSubmitInfo {
    renderer: () => ReactNode;
    id?: string;
    x?: number;
    y?: number;
    width: number;
    height: number;
    name: string;
    canFullscreen?: boolean;
    zIndex?: number;
    canMove?: boolean;
    canResize?: boolean;
}

interface IUseModal {
    modalStorage: Map<string, IModalInfo>;
    addModal(modalSubmitInfo: IModalSubmitInfo): string;
    deleteModal(id: string): boolean;
    getModal(id: string): IModalInfo | undefined;
    setModalSize(id: string, newWidth: number, newHeight: number): void;
    setModalPos(id: string, newX: number, newY: number): void;
    getMaxZIndex(): number;
    setModalZIndex(id: string, newZIndex: number): void;
    /** 把 modal 提到最上层，已在最上层时不做任何事 */
    bringToFront(id: string): void;
}

export const useModal: UseBoundStore<StoreApi<IUseModal>> = create((set, get) => ({
    modalStorage: new Map(),
    addModal: (modalSubmitInfo: IModalSubmitInfo): string => {
        const id = modalSubmitInfo.id ?? crypto.randomUUID();
        const modalInfo = {
            ...modalSubmitInfo,
            x: modalSubmitInfo.x ?? 0.5,
            y: modalSubmitInfo.y ?? 0.5,
            width: Math.max(modalSubmitInfo.width, 250),
            height: Math.max(modalSubmitInfo.height, 300),
            id,
            canFullscreen: modalSubmitInfo.canFullscreen ?? true,
            zIndex: modalSubmitInfo.zIndex ?? get().getMaxZIndex() + 1,
            canMove: modalSubmitInfo.canMove ?? true,
            canResize: modalSubmitInfo.canResize ?? true,
        } satisfies IModalInfo;
        set(state => ({
            modalStorage: new Map(state.modalStorage).set(id, modalInfo),
        }));
        return id;
    },
    deleteModal(id) {
        const exists = get().modalStorage.has(id);
        if (!exists) return false;
        set(state => {
            const modalStorage = new Map(state.modalStorage);
            modalStorage.delete(id);
            return { modalStorage };
        });
        return true;
    },
    getModal(id) {
        return get().modalStorage.get(id);
    },
    setModalSize(id, newWidth, newHeight) {
        const exists = get().modalStorage.has(id);
        if (!exists) return;
        set(state => {
            const modalStorage = new Map(state.modalStorage);
            const modal = modalStorage.get(id)!;
            modal.width = newWidth;
            modal.height = newHeight;
            modalStorage.set(id, modal);
            return { modalStorage };
        });
    },
    setModalPos(id, newX, newY) {
        const exists = get().modalStorage.has(id);
        if (!exists) return;
        set(state => {
            const modalStorage = new Map(state.modalStorage);
            const modal = modalStorage.get(id)!;
            modal.x = newX;
            modal.y = newY;
            modalStorage.set(id, modal);
            return { modalStorage };
        });
    },
    getMaxZIndex() {
        let max = 0;
        for (const modal of get().modalStorage.values()) {
            if (modal.zIndex > max) max = modal.zIndex;
        }
        return max;
    },
    setModalZIndex(id, newZIndex) {
        const exists = get().modalStorage.has(id);
        if (!exists) return;
        set(state => {
            const modalStorage = new Map(state.modalStorage);
            const modal = modalStorage.get(id)!;
            modal.zIndex = newZIndex;
            modalStorage.set(id, modal);
            return { modalStorage };
        });
    },
    bringToFront(id) {
        const modal = get().modalStorage.get(id);
        if (!modal) return;
        const maxZIndex = get().getMaxZIndex();
        // 已经在最上层
        if (modal.zIndex === maxZIndex) return;
        get().setModalZIndex(id, maxZIndex + 1);
    },
}));
