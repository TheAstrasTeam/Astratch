/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 关于部分常用 GUI 互动的实用工具

import { guiInterface, type IGuiInterface } from '../types/gui';
import type { IVM } from '../types/vm';
import { Toast } from '../lib/ToastManager';
import { spawnRandomString } from './ash-data';
import { t } from 'i18next';
import { modal } from '../components/Modal/modal';
import { SettingsModal } from '../components/modal_settings';

/**
 * 选择项目并跳转到编辑器
 * @param vm VM 实例
 * @param setInterface Zustand 跳转函数
 */
const selectProjectThenJump = async (vm: IVM, setInterface: (state: IGuiInterface) => void) => {
    const loadedProject = await vm.loadProject();
    if (loadedProject) setInterface(guiInterface.EDITOR);
};

/**
 * 打开Menu通过控件位置
 */
const openMenuByMouseDown = (
    openFn: (point: { x: number; y: number }) => void,
    /** 0：左键 1：中键 2：右键 */
    mouseButton = 0,
    /** 对齐模式，mouse则是在鼠标右下角出现，dom则是在挂载元素下出现 */
    position: 'mouse' | 'dom' = 'dom',
) => {
    return (e: React.MouseEvent<HTMLElement>) => {
        if (e.button !== mouseButton) return;
        e.preventDefault();
        const rect =
            position === 'dom'
                ? e.currentTarget.getBoundingClientRect()
                : { left: e.clientX, bottom: e.clientY };
        openFn({ x: rect.left, y: rect.bottom });
    };
};

/**
 * 保存项目并提示结果
 * 失败时 sendError 已弹出错误通知，这里只兜住异常避免未处理的 Promise
 */
const saveCurrentProject = async (vm: IVM) => {
    try {
        await vm.saveProject();
        Toast.create({
            type: 'info',
            id: `save_${spawnRandomString()}`,
            text: t('gui:menu.saveDone'),
        });
    } catch {
        // 已由 sendError 提示，无需重复处理
    }
};

/**
 * 另存为并提示结果
 */
const saveCurrentProjectAs = async (vm: IVM) => {
    try {
        await vm.saveProjectAs();
        Toast.create({
            type: 'info',
            id: `save_as_${spawnRandomString()}`,
            text: t('gui:menu.saveDone'),
        });
    } catch {
        // 已由 sendError 提示，无需重复处理
    }
};

/**
 * 设置窗口的跳转目标：指定默认分类与需要滚动定位的小节
 */
export interface ISettingsFocusTarget {
    category?: string;
    focusGroup?: string;
}

const settingsFocusListeners = new Set<(target: ISettingsFocusTarget) => void>();

/**
 * 订阅设置窗口的“跳转到指定小节”请求
 */
export const onSettingsFocus = (listener: (target: ISettingsFocusTarget) => void) => {
    settingsFocusListeners.add(listener);
    return () => {
        settingsFocusListeners.delete(listener);
    };
};

/**
 * 打开设置窗口。已打开时不再重复弹出，而是把跳转目标推送给已打开的窗口。
 * @param target 可选，指定打开后默认分类与需要滚动定位的小节
 */
const openSettingsModal = (target?: ISettingsFocusTarget) => {
    const alreadyOpen = modal.getSnapshot().some(state => state.Component === SettingsModal);
    if (alreadyOpen) {
        if (target)
            settingsFocusListeners.forEach(fn => {
                fn(target);
            });
        return;
    }
    void modal.open(SettingsModal, target);
};

/**
 * 创建同时支持鼠标右键和触摸长按的菜单触发处理器
 * @param openFn 菜单打开函数，接收锚点坐标 { x, y }
 * @param options 配置项
 * @returns 一组事件处理器，可展开绑定到 DOM 元素上
 * create by deepseek-v4-pro
 */
const createMenuTrigger = (
    openFn: (point: { x: number; y: number }) => void,
    options?: {
        mouseButton?: number;
        longPressDuration?: number;
        position?: 'mouse' | 'dom';
    },
) => {
    const { mouseButton = 2, longPressDuration = 600, position = 'dom' } = options ?? {};
    let timer: ReturnType<typeof setTimeout> | null = null;
    let startPos: { x: number; y: number } | null = null;
    let isLongPressed = false; // 标记是否已触发长按

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        if (position === 'mouse' && 'clientX' in e) {
            return { x: e.clientX, y: e.clientY };
        }
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        return { x: rect.left, y: rect.bottom };
    };

    const onMouseDown = (e: React.MouseEvent) => {
        if (e.button !== mouseButton) return;
        e.preventDefault();
        openFn(getPos(e));
    };

    const onTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        startPos = { x: touch.clientX, y: touch.clientY };
        isLongPressed = false;
        timer = setTimeout(() => {
            isLongPressed = true;
            // 触发菜单，不需要 preventDefault（事件已结束）
            if (startPos) {
                openFn(startPos);
            }
            startPos = null;
        }, longPressDuration);
    };

    const onTouchMove = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
            startPos = null;
        }
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
            startPos = null;
        }
        // 如果发生了长按，阻止后续 click 事件（防止菜单弹出后还执行点击操作）
        if (isLongPressed) {
            e.preventDefault();
        }
        isLongPressed = false;
    };

    return { onMouseDown, onTouchStart, onTouchMove, onTouchEnd };
};

export {
    selectProjectThenJump,
    openMenuByMouseDown,
    saveCurrentProject,
    saveCurrentProjectAs,
    openSettingsModal,
    createMenuTrigger,
};
