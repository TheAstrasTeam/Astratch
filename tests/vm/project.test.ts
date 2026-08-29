// 此文件由AI生成
/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectManager } from '../../src/vm/project/projectManager';
import { allProjectCheckError, projectFileNames, type IVM } from '../../src/types/vm';

// ---- 模拟 FileSystemDirectoryHandle ----

type TKind = 'file' | 'directory';

interface MockFS {
    store: Map<string, TKind>;
    /** 文件名 -> 写入的内容片段 */
    fileWrites: Map<string, string[]>;
    handle: FileSystemDirectoryHandle;
}

function makeMockFS(initial: [string, TKind][] = []): MockFS {
    const store = new Map<string, TKind>(initial);
    const fileWrites = new Map<string, string[]>();

    const handle = {
        *values() {
            for (const [name, kind] of store) {
                yield { name, kind };
            }
        },
        getDirectoryHandle(name: string, opts?: { create?: boolean }) {
            const kind = store.get(name);
            if (kind === 'file') throw new DOMException('not a directory', 'TypeMismatchError');
            if (!kind && !opts?.create) throw new DOMException('not found', 'NotFoundError');
            store.set(name, 'directory');
            return Promise.resolve(handle);
        },
        getFileHandle(name: string, opts?: { create?: boolean }) {
            const kind = store.get(name);
            if (kind === 'directory') throw new DOMException('not a file', 'TypeMismatchError');
            if (!kind && !opts?.create) throw new DOMException('not found', 'NotFoundError');
            store.set(name, 'file');
            return Promise.resolve({
                createWritable: () =>
                    Promise.resolve({
                        write: (chunk: string) => {
                            const list = fileWrites.get(name) ?? [];
                            list.push(chunk);
                            fileWrites.set(name, list);
                            return Promise.resolve();
                        },
                        close: () => Promise.resolve(),
                    }),
            });
        },
        removeEntry(name: string, _opts?: { recursive?: boolean }) {
            if (!store.has(name)) throw new DOMException('not found', 'NotFoundError');
            store.delete(name);
            return Promise.resolve();
        },
    } as unknown as FileSystemDirectoryHandle;

    return { store, fileWrites, handle };
}

/** 一个迭代会失败的句柄，用来模拟权限/读取错误 */
function makeBrokenHandle(): FileSystemDirectoryHandle {
    return {
        values: () => ({
            next: () => Promise.reject(new Error('boom')),
        }),
    } as unknown as FileSystemDirectoryHandle;
}

