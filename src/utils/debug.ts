/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 关于调试的文件

import { Toast } from '../lib/ToastManager';
import { spawnRandomString } from './ash-data';

// 是否正在开发服务器
export const debug = import.meta.env.DEV;

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

export const log = (message: string) => {
    // eslint-disable-next-line no-console
    if (debug) console.log(message);
};
