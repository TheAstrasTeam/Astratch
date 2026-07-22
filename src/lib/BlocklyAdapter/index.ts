// 此文件由 Ai 生成

import type * as BlocklyType from 'blockly';
import { shortcutManager } from '../ShortcutManager';
import { ALL_SHORTCUTS_IDS, type ShortcutIds } from '../../types/lib';
import { ALL_PLATFORMS, getPlatfrom } from '../../utils/ash-navigator';

// 仅列出 blockly 作用域的 id → Blockly ShortcutRegistry name 映射
const ID_TO_NAME: Partial<Record<ShortcutIds, string>> = {
    [ALL_SHORTCUTS_IDS.BLOCKLY_COPY]: 'copy',
    [ALL_SHORTCUTS_IDS.BLOCKLY_CUT]: 'cut',
    [ALL_SHORTCUTS_IDS.BLOCKLY_PASTE]: 'paste',
    [ALL_SHORTCUTS_IDS.BLOCKLY_UNDO]: 'undo',
    [ALL_SHORTCUTS_IDS.BLOCKLY_REDO]: 'redo',
    [ALL_SHORTCUTS_IDS.BLOCKLY_DUPLICATE]: 'duplicate',
    [ALL_SHORTCUTS_IDS.BLOCKLY_CLEANUP]: 'cleanup',
    [ALL_SHORTCUTS_IDS.BLOCKLY_DISCONNECT]: 'disconnect',
};

const IS_MAC = getPlatfrom() === ALL_PLATFORMS.MAC;

// mousetrap 修饰键名 → Blockly modifierKeys 枚举名
const MOD_TO_NAME: Record<string, string> = {
    mod: IS_MAC ? 'Meta' : 'Control',
    ctrl: 'Control',
    meta: 'Meta',
    alt: 'Alt',
    shift: 'Shift',
};

// Blockly createSerializedKey 按此顺序拼接修饰键
const MOD_ORDER = ['Shift', 'Control', 'Alt', 'Meta'];

const SPECIAL_KEYS: Partial<Record<string, number>> = {
    escape: 27,
    esc: 27,
    enter: 13,
    return: 13,
    space: 32,
    backspace: 8,
    tab: 9,
    delete: 46,
    del: 46,
    insert: 45,
    home: 36,
    end: 35,
    pageup: 33,
    pagedown: 34,
    arrowup: 38,
    up: 38,
    arrowdown: 40,
    down: 40,
    arrowleft: 37,
    left: 37,
    arrowright: 39,
    right: 39,
};

function mainKeyToKeyCode(key: string): number {
    if (key.length === 1) {
        if (key >= 'a' && key <= 'z') return key.charCodeAt(0) - 32;
        if (key >= '0' && key <= '9') return key.charCodeAt(0);
    }
    if (/^f([1-9]|1[0-2])$/.test(key)) return 112 + parseInt(key.slice(1), 10) - 1;
    const code = SPECIAL_KEYS[key];
    if (code !== undefined) return code;
    throw new Error(`[BlocklyAdapter] Unknown key: ${key}`);
}

// 把 mousetrap 格式 (mod+c / shift+x) 转成 Blockly 序列化键 ("Control+67" / "Shift+88")
function mousetrapToBlocklyKey(combo: string): string {
    const parts = combo.split('+');
    const mainKey = parts[parts.length - 1];
    const keyCode = mainKeyToKeyCode(mainKey);
    const mods = new Set<string>();
    for (const p of parts.slice(0, -1)) {
        const name = MOD_TO_NAME[p];
        if (name) mods.add(name);
    }
    const orderedMods = MOD_ORDER.filter(m => mods.has(m));
    return orderedMods.length ? `${orderedMods.join('+')}+${String(keyCode)}` : String(keyCode);
}

/**
 * 设置 Blockly 快捷键适配器：订阅 ShortcutManager 事件，
 * 将 blockly 作用域的快捷键同步到 Blockly ShortcutRegistry 的键映射。
 *
 * @param Blockly Blockly 模块实例
 * @returns 清理函数（取消订阅）
 */
export function setupBlocklyAdapter(Blockly: typeof BlocklyType): () => void {
    const registry = Blockly.ShortcutRegistry.registry;
    let unsubscribe: (() => void) | null = null;

    function sync(id: ShortcutIds, newKey: string | undefined): void {
        const name = ID_TO_NAME[id];
        if (!name) return;
        registry.removeAllKeyMappings(name);
        if (newKey !== undefined) {
            try {
                registry.addKeyMapping(mousetrapToBlocklyKey(newKey), name, false);
            } catch (error: unknown) {
                console.warn(`[BlocklyAdapter] Failed to bind "${id}" to "${newKey}":`, error);
            }
        }
    }

    unsubscribe = shortcutManager.onChange(event => {
        if (event.scope !== 'blockly') return;
        sync(event.id, event.newKey);
    });

    return () => {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
    };
}
