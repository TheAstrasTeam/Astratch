import type { IProjectManager, folderType, IVM } from '../../types/vm';

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
}
