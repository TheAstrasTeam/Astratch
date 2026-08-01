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
    if (typeof error === 'string') throw new Error(error);
    else throw error;
};
