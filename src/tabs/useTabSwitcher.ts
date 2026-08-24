/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// VSCode 式 Ctrl+Tab 标签快速切换的键盘控制器。
// mousetrap 无法表达“按住修饰键循环、松开后才提交”的语义，
// 因此这里用原生 keydown/keyup（capture 阶段）自行匹配组合键：
// - 按下组合键：按 MRU 快照打开浮层，正向高亮第 2 位、反向高亮队尾
// - 按住期间再按 Tab（或再次命中组合键）：按当前 Shift 状态循环推进
// - 松开起始修饰键：提交选中项；Esc / 窗口失焦：取消
// 组合键每次按键时从 shortcutManager 读取，用户在设置里改键后立即生效。

import { useEffect } from 'react';
import { shortcutManager } from '../lib/ShortcutManager';
import { SHORTCUTS } from '../types/lib';
import { ALL_PLATFORMS, getPlatfrom } from '../utils/ash-navigator';
import { useTabsStore } from '../stores/useTabsStore';
import { useTabSwitcherStore } from '../stores/useTabSwitcherStore';

interface IParsedCombo {
    /** 主键名（小写），如 'tab' */
    key: string;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
    /** 起始修饰键（按 meta > ctrl > alt > shift 取第一个）：松开它即提交会话 */
    primaryMod: 'ctrl' | 'meta' | 'alt' | 'shift';
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
    const primaryMod = ((): IParsedCombo['primaryMod'] => {
        if (meta) return 'meta';
        if (ctrl) return 'ctrl';
        if (alt) return 'alt';
        return 'shift';
    })();
    return { key, ctrl, shift, alt, meta, primaryMod };
};

const matchesCombo = (event: KeyboardEvent, combo: IParsedCombo): boolean =>
    event.key.toLowerCase() === combo.key &&
    event.ctrlKey === combo.ctrl &&
    event.metaKey === combo.meta &&
    event.shiftKey === combo.shift &&
    event.altKey === combo.alt;

// 会话进行中判断“起始组合键的修饰键是否仍被按住”。
// shift 不参与判断：按住期间 Shift 的按下/松开用于动态反向（与 VSCode 一致）。
const isChordHeld = (event: KeyboardEvent, combo: IParsedCombo): boolean =>
    (!combo.ctrl || event.ctrlKey) &&
    (!combo.meta || event.metaKey) &&
    (!combo.alt || event.altKey);

// 各主修饰键对应的 keyup key
const PRIMARY_MOD_KEYUP: Record<IParsedCombo['primaryMod'], string> = {
    ctrl: 'Control',
    meta: 'Meta',
    alt: 'Alt',
    shift: 'Shift',
};

export function useTabSwitcher(): void {
    useEffect(() => {
        // 当前会话的起始组合键；null 表示没有进行中的会话
        let sessionCombo: IParsedCombo | null = null;

        const getCombos = (): { next: IParsedCombo | null; prev: IParsedCombo | null } => ({
            next: parseCombo(shortcutManager.getHotKey(SHORTCUTS.QUICK_OPEN_NEXT_TAB.id)),
            prev: parseCombo(shortcutManager.getHotKey(SHORTCUTS.QUICK_OPEN_PREV_TAB.id)),
        });

        // 快照当前 MRU：过滤已关闭的标签，并兜底保证当前激活标签在队首
        const snapshotEntries = (): string[] => {
            const { tabs, mruTabIds, activeTabId } = useTabsStore.getState();
            const knownIDs = new Set(tabs.map(t => t.id));
            const entries = mruTabIds.filter(id => knownIDs.has(id));
            if (activeTabId && knownIDs.has(activeTabId) && !entries.includes(activeTabId)) {
                entries.unshift(activeTabId);
            }
            return entries;
        };

        const cancelSession = () => {
            sessionCombo = null;
            useTabSwitcherStore.getState().reset();
        };

        const commitSession = () => {
            if (!sessionCombo) return;
            const state = useTabSwitcherStore.getState();
            if (!state.isOpen) {
                sessionCombo = null;
                return;
            }
            const targetId = state.entries[state.index];
            sessionCombo = null;
            state.reset();
            if (targetId) useTabsStore.getState().setActiveTab(targetId);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            const { next, prev } = getCombos();

            if (useTabSwitcherStore.getState().isOpen && sessionCombo) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelSession();
                    return;
                }
                // 会话进行中：再次命中任一组合键，或按下起始组合键的主键
                // （含按住不放的自动重复）都推进高亮；方向由当前 Shift 状态动态决定
                const matched =
                    (next !== null && matchesCombo(event, next)) ||
                    (prev !== null && matchesCombo(event, prev));
                const repeatChord =
                    event.key.toLowerCase() === sessionCombo.key &&
                    isChordHeld(event, sessionCombo);
                if (!matched && !repeatChord) return;
                event.preventDefault();
                event.stopPropagation();
                useTabSwitcherStore.getState().move(event.shiftKey ? -1 : 1);
                return;
            }

            // 尝试开始新会话
            const hitNext = next !== null && matchesCombo(event, next);
            const hitPrev = prev !== null && matchesCombo(event, prev);
            if (!hitNext && !hitPrev) return;
            const hit = hitNext ? next : prev;
            if (!hit) return;
            event.preventDefault();
            event.stopPropagation();

            const entries = snapshotEntries();
            if (entries.length < 2) return;
            sessionCombo = hit;
            useTabSwitcherStore.getState().beginSession(entries, hitPrev);
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (!sessionCombo) return;
            // 松开起始组合键的主修饰键即提交（支持 ctrl/meta/alt/shift 任意改键）
            if (event.key === PRIMARY_MOD_KEYUP[sessionCombo.primaryMod]) commitSession();
        };

        const handleBlur = () => {
            if (useTabSwitcherStore.getState().isOpen) cancelSession();
        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        window.addEventListener('blur', handleBlur, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            window.removeEventListener('blur', handleBlur, true);
            cancelSession();
        };
    }, []);
}