describe('ProjectManager', () => {
    const vm = {} as IVM;
    let pm: ProjectManager;

    beforeEach(() => {
        pm = new ProjectManager(vm);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('isAPIAvailable', () => {
        it('在没有showDirectoryPicker的环境下不可用', () => {
            expect(pm.isAPIAvailable).toBe(false);
        });

        it('存在showDirectoryPicker时可用', () => {
            vi.stubGlobal('showDirectoryPicker', vi.fn());
            expect(new ProjectManager(vm).isAPIAvailable).toBe(true);
        });
    });

    describe('checkProjectCanSave', () => {
        it('API不可用时返回API_UNDEFINED', async () => {
            pm.isAPIAvailable = false;
            const result = await pm.checkProjectCanSave();
            expect(result).toMatchObject({
                pass: false,
                error: allProjectCheckError.API_UNDEFINED,
            });
        });

        it('未选择文件夹时返回NOTHING_SELECTED', async () => {
            pm.isAPIAvailable = true;
            const result = await pm.checkProjectCanSave();
            expect(result).toMatchObject({
                pass: false,
                error: allProjectCheckError.NOTHING_SELECTED,
            });
        });

        it('文件夹非空且没有projectMeta.json时返回FOLDER_NOT_EMPTY', async () => {
            pm.isAPIAvailable = true;
            pm.folderHandle = makeMockFS([['some.txt', 'file']]).handle;
            const result = await pm.checkProjectCanSave();
            expect(result).toMatchObject({
                pass: false,
                error: allProjectCheckError.FOLDER_NOT_EMPTY,
            });
        });

        it('空文件夹可以保存', async () => {
            pm.isAPIAvailable = true;
            pm.folderHandle = makeMockFS().handle;
            const result = await pm.checkProjectCanSave();
            expect(result.pass).toBe(true);
        });

        it('非空但已有projectMeta.json时视为项目，可以保存', async () => {
            pm.isAPIAvailable = true;
            pm.folderHandle = makeMockFS([
                [projectFileNames.meta, 'file'],
                ['extra.txt', 'file'],
            ]).handle;
            const result = await pm.checkProjectCanSave();
            expect(result.pass).toBe(true);
        });
    });

    describe('selectFolder', () => {
        it('选择成功后设置folderHandle', async () => {
            const fs = makeMockFS();
            vi.stubGlobal('window', {
                showDirectoryPicker: vi.fn(() => Promise.resolve(fs.handle)),
            });
            await pm.selectFolder();
            expect(pm.folderHandle).toBe(fs.handle);
        });

        it('取消选择时不抛错也不设置folderHandle', async () => {
            vi.stubGlobal('window', {
                showDirectoryPicker: vi.fn(() =>
                    Promise.reject(new DOMException('user canceled', 'AbortError')),
                ),
            });
            await expect(pm.selectFolder()).resolves.toBeUndefined();
            expect(pm.folderHandle).toBeUndefined();
        });
    });

    describe('isEmpty', () => {
        it('空目录返回true', async () => {
            expect(await pm.isEmpty(makeMockFS().handle)).toBe(true);
        });

        it('非空目录返回false', async () => {
            expect(await pm.isEmpty(makeMockFS([['a.txt', 'file']]).handle)).toBe(false);
        });

        it('路径不存在时返回false', async () => {
            expect(await pm.isEmpty(undefined)).toBe(false);
        });

        it('读取失败时按非空处理（返回false）', async () => {
            expect(await pm.isEmpty(makeBrokenHandle())).toBe(false);
        });
    });

    describe('createFolder', () => {
        it('创建文件夹并返回句柄', async () => {
            const fs = makeMockFS();
            const sub = await pm.createFolder(fs.handle, 'entitys');
            expect(sub).toBeTruthy();
            expect(fs.store.get('entitys')).toBe('directory');
        });

        it('路径不存在时返回false', async () => {
            expect(await pm.createFolder(undefined, 'x')).toBe(false);
        });
    });

    describe('createFile', () => {
        it('写入内容并返回句柄', async () => {
            const fs = makeMockFS();
            const file = await pm.createFile(fs.handle, 'meta.json', '{"a":1}');
            expect(file).toBeTruthy();
            expect(fs.store.get('meta.json')).toBe('file');
            expect(fs.fileWrites.get('meta.json')).toEqual(['{"a":1}']);
        });

        it('路径不存在时返回false', async () => {
            expect(await pm.createFile(undefined, 'x', '')).toBe(false);
        });
    });

    describe('getFile', () => {
        it('文件存在时返回句柄', async () => {
            const fs = makeMockFS([[projectFileNames.meta, 'file']]);
            expect(await pm.getFile(fs.handle, projectFileNames.meta)).toBeTruthy();
        });

        it('文件不存在时返回false', async () => {
            const fs = makeMockFS();
            expect(await pm.getFile(fs.handle, 'missing.json')).toBe(false);
        });

        it('路径不存在时返回false', async () => {
            expect(await pm.getFile(undefined, 'x')).toBe(false);
        });
    });

    describe('getFolder', () => {
        it('文件夹存在时返回句柄', async () => {
            const fs = makeMockFS([['entitys', 'directory']]);
            expect(await pm.getFolder(fs.handle, 'entitys')).toBeTruthy();
        });

        it('文件夹不存在时返回false', async () => {
            const fs = makeMockFS();
            expect(await pm.getFolder(fs.handle, 'missing')).toBe(false);
        });

        it('路径不存在时返回false', async () => {
            expect(await pm.getFolder(undefined, 'x')).toBe(false);
        });
    });

    describe('removeFile', () => {
        it('删除存在的条目返回true', async () => {
            const fs = makeMockFS([['old.txt', 'file']]);
            expect(await pm.removeFile(fs.handle, 'old.txt')).toBe(true);
            expect(fs.store.has('old.txt')).toBe(false);
        });

        it('删除不存在的条目返回false', async () => {
            const fs = makeMockFS();
            expect(await pm.removeFile(fs.handle, 'ghost.txt')).toBe(false);
        });

        it('路径不存在时返回false', async () => {
            expect(await pm.removeFile(undefined, 'x')).toBe(false);
        });
    });

    describe('listAllFileName', () => {
        it('列出所有条目名字', async () => {
            const fs = makeMockFS([
                ['a.json', 'file'],
                ['sub', 'directory'],
            ]);
            expect(await pm.listAllFileName(fs.handle)).toEqual(['a.json', 'sub']);
        });

        it('路径不存在时返回false', async () => {
            expect(await pm.listAllFileName(undefined)).toBe(false);
        });
    });
});
