import { create, type StoreApi, type UseBoundStore } from 'zustand';

export type QuickOpenPhase = 'closed' | 'open' | 'closing';

interface IUseQuickOpen {
    isOpenQuickOpen: boolean;
    phase: QuickOpenPhase;
    openQuickOpen: () => void;
    closeQuickOpen: () => void;
    /** 淡出动画播完后调用，把面板彻底卸载 */
    finishCloseQuickOpen: () => void;
}

export const useQuickOpen: UseBoundStore<StoreApi<IUseQuickOpen>> = create(set => ({
    isOpenQuickOpen: false,
    phase: 'closed',
    openQuickOpen: () => {
        set(() => ({ isOpenQuickOpen: true, phase: 'open' }));
    },
    closeQuickOpen: () => {
        // 只有真正“开着”才进入淡出，避免重复 close 把状态机推乱
        set(state => (state.phase === 'open' ? { isOpenQuickOpen: false, phase: 'closing' } : {}));
    },
    finishCloseQuickOpen: () => {
        set(state => (state.phase === 'closing' ? { phase: 'closed' } : {}));
    },
}));
