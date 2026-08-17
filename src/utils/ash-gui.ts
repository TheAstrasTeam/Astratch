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
const openMenuByMouseDown = (openFn: (point: { x: number; y: number }) => void) => {
    return (e: React.MouseEvent<HTMLElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
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

export { selectProjectThenJump, openMenuByMouseDown, saveCurrentProject, saveCurrentProjectAs };
