// 这里定义着关于界面定义的东西
// 实际上就和useState差不多

import { create, type UseBoundStore, type StoreApi } from 'zustand';
import { defaultGuiInterface, type IGuiInterface } from '../../types/gui';

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
export default useGUIStore;
