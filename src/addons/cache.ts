/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// 插件文件的 IndexedDB 缓存：把从 GitHub 下载的插件文件存起来，离线也能用

const DB_NAME = 'astratch_addons_cache';
const STORE_NAME = 'files';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            reject(new Error('Failed to open addon cache'));
        };
    });
}

/**
 * 读取缓存，不存在或读取失败时返回 null
 */
export async function cacheGet(key: string): Promise<string | null> {
    try {
        const db = await openDB();
        return await new Promise<string | null>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const request = transaction.objectStore(STORE_NAME).get(key);
            request.onsuccess = () => {
                resolve((request.result as string | undefined) ?? null);
            };
            request.onerror = () => {
                reject(new Error('Failed to read addon cache'));
            };
        });
    } catch {
        return null;
    }
}

/**
 * 写入缓存，失败不抛出（不影响主流程）
 */
export async function cacheSet(key: string, value: string): Promise<void> {
    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            transaction.objectStore(STORE_NAME).put(value, key);
            transaction.oncomplete = () => {
                resolve();
            };
            transaction.onerror = () => {
                reject(new Error('Failed to write addon cache'));
            };
        });
    } catch {
        // 缓存失败不影响功能
    }
}
