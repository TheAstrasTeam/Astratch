/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI修改

// QuickOpen 命令注册表：保存插件（addon）动态注册的命令。
// 内置命令是静态列表，不经过本 store（见 tabs/QuickOpen/builtins.ts）。
// 每条命令带 owner（插件 ID），插件禁用/卸载时按 owner 批量注销，
// 即使插件忘记在清理函数中注销也不会泄漏。

import { create, type UseBoundStore, type StoreApi } from 'zustand';
import type { IQuickOpenCommand } from '../types/gui';

interface ICommandRecord {
    owner: string;
    command: IQuickOpenCommand;
}

interface IQuickOpenCommandsStore {
    /** 插件命令：完整 ID → 记录 */
    commands: Map<string, ICommandRecord>;
}

interface IQuickOpenCommandsActions {
    /**
     * 注册一条命令
     * @param owner 归属标识（一般为插件 ID），用于批量注销
     * @param command 完整 ID 的命令定义；ID 重复时覆盖旧命令
     * @returns 注销函数
     */
    registerCommand: (owner: string, command: IQuickOpenCommand) => () => void;
    /** 按 ID 注销单条命令 */
    unregisterCommand: (id: string) => void;
    /** 注销某个归属方注册的全部命令 */
    unregisterByOwner: (owner: string) => void;
}

const useQuickOpenCommandsStore: UseBoundStore<
    StoreApi<IQuickOpenCommandsStore & IQuickOpenCommandsActions>
> = create<IQuickOpenCommandsStore & IQuickOpenCommandsActions>((set, get) => ({
    commands: new Map<string, ICommandRecord>(),
    registerCommand: (owner, command) => {
        set(state => {
            const next = new Map(state.commands);
            next.set(command.id, { owner, command });
            return { commands: next };
        });
        return () => {
            get().unregisterCommand(command.id);
        };
    },
    unregisterCommand: id => {
        set(state => {
            if (!state.commands.has(id)) return state;
            const next = new Map(state.commands);
            next.delete(id);
            return { commands: next };
        });
    },
    unregisterByOwner: owner => {
        set(state => {
            const next = new Map(state.commands);
            let changed = false;
            for (const [id, record] of next) {
                if (record.owner === owner) {
                    next.delete(id);
                    changed = true;
                }
            }
            return changed ? { commands: next } : state;
        });
    },
}));

export { useQuickOpenCommandsStore };
