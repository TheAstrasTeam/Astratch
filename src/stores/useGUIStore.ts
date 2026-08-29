/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// GUI 界面状态管理
// 控制当前显示哪个界面（start / editor / extension / loading）
//
// [已停用] guiInterface / setInterface：界面切换现已由 Tabs（useTabsStore）驱动，
// 开始/创建项目/编辑器都作为标签页存在。以下状态保留仅作兼容与参考，不再被渲染逻辑使用。
// 而且这是扣式咯写的，扣式咯牛逼！

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
