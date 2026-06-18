import type { IProjectManager } from "../../types/vm";

/**
 * 与文件系统互动
 */
export class ProjectManager implements IProjectManager{
    // 一开始没有
    folderHandle?: FileSystemDirectoryHandle;
    isAPIAvailable: boolean;

    constructor(){
        // 在非localhost/https环境下没有这个东西，js还是太安全了
        this.isAPIAvailable = typeof showDirectoryPicker === 'function';
    }

    async selectFolder(){
        this.folderHandle = await window.showDirectoryPicker();
    }

    createFolder(){

    }
}