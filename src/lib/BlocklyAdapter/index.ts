// 此文件由 Ai 生成

import type * as BlocklyType from 'blockly';
import { shortcutManager } from '../ShortcutManager';
import { ALL_SHORTCUTS_IDS, type ShortcutIds } from '../../types/lib';
import { ALL_PLATFORMS, getPlatfrom } from '../../utils/ash-navigator';

import { dropdownWithInput } from '../../../plugins/fieldDropdown';
import { FieldAngle } from '../../../plugins/field-angle/src';
import { FieldColourHsvSliders } from '../../../plugins/field-colour-hsv-sliders/src';
import { registerScratchComment, ScratchCommentBubble } from '../../../plugins/scratch-comment';
import { installCBlockWrap } from '../../../plugins/cBlockWrap';
import { modal } from '../../components/Modal/modal';
import { AlertModal } from '../../components/modal_alert';
import { ConfirmModal } from '../../components/modal_confirm';
import { PromptModal } from '../../components/modal_prompt';
import { Toast as AshToast } from '../../lib/ToastManager';
import * as Blockly from 'blockly/core';

import { closeContextMenu, openContextMenu } from '../../gui/contextMenu';
import { AllContextMenu } from '../../types/gui';
import {
    installContextMenuPatch,
    setContextMenuHandler,
} from '../../../plugins/context-menu-patch';

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

let _blocklyMenuOptions: Blockly.ContextMenuRegistry.ContextMenuOption[] | null = null;
let _blocklyMenuEvent: Event | null = null;

export const getBlocklyMenuOptions = (): Blockly.ContextMenuRegistry.ContextMenuOption[] | null => {
    return _blocklyMenuOptions;
};
export const setBlocklyMenuOptions = (options: Blockly.ContextMenuRegistry.ContextMenuOption[]) => {
    _blocklyMenuOptions = options;
};

export const getBlocklyMenuEvent = (): Event | null => {
    return _blocklyMenuEvent;
};
export const setBlocklyMenuEvent = (options: Event) => {
    _blocklyMenuEvent = options;
};

export const collectOptions = (focusedNode: Blockly.IFocusableNode | null, e: Event) => {
    // 此函数由 Ai 生成
    let options: Blockly.ContextMenuRegistry.ContextMenuOption[] = [];

    if (focusedNode instanceof ScratchCommentBubble) {
        options = (
            focusedNode as unknown as {
                getContextMenuOptions(): Blockly.ContextMenuRegistry.ContextMenuOption[];
            }
        ).getContextMenuOptions();
    } else if (focusedNode instanceof Blockly.BlockSvg) {
        options = Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
            { block: focusedNode, focusedNode },
            e,
        );
    } else if (focusedNode instanceof Blockly.icons.Icon) {
        const block = focusedNode.getSourceBlock() as Blockly.BlockSvg;
        options = Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
            { block, focusedNode: block },
            e,
        );
    } else if (focusedNode instanceof Blockly.comments.RenderedWorkspaceComment) {
        options = Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
            { comment: focusedNode, focusedNode },
            e,
        );
    } else if (focusedNode instanceof Blockly.WorkspaceSvg) {
        options = Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
            { workspace: focusedNode, focusedNode },
            e,
        );
    }

    return options;
};

export function setupBlocklyAdapter(blockly: typeof BlocklyType): () => void {
    const registry = blockly.ShortcutRegistry.registry;
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

    // 关于注释
    try {
        // 注册注释选项（添加/删除注释右键菜单），在空白工作区也可用
        blockly.ContextMenuItems.registerCommentOptions();
        // 注册 Scratch 风格注释图标，替换 Blockly 原生 CommentIcon
        registerScratchComment(blockly);
        // 内联切换，这个不该让用户手动修改
        // todo: 确认是否需要禁用
        blockly.ContextMenuRegistry.registry.unregister('blockInline');
    } catch {
        // 不需要管
    }
    blockly.fieldRegistry.unregister('field_dropdown_with_block');
    blockly.fieldRegistry.unregister('field_angle');
    blockly.fieldRegistry.unregister('field_colour');

    installCBlockWrap(blockly);
    blockly.fieldRegistry.register('field_dropdown_with_block', dropdownWithInput);
    blockly.fieldRegistry.register('field_angle', FieldAngle);
    blockly.fieldRegistry.register('field_colour', FieldColourHsvSliders);

    // 替换 blockly 自己的modal
    blockly.dialog.setAlert((message, callback) => {
        void modal.open(AlertModal, {
            message,
            callback,
        });
    });
    blockly.dialog.setConfirm((message, callback) => {
        void modal.open(ConfirmModal, {
            message,
            callback,
        });
    });
    blockly.dialog.setPrompt((message, defaultValue, callback) => {
        void modal.open(PromptModal, {
            message,
            defaultValue,
            callback,
        });
    });

    // 拦截 Blockly 的 toast。
    // 此patch由ai制作
    const shownOnceIds = new Set<string>();
    const forwardToast = (options: Blockly.ToastOptions) => {
        if (options.oncePerSession && options.id) {
            if (shownOnceIds.has(options.id)) return;
            shownOnceIds.add(options.id);
        }
        const duration = options.duration !== undefined ? options.duration * 1000 : undefined;
        AshToast.create({
            id: options.id ?? `blockly-toast-${Date.now().toString()}`,
            type: 'info',
            text: options.message,
            duration,
        });
    };
    blockly.dialog.setToast((_workspace, options) => {
        forwardToast(options);
    });
    blockly.Toast.show = (_workspace, options) => {
        forwardToast(options);
    };
    blockly.Toast.hide = (_workspace, id) => {
        if (id) AshToast.removeToast(id);
    };

    // 此函数由 Ai 生成
    installContextMenuPatch(blockly);
    setContextMenuHandler((options, event, location) => {
        // ScratchCommentBubble 是 ASH 自定义的，不在插件覆盖范围内，单独处理
        const focusedNode = blockly.getFocusManager().getFocusedNode();
        if (focusedNode instanceof ScratchCommentBubble) {
            options = collectOptions(focusedNode, event);
        }
        setBlocklyMenuOptions(options);
        setBlocklyMenuEvent(event);
        if (options.length) {
            openContextMenu(AllContextMenu.BLOCKLY, location);
        } else {
            closeContextMenu();
        }
    });

    return () => {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
    };
}
