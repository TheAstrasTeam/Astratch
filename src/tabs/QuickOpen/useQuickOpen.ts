/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// QuickOpen 面板的键盘控制器（纯搜索面板）。
// 仅负责 mod+p 打开 / Esc 关闭 / 窗口失焦关闭。
// “按住修饰键循环、松开后才提交”的 Ctrl+Tab 语义由独立的 useTabSwitcher 处理。
// 组合键每次按键时从 shortcutManager 读取，用户在设置里改键后立即生效。

import { useEffect } from 'react';
import { shortcutManager } from '../../lib/ShortcutManager';
import { SHORTCUTS } from '../../types/lib';
import { ALL_PLATFORMS, getPlatfrom } from '../../utils/ash-navigator';
import { useQuickOpenStore } from '../../stores/useQuickOpenStore';

interface IParsedCombo {
    key: string;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
}

// 解析 mousetrap 风格的组合键字符串；要求至少一个修饰键，解析失败返回 null
const parseCombo = (hotKey: string): IParsedCombo | null => {
    const parts = hotKey
        .trim()
        .toLowerCase()
        .split('+')
        .map(part => part.trim())
        .filter(part => part.length > 0);
    if (parts.length < 2) return null;

    const key = parts[parts.length - 1];
    let ctrl = false;
    let shift = false;
    let alt = false;
    let meta = false;
    for (const part of parts.slice(0, -1)) {
        switch (part) {
            case 'mod':
                if (getPlatfrom() === ALL_PLATFORMS.MAC) meta = true;
                else ctrl = true;
                break;
            case 'ctrl':
            case 'control':
                ctrl = true;
                break;
            case 'shift':
                shift = true;
                break;
            case 'alt':
            case 'option':
                alt = true;
                break;
            case 'meta':
            case 'cmd':
            case 'command':
                meta = true;
                break;
            default:
                return null;
        }
    }
    return { key, ctrl, shift, alt, meta };
};

const matchesCombo = (event: KeyboardEvent, combo: IParsedCombo): boolean =>
    event.key.toLowerCase() === combo.key &&
    event.ctrlKey === combo.ctrl &&
    event.metaKey === combo.meta &&
    event.shiftKey === combo.shift &&
    event.altKey === combo.alt;

export function useQuickOpen(): void {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const store = useQuickOpenStore.getState();

            // Esc：面板打开时关闭
            if (event.key === 'Escape') {
                if (store.isOpen) {
                    event.preventDefault();
                    event.stopPropagation();
                    store.close();
                }
                return;
            }

            // mod+p：打开面板
            const combo = parseCombo(shortcutManager.getHotKey(SHORTCUTS.QUICK_OPEN.id));
            if (combo && matchesCombo(event, combo)) {
                event.preventDefault();
                event.stopPropagation();
                store.open();
            }
        };

        const handleBlur = () => {
            if (useQuickOpenStore.getState().isOpen) {
                useQuickOpenStore.getState().close();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('blur', handleBlur, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('blur', handleBlur, true);
            useQuickOpenStore.getState().close();
        };
    }, []);
}
