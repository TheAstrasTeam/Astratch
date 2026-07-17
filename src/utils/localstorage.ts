// 存储关于本地存储的实用函数

import type { TLocalStorageIDs } from '../types/storage';

/**
 * 从本地存储读取一个值
 * @param key 存储键名
 * @returns 解析后的数据，不存在时返回 null
 */
const readLocalStorage = (key: TLocalStorageIDs): unknown => {
    try {
        const data = localStorage.getItem(key);
        if (!data) return null;

        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    } catch {
        return null;
    }
};

/**
 * 在本地存储一个值
 * @param key 存储键名
 * @param data 存储的数据
 */
const setItemToLocalStorage = (key: TLocalStorageIDs, data: string | object) => {
    if (!data) return;
    const storageData = typeof data === 'object' ? JSON.stringify(data) : data;
    localStorage.setItem(key, storageData);
};

export { readLocalStorage, setItemToLocalStorage };
