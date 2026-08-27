/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

// 插件相关数据的 IndexedDB 存储：
// - files: 从 GitHub 下载的插件文件文本（离线也能用）
// - handles: 用户通过上传文件夹安装的自定义插件目录句柄

const DB_NAME = 'astratch_addons_cache';
const FILES_STORE = 'files';
const HANDLES_STORE = 'handles';
const SETTINGS_STORE = 'settings';
const FILE_HASHES_STORE = 'fileHashes';
const DB_VERSION = 4;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(FILES_STORE)) {
                db.createObjectStore(FILES_STORE);
            }
            if (!db.objectStoreNames.contains(HANDLES_STORE)) {
                db.createObjectStore(HANDLES_STORE);
            }
            if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                db.createObjectStore(SETTINGS_STORE);
            }
            if (!db.objectStoreNames.contains(FILE_HASHES_STORE)) {
                db.createObjectStore(FILE_HASHES_STORE);
            }
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
            const transaction = db.transaction(FILES_STORE, 'readonly');
            const request = transaction.objectStore(FILES_STORE).get(key);
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
            const transaction = db.transaction(FILES_STORE, 'readwrite');
            transaction.objectStore(FILES_STORE).put(value, key);
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

/**
 * 删除指定 key 的缓存，失败不抛出
 */
export async function cacheDelete(key: string): Promise<void> {
    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(FILES_STORE, 'readwrite');
            transaction.objectStore(FILES_STORE).delete(key);
            transaction.oncomplete = () => {
                resolve();
            };
            transaction.onerror = () => {
                reject(new Error('Failed to delete addon cache'));
            };
        });
    } catch {
        // 删除失败不影响功能
    }
}

/**
 * 清空远端插件文件缓存（files store），下次加载会重新从 GitHub 下载。
 * 不会影响自定义插件的目录句柄（handles store）。
 * 清空失败时抛出错误，由调用方决定如何处理。
 */
export async function clearFileCache(): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(FILES_STORE, 'readwrite');
        transaction.objectStore(FILES_STORE).clear();
        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = () => {
            reject(new Error('Failed to clear addon cache'));
        };
    });
}

/**
 * 读取自定义插件的目录句柄，不存在或读取失败时返回 null
 */
export async function handleGet(id: string): Promise<FileSystemDirectoryHandle | null> {
    try {
        const db = await openDB();
        return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
            const transaction = db.transaction(HANDLES_STORE, 'readonly');
            const request = transaction.objectStore(HANDLES_STORE).get(id);
            request.onsuccess = () => {
                resolve((request.result as FileSystemDirectoryHandle | undefined) ?? null);
            };
            request.onerror = () => {
                reject(new Error('Failed to read addon handle'));
            };
        });
    } catch {
        return null;
    }
}

/**
 * 保存自定义插件的目录句柄，失败不抛出
 */
export async function handleSet(id: string, handle: FileSystemDirectoryHandle): Promise<void> {
    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(HANDLES_STORE, 'readwrite');
            transaction.objectStore(HANDLES_STORE).put(handle, id);
            transaction.oncomplete = () => {
                resolve();
            };
            transaction.onerror = () => {
                reject(new Error('Failed to write addon handle'));
            };
        });
    } catch {
        // 保存失败不影响功能
    }
}

/**
 * 删除自定义插件的目录句柄，失败不抛出
 */
export async function handleDelete(id: string): Promise<void> {
    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(HANDLES_STORE, 'readwrite');
            transaction.objectStore(HANDLES_STORE).delete(id);
            transaction.oncomplete = () => {
                resolve();
            };
            transaction.onerror = () => {
                reject(new Error('Failed to delete addon handle'));
            };
        });
    } catch {
        // 删除失败不影响功能
    }
}

/**
 * 列出所有已保存的自定义插件 id，失败时返回空数组
 */
export async function listHandleIds(): Promise<string[]> {
    try {
        const db = await openDB();
        return await new Promise<string[]>((resolve, reject) => {
            const transaction = db.transaction(HANDLES_STORE, 'readonly');
            const request = transaction.objectStore(HANDLES_STORE).getAllKeys();
            request.onsuccess = () => {
                resolve(request.result.map(String));
            };
            request.onerror = () => {
                reject(new Error('Failed to list addon handles'));
            };
        });
    } catch {
        return [];
    }
}

