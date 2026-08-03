/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 关于调试的文件

import { Toast } from '../lib/ToastManager';
import { spawnRandomString } from './ash-string';

export const debug = true;

export const sendError = (error: unknown, type: 'error' | 'warn' = 'error') => {
    Toast.create({
        type,
        id: `Error_${spawnRandomString()}`,
        text: error as string,
    });
    if (type === 'warn') {
        console.warn(error);
        return;
    }
    if (typeof error === 'string') throw new Error(error);
    else throw error;
};
