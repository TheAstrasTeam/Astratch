/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    type IProjectManager,
    type folderType,
    type IVM,
    allProjectCheckError,
    projectFileNames,
} from '../../types/vm';

/**
 * 与文件系统互动
 */
export class ProjectManager implements IProjectManager {
    vm: IVM;
    // 一开始没有
    folderHandle?: FileSystemDirectoryHandle;
    isAPIAvailable: boolean;

    constructor(vm: IVM) {
        this.vm = vm;
        // 在非localhost/https环境下没有这个东西，js还是太安全了
        this.isAPIAvailable = typeof showDirectoryPicker === 'function';
    }

    async checkProjectCanSave() {
        if (!this.isAPIAvailable)
            return {
                pass: false,
                result: 'API is unavailable',
                error: allProjectCheckError.API_UNDEFINED,
            };
        if (!this.folderHandle)
            return {
                pass: false,
                result: 'Please load/create a project first!',
                error: allProjectCheckError.NOTHING_SELECTED,
            };
        // 如果projectFileNames.meta存在则代表这是一个项目，因此不必要求为空
        if (
            !(await this.isEmpty(this.folderHandle)) &&
            !(await this.getFile(this.folderHandle, projectFileNames.meta))
        )
            return {
                pass: false,
                result: 'Please select a empty folder!',
                error: allProjectCheckError.FOLDER_NOT_EMPTY,
            };
        return { pass: true };
    }

    async selectFolder() {
        try {
            this.folderHandle = await window.showDirectoryPicker();
        } catch {
            console.warn('You cancel dir picker!');
        }
    }

    async isEmpty(path: folderType) {
        if (!path) return false;
        try {
            const entries = await path.values().next();
            return !!entries.done;
        } catch {
            return true;
        }
    }

    async createFolder(path: folderType, name: string) {
        if (!path) return false;
        return await path.getDirectoryHandle(name, { create: true });
    }

    async createFile(path: folderType, name: string, content: string) {
        if (!path) return false;
        const fileHandle = await path.getFileHandle(name, { create: true });
        const fileWrite = await fileHandle.createWritable();
        await fileWrite.write(content);
        await fileWrite.close();
        return fileHandle;
    }

    async getFile(path: folderType, name: string) {
        if (!path) return false;
        const fileHandle = await path.getFileHandle(name);
        return fileHandle;
    }

    async getFolder(path: folderType, name: string) {
        if (!path) return false;
        const folderHandle = await path.getDirectoryHandle(name);
        return folderHandle;
    }

    async removeFile(path: folderType, name: string) {
        if (!path) return false;
        await path.removeEntry(name, { recursive: true });
        return true;
    }

    async listAllFileName(path: folderType) {
        if (!path) return false;
        const result = [];
        for await (const entry of path.values()) {
            result.push(entry.name);
        }
        return result;
    }
}
