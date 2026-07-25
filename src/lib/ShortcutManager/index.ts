/**
 * 由 AstrasTeam 重构于 2026/7/25：
 * - 使用统一快捷键声明生成设置项和默认键位
 * - 将运行时命令绑定与快捷键定义分离
 * - 让全局快捷键和 Blockly 快捷键共享冲突检测与变更通知
 */

import mousetrap from 'mousetrap';
import {
    type IShortcut,
    type ResolvedShortcutDefinition,
    type SetShortcutResult,
    type ShortcutChangeEvent,
    type ShortcutChangeListener,
    type ShortcutCommand,
    type ShortcutCommands,
    type ShortcutIds,
    SHORTCUTS,
} from '../../types/lib';
import { ALL_PLATFORMS, getPlatfrom } from '../../utils/ash-navigator';
import { Settings } from '../../settings/SettingsRegistry';

class ShortcutManager implements IShortcut {
    readonly shortcuts = new Map<ShortcutIds, ResolvedShortcutDefinition>(
        Object.values(SHORTCUTS).map(definition => [
            definition.id,
            definition as ResolvedShortcutDefinition,
        ]),
    );
    private commands = new Map<ShortcutIds, ShortcutCommand>();
    private listeners = new Set<ShortcutChangeListener>();

    /** 在 Settings 构建前，一次性注册所有快捷键设置。 */
    registerSettings(): void {
        for (const definition of this.shortcuts.values()) {
            Settings.register({
                key: definition.id,
                defaultValue: definition.defaultKey,
                category: 'shortcuts',
                type: 'key',
                label: `gui:shortcut.${definition.id}`,
            });
        }
    }

    /** 绑定依赖运行时对象的全局快捷键命令，并返回统一清理函数。 */
    bindCommands(commands: ShortcutCommands): () => void {
        const bindings: [ShortcutIds, ShortcutCommand][] = [];

        for (const [rawId, command] of Object.entries(commands)) {
            const id = rawId as ShortcutIds;
            const definition = this.getDefinition(id);
            if (definition.scope !== 'global') {
                throw new Error(`Shortcut "${id}" is not a global shortcut.`);
            }

            const previousCommand = this.commands.get(id);
            if (previousCommand) mousetrap.unbind(this.getHotKey(id));
            this.commands.set(id, command);
            this.bindMousetrap(id);
            bindings.push([id, command]);
        }

        return () => {
            for (const [id, command] of bindings) {
                if (this.commands.get(id) !== command) continue;
                mousetrap.unbind(this.getHotKey(id));
                this.commands.delete(id);
            }
        };
    }

    getDefinition(id: ShortcutIds): ResolvedShortcutDefinition {
        const definition = this.shortcuts.get(id);
        if (!definition) throw new Error(`Unknown shortcut: ${id}`);
        return definition;
    }

    getDefinitions(): readonly ResolvedShortcutDefinition[] {
        return [...this.shortcuts.values()];
    }

    getDefaultHotKey(id: ShortcutIds): string {
        return this.getDefinition(id).defaultKey;
    }

    getHotKey(id: ShortcutIds): string {
        const stored = Settings.get(id);
        return typeof stored === 'string' && stored ? stored : this.getDefaultHotKey(id);
    }

    formatHotKey(key: string): string {
        switch (getPlatfrom()) {
            case ALL_PLATFORMS.WIN:
            case ALL_PLATFORMS.LINUX:
                return key.replaceAll('mod', 'ctrl');
            case ALL_PLATFORMS.MAC:
                return key.replaceAll('mod', '⌘');
            default:
                return key;
        }
    }

    setHotKey(id: ShortcutIds, hotKey: string): SetShortcutResult {
        const nextHotKey = hotKey.trim().toLowerCase();
        if (!nextHotKey) return { ok: false, reason: 'empty' };

        const conflictWith = this.findConflict(id, nextHotKey);
        if (conflictWith) return { ok: false, reason: 'conflict', conflictWith };

        const definition = this.getDefinition(id);
        const oldKey = this.getHotKey(id);
        if (definition.scope === 'global') mousetrap.unbind(oldKey);

        Settings.set(id, nextHotKey);

        if (definition.scope === 'global') this.bindMousetrap(id);
        this.emit({ id, scope: definition.scope, oldKey, newKey: nextHotKey });
        return { ok: true };
    }

    resetHotKey(id: ShortcutIds): void {
        if (this.getHotKey(id) === this.getDefaultHotKey(id)) return;

        const definition = this.getDefinition(id);
        const oldKey = this.getHotKey(id);
        if (definition.scope === 'global') mousetrap.unbind(oldKey);

        Settings.reset(id);

        if (definition.scope === 'global') this.bindMousetrap(id);
        this.emit({ id, scope: definition.scope, oldKey, newKey: this.getHotKey(id) });
    }

    onChange(listener: ShortcutChangeListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private emit(event: ShortcutChangeEvent): void {
        for (const listener of this.listeners) listener(event);
    }

    private bindMousetrap(id: ShortcutIds): void {
        const hotKey = this.getHotKey(id);
        const command = this.commands.get(id);
        if (!command) return;
        mousetrap.bind(hotKey, (event, combo) => {
            event.preventDefault();
            void Promise.resolve(command(event, combo)).catch((error: unknown) => {
                console.error(`Shortcut command failed: ${id}`, error);
            });
        });
    }

    private findConflict(id: ShortcutIds, hotKey: string): ShortcutIds | null {
        const normalizedHotKey = normalizeHotKey(hotKey);
        for (const candidateId of this.shortcuts.keys()) {
            if (candidateId === id) continue;
            if (normalizeHotKey(this.getHotKey(candidateId)) === normalizedHotKey) {
                return candidateId;
            }
        }
        return null;
    }
}

function normalizeHotKey(hotKey: string): string {
    return hotKey.toLowerCase().replaceAll(' ', '');
}

export const shortcutManager = new ShortcutManager();
export const shortCut = shortcutManager;
