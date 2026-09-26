import { create, type StoreApi, type UseBoundStore } from 'zustand';

interface IUseQuickOpen {
    isOpenQuickOpen: boolean;
    openQuickOpen: () => void;
    closeQuickOpen: () => void;
}

export const useQuickOpen: UseBoundStore<StoreApi<IUseQuickOpen>> = create(set => ({
    isOpenQuickOpen: false,
    openQuickOpen: () => {
        set(() => ({ isOpenQuickOpen: true }));
    },
    closeQuickOpen: () => {
        set(() => ({
            isOpenQuickOpen: false,
        }));
    },
}));
