/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 有关数据的通用函数

/**
 * 生成一个符合`abc.def`之类的id字符串
 * @param string 字符串
 * @returns
 */
export const toID = (string: string) => {
    return string
        .trim()
        .toLocaleLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.-]/g, '')
        .replace(/\.+/g, '.')
        .replace(/^\.|\.$/g, '');
};

/**
 * 判断这个字符串是否是合法的目标名称
 * - 不为空
 * @param string 字符串
 * @returns
 */
export const isValidTargetName = (string: string) => {
    if (!string.trim()) return false;
    return true;
};

/**
 * 生成随机ID
 */
export const spawnRandomString = () => {
    return crypto.randomUUID();
};

/**
 * 扁平化object
 * @param obj
 */
export const flattenObject = (
    obj: Record<string, unknown>,
    prefix = '',
    result: Record<string, unknown> = {},
) => {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newKey = prefix ? `${prefix}_${key}` : key;
            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                flattenObject(obj[key] as Record<string, unknown>, newKey, result);
            } else {
                result[newKey] = obj[key];
            }
        }
    }
    return result;
};

/** 获取文件扩展名 */
export const getFileExtension = (filename: string) => {
    if (!filename.includes('.')) return '';
    return filename.split('.').pop();
};

/** 获取去除扩展名的文件名 */

export const getFileNameWithoutExt = (filename: string) => {
    if (!filename) return '';
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) return filename;
    return filename.substring(0, lastDotIndex);
};
