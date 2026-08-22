// 此文件由AI生成：模态框父子关系、阻塞模式与关闭传播

import { create, type UseBoundStore, type StoreApi } from 'zustand';

interface IModalRelationshipStore {
    parentChild: Record<string, string[]>;
    closeFunctions: Partial<Record<string, () => Promise<void>>>;
    blockingChildren: Partial<Record<string, boolean>>;
    shakeMap: Partial<Record<string, boolean>>;

    registerChild: (parentID: string, childID: string) => void;
    unregisterChild: (childID: string) => void;
    registerCloseFunction: (windowID: string, fn: () => Promise<void>) => void;
    unregisterCloseFunction: (windowID: string) => void;
    setBlocking: (windowID: string, blocking: boolean) => void;
    clearBlocking: (windowID: string) => void;
    closeChildren: (parentID: string) => void;
    triggerShake: (windowID: string) => void;
    getBlockingChildren: (parentID: string) => string[];
}

const useModalRelationshipStore: UseBoundStore<StoreApi<IModalRelationshipStore>> =
    create<IModalRelationshipStore>((set, get) => ({
        parentChild: {},
        closeFunctions: {},
        blockingChildren: {},
        shakeMap: {},

        registerChild: (parentID, childID) => {
            const { parentChild } = get();
            const existing = parentChild[parentID] ?? [];
            set({ parentChild: { ...parentChild, [parentID]: [...existing, childID] } });
        },
        unregisterChild: childID => {
            const { parentChild } = get();
            const next: Record<string, string[]> = {};
            for (const [pid, children] of Object.entries(parentChild)) {
                const filtered = children.filter(c => c !== childID);
                if (filtered.length > 0) next[pid] = filtered;
            }
            set({ parentChild: next });
        },
        registerCloseFunction: (windowID, fn) => {
            set(state => ({
                closeFunctions: { ...state.closeFunctions, [windowID]: fn },
            }));
        },
        unregisterCloseFunction: windowID => {
            set(state => {
                const { [windowID]: _, ...rest } = state.closeFunctions;
                return { closeFunctions: rest };
            });
        },
        setBlocking: (windowID, blocking) => {
            set(state => ({
                blockingChildren: { ...state.blockingChildren, [windowID]: blocking },
            }));
        },
        clearBlocking: windowID => {
            set(state => {
                const { [windowID]: _, ...rest } = state.blockingChildren;
                return { blockingChildren: rest };
            });
        },
        closeChildren: parentID => {
            const { parentChild, closeFunctions } = get();
            const children = parentChild[parentID] ?? [];
            for (const childID of children) {
                void closeFunctions[childID]?.();
            }
        },
        triggerShake: windowID => {
            const { shakeMap } = get();
            set({ shakeMap: { ...shakeMap, [windowID]: true } });
            setTimeout(() => {
                const { shakeMap } = get();
                const { [windowID]: _, ...rest } = shakeMap;
                set({ shakeMap: rest });
            }, 500);
        },
        getBlockingChildren: parentID => {
            const { parentChild, blockingChildren } = get();
            const children = parentChild[parentID] ?? [];
            return children.filter(c => blockingChildren[c]);
        },
    }));

export { useModalRelationshipStore };
