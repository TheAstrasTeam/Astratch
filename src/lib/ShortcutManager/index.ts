import mousetrap from 'mousetrap';
import {
    ALL_SHORTCUTS_IDS,
    DEFAULT_SHORTCUTS,
    type ICustomShortcuts,
    type IShortcut,
    type IShortcutMeta,
    type SetShortcutResult,
    type ShortcutIds,
} from '../../types/lib';
import { localStorageIDs } from '../../types/storage';
import { readLocalStorage, setItemToLocalStorage } from '../../utils/localstorage';
import { ALL_PLATFORMS, getPlatfrom } from '../../utils/ash-navigator';

const shortcutIds = Object.values(ALL_SHORTCUTS_IDS) as ShortcutIds[];

class ShortcutManager implements IShortcut {
    readonly shortcuts = new Map<ShortcutIds, IShortcutMeta>();
    customShortcuts: ICustomShortcuts = {};

    constructor() {
        this.loadCustomShortcuts();
    }

    register(meta: IShortcutMeta): () => void {
        this.unregister(meta.id);
        this.shortcuts.set(meta.id, meta);
        this.bind(meta);

        return () => this.unregister(meta.id);
    }

    unregister(id: ShortcutIds): boolean {
        const meta = this.shortcuts.get(id);
        if (!meta) return false;

        mousetrap.unbind(this.getHotKey(id));
        this.shortcuts.delete(id);
        return true;
    }

    getHotKey(id: ShortcutIds): string {
        return this.customShortcuts[id] ?? DEFAULT_SHORTCUTS[id];
    }

    formatHotKey(key: string): string {
        switch(getPlatfrom()) {
            case ALL_PLATFORMS.WIN:
            case ALL_PLATFORMS.LINUX:
                return key.replaceAll('mod', 'ctrl')
            case ALL_PLATFORMS.MAC:
                return key.replaceAll('mod', '⌘');
            default:
                return key
        }
    }

    setHotKey(id: ShortcutIds, hotKey: string): SetShortcutResult {
        const nextHotKey = hotKey.trim().toLowerCase();
        if (!nextHotKey) return { ok: false, reason: 'empty' };

        const conflictWith = this.findConflict(id, nextHotKey);
        if (conflictWith) return { ok: false, reason: 'conflict', conflictWith };

        const meta = this.shortcuts.get(id);
        if (meta) mousetrap.unbind(this.getHotKey(id));

        if (nextHotKey === DEFAULT_SHORTCUTS[id]) {
            this.removeCustomHotKey(id);
        } else {
            this.customShortcuts[id] = nextHotKey;
        }
        this.saveCustomShortcuts();

        if (meta) this.bind(meta);
        return { ok: true };
    }

    resetHotKey(id: ShortcutIds): void {
        if (!Object.hasOwn(this.customShortcuts, id)) return;

        const meta = this.shortcuts.get(id);
        if (meta) mousetrap.unbind(this.getHotKey(id));

        this.removeCustomHotKey(id);
        this.saveCustomShortcuts();

        if (meta) this.bind(meta);
    }

    private bind(meta: IShortcutMeta): void {
        const hotKey = this.getHotKey(meta.id);
        mousetrap.bind(hotKey, (event, combo) => {
            event.preventDefault();
            void Promise.resolve(meta.command(event, combo)).catch((error: unknown) => {
                console.error(`Shortcut command failed: ${meta.id}`, error);
            });
        });
    }

    private findConflict(id: ShortcutIds, hotKey: string): ShortcutIds | null {
        const normalizedHotKey = normalizeHotKey(hotKey);
        return (
            shortcutIds.find(
                candidateId =>
                    candidateId !== id &&
                    normalizeHotKey(this.getHotKey(candidateId)) === normalizedHotKey,
            ) ?? null
        );
    }

    private loadCustomShortcuts(): void {
        const stored = readLocalStorage(localStorageIDs.Shortcuts);
        if (!isCustomShortcuts(stored)) return;

        for (const id of shortcutIds) {
            const hotKey = stored[id];
            if (typeof hotKey === 'string' && hotKey.trim()) {
                this.customShortcuts[id] = hotKey;
            }
        }
    }

    private saveCustomShortcuts(): void {
        setItemToLocalStorage(localStorageIDs.Shortcuts, this.customShortcuts);
    }

    private removeCustomHotKey(id: ShortcutIds): void {
        this.customShortcuts = Object.fromEntries(
            Object.entries(this.customShortcuts).filter(([storedId]) => storedId !== id),
        );
    }
}

function normalizeHotKey(hotKey: string): string {
    return hotKey.toLowerCase().replaceAll(' ', '');
}

function isCustomShortcuts(value: unknown): value is ICustomShortcuts {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const shortcutManager = new ShortcutManager();
export const shortCut = shortcutManager;
