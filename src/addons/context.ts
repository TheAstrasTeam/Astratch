/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import * as Blockly from 'blockly';
import { t } from 'i18next';
import { Toast } from '../lib/ToastManager';
import type { IVM } from '../types/vm';
import type { IAddonContext } from './types';

/**
 * 构建插件上下文
 * 每个插件的 storage 会在运行时替换为独立命名空间
 */
export function buildAddonContext(vm: IVM): IAddonContext {
    return {
        vm,
        blockly: Blockly,
        toast: Toast,
        t,
        storage: {
            get: () => null,
            set: () => undefined,
            remove: () => undefined,
        },
        // 占位实现，真正的设置 API 由 AddonManager.makeContext 按插件注入
        settings: {
            get: () => undefined,
            set: () => undefined,
            defs: [],
        },
    };
}
