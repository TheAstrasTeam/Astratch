/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 关于部分常用 GUI 互动的实用工具

import { guiInterface, type IGuiInterface } from '../types/gui';
import type { IVM } from '../types/vm';

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
const openMenuByClick = (openFn: (point: { x: number; y: number }) => void) => {
    return (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        openFn({ x: rect.left, y: rect.bottom });
    };
};

export { selectProjectThenJump, openMenuByClick };
