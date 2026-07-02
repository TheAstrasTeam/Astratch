// GUI 界面状态管理
// 控制当前显示哪个界面（start / editor / extension / loading）

import { create, type UseBoundStore, type StoreApi } from 'zustand';
import { defaultGuiInterface, type IGuiInterface } from '../types/gui';

const useGUIStore: UseBoundStore<
    StoreApi<{
        guiInterface: IGuiInterface;
        setInterface: (guiInterface: IGuiInterface) => void;
    }>
> = create(set => ({
    guiInterface: defaultGuiInterface,
    setInterface: (guiInterface: IGuiInterface) => {
        set({ guiInterface });
    },
}));
const useLoadingStore: UseBoundStore<
    StoreApi<{
        loading: boolean;
        setLoading: (loading: boolean) => void;
    }>
> = create(set => ({
    loading: false,
    setLoading: (loading: boolean) => {
        set({ loading });
    },
}));
export { useGUIStore, useLoadingStore };
