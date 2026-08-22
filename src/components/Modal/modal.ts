/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModalManager } from '@reactleaf/modal';
import '@reactleaf/modal/style.css';
import type { ComponentType } from 'react';

export const modal = new ModalManager();

/**
 * 检查某个模态框组件是否已经在栈中打开，防止重复打开
 */
export const isModalOpen = (Component: ComponentType<never>): boolean => {
    const snapshot = modal.getSnapshot();
    for (const state of snapshot) {
        if (state.Component === Component) return true;
    }
    return false;
};
