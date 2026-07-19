import type Mousetrap from 'mousetrap';

export const ALL_SHORTCUTS_IDS = {
    NEW_PROJECT: 'project.new',
    SAVE_PROJECT: 'project.save',
    OPEN_PROJECT: 'project.open',
} as const;

export type ShortcutIds = (typeof ALL_SHORTCUTS_IDS)[keyof typeof ALL_SHORTCUTS_IDS];

export const DEFAULT_SHORTCUTS = {
    [ALL_SHORTCUTS_IDS.NEW_PROJECT]: 'mod+e',
    [ALL_SHORTCUTS_IDS.SAVE_PROJECT]: 'mod+s',
    [ALL_SHORTCUTS_IDS.OPEN_PROJECT]: 'mod+o',
} satisfies Record<ShortcutIds, string>;

export type ShortcutCommand = (
    event: Mousetrap.ExtendedKeyboardEvent,
    combo: string,
) => void | Promise<void>;

export interface IShortcutMeta {
    id: ShortcutIds;
    command: ShortcutCommand;
}

export type ICustomShortcuts = Partial<Record<ShortcutIds, string>>;

export type SetShortcutResult =
    | { ok: true }
    | { ok: false; reason: 'empty' | 'conflict'; conflictWith?: ShortcutIds };

export interface IShortcut {
    readonly shortcuts: ReadonlyMap<ShortcutIds, IShortcutMeta>;
    readonly customShortcuts: Readonly<ICustomShortcuts>;
    register: (meta: IShortcutMeta) => () => void;
    unregister: (id: ShortcutIds) => boolean;
    getHotKey: (id: ShortcutIds) => string;
    formatHotKey: (key: string) => string;
    setHotKey: (id: ShortcutIds, hotKey: string) => SetShortcutResult;
    resetHotKey: (id: ShortcutIds) => void;
}