/**
 * 读取 registry.json 的哈希值
 */
export async function getRegistryHash(): Promise<string | null> {
    try {
        const db = await openDB();
        return await new Promise<string | null>((resolve, reject) => {
            const transaction = db.transaction(SETTINGS_STORE, 'readonly');
            const request = transaction.objectStore(SETTINGS_STORE).get('registryHash');
            request.onsuccess = () => {
                resolve((request.result as string | undefined) ?? null);
            };
            request.onerror = () => {
                reject(new Error('Failed to read registry hash'));
            };
        });
    } catch {
        return null;
    }
}

/**
 * 保存 registry.json 的哈希值
 */
export async function setRegistryHash(hash: string): Promise<void> {
    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
            transaction.objectStore(SETTINGS_STORE).put(hash, 'registryHash');
            transaction.oncomplete = () => {
                resolve();
            };
            transaction.onerror = () => {
                reject(new Error('Failed to write registry hash'));
            };
        });
    } catch {
        // 缓存失败不影响功能
    }
}

/**
 * 读取单个文件的哈希值，不存在时返回 null
 */
export async function getFileHash(key: string): Promise<string | null> {
    try {
        const db = await openDB();
        return await new Promise<string | null>((resolve, reject) => {
            const transaction = db.transaction(FILE_HASHES_STORE, 'readonly');
            const request = transaction.objectStore(FILE_HASHES_STORE).get(key);
            request.onsuccess = () => {
                resolve((request.result as string | undefined) ?? null);
            };
            request.onerror = () => {
                reject(new Error('Failed to read file hash'));
            };
        });
    } catch {
        return null;
    }
}

/**
 * 保存单个文件的哈希值
 */
export async function setFileHash(key: string, hash: string): Promise<void> {
    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(FILE_HASHES_STORE, 'readwrite');
            transaction.objectStore(FILE_HASHES_STORE).put(hash, key);
            transaction.oncomplete = () => {
                resolve();
            };
            transaction.onerror = () => {
                reject(new Error('Failed to write file hash'));
            };
        });
    } catch {
        // 缓存失败不影响功能
    }
}

/**
 * 批量更新文件哈希值（合并写入，不删除旧条目）
 */
export async function setAllFileHashes(hashes: Record<string, string>): Promise<void> {
    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(FILE_HASHES_STORE, 'readwrite');
            const store = transaction.objectStore(FILE_HASHES_STORE);
            for (const [key, hash] of Object.entries(hashes)) {
                store.put(hash, key);
            }
            transaction.oncomplete = () => {
                resolve();
            };
            transaction.onerror = () => {
                reject(new Error('Failed to write file hashes'));
            };
        });
    } catch {
        // 缓存失败不影响功能
    }
}

/**
 * 读取所有文件哈希值
 */
export async function getAllFileHashes(): Promise<Record<string, string>> {
    try {
        const db = await openDB();
        return await new Promise<Record<string, string>>((resolve, reject) => {
            const transaction = db.transaction(FILE_HASHES_STORE, 'readonly');
            const request = transaction.objectStore(FILE_HASHES_STORE).getAllKeys();
            request.onsuccess = () => {
                const keys = request.result.map(String);
                if (keys.length === 0) {
                    resolve({});
                    return;
                }
                const transaction2 = db.transaction(FILE_HASHES_STORE, 'readonly');
                const store2 = transaction2.objectStore(FILE_HASHES_STORE);
                const result: Record<string, string> = {};
                let pending = keys.length;
                for (const key of keys) {
                    const req = store2.get(key);
                    req.onsuccess = () => {
                        result[key] = req.result as string;
                        if (--pending === 0) resolve(result);
                    };
                    req.onerror = () => {
                        if (--pending === 0) resolve(result);
                    };
                }
            };
            request.onerror = () => {
                reject(new Error('Failed to list file hashes'));
            };
        });
    } catch {
        return {};
    }
}
