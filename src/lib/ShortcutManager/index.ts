// 此文件由 Ai 生成

import mousetrap from 'mousetrap';
import {
    DEFAULT_SHORTCUTS,
    type IShortcut,
    type IShortcutMeta,
    type SetShortcutResult,
    type ShortcutChangeEvent,
    type ShortcutChangeListener,
    type ShortcutIds,
} from '../../types/lib';
import { ALL_PLATFORMS, getPlatfrom } from '../../utils/ash-navigator';
import { Settings } from '../../settings/SettingsRegistry';
import { t } from 'i18next';

class ShortcutManager implements IShortcut {
    readonly shortcuts = new Map<ShortcutIds, IShortcutMeta>();
    private listeners = new Set<ShortcutChangeListener>();

    register(meta: IShortcutMeta): () => void {
        this.unregister(meta.id);
        this.shortcuts.set(meta.id, meta);
        Settings.register({
            key: meta.id,
            defaultValue: DEFAULT_SHORTCUTS[meta.id],
            category: 'shortcuts',
            type: 'key',
            label: t(`gui:shortcut.${meta.id}`),
        });
        if (Settings.get(meta.id) == null) {
            Settings.set(meta.id, DEFAULT_SHORTCUTS[meta.id]);
        }
        if (meta.scope === 'global') this.bindMousetrap(meta);

        this.emit({
            id: meta.id,
            scope: meta.scope,
            oldKey: undefined,
            newKey: this.getHotKey(meta.id),
        });

        return () => this.unregister(meta.id);
    }

    unregister(id: ShortcutIds): boolean {
        const meta = this.shortcuts.get(id);
        if (!meta) return false;

        const oldKey = this.getHotKey(id);
        if (meta.scope === 'global') mousetrap.unbind(oldKey);
        this.shortcuts.delete(id);

        this.emit({ id, scope: meta.scope, oldKey, newKey: undefined });
        return true;
    }

    getHotKey(id: ShortcutIds): string {
        const stored = Settings.get(id);
        return typeof stored === 'string' && stored ? stored : DEFAULT_SHORTCUTS[id];
    }

    getMeta(id: ShortcutIds): IShortcutMeta | undefined {
        return this.shortcuts.get(id);
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

        const meta = this.shortcuts.get(id);
        const oldKey = this.getHotKey(id);
        if (meta?.scope === 'global') mousetrap.unbind(oldKey);

        Settings.set(id, nextHotKey);

        if (meta?.scope === 'global') this.bindMousetrap(meta);
        if (meta) this.emit({ id, scope: meta.scope, oldKey, newKey: nextHotKey });
        return { ok: true };
    }

    resetHotKey(id: ShortcutIds): void {
        if (this.getHotKey(id) === DEFAULT_SHORTCUTS[id]) return;

        const meta = this.shortcuts.get(id);
        const oldKey = this.getHotKey(id);
        if (meta?.scope === 'global') mousetrap.unbind(oldKey);

        Settings.reset(id);

        if (meta?.scope === 'global') this.bindMousetrap(meta);
        if (meta) this.emit({ id, scope: meta.scope, oldKey, newKey: this.getHotKey(id) });
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

    private bindMousetrap(meta: IShortcutMeta): void {
        const hotKey = this.getHotKey(meta.id);
        const command = meta.command;
        if (!command) return;
        mousetrap.bind(hotKey, (event, combo) => {
            event.preventDefault();
            void Promise.resolve(command(event, combo)).catch((error: unknown) => {
                console.error(`Shortcut command failed: ${meta.id}`, error);
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
