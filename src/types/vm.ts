import type { IBlocks } from './blocks';

export interface IVMSettings {
    enableTurboMode: boolean;
}

export interface IRuntime {
    projectID: string;
    projectAuthor: string[];
}

export type folderType = FileSystemDirectoryHandle | undefined;

export interface IProjectManager {
    /**
     * 项目文件夹句柄
     */
    folderHandle?: FileSystemDirectoryHandle;
    isAPIAvailable: boolean;
    /**
     * 选择一个文件夹
     */
    selectFolder: () => Promise<void>;
    /**
     * 创建文件夹（如果这个文件夹不存在），并返回它的句柄
     * @param path 文件夹的句柄
     * @param name 文件夹的名称
     * @returns 这个文件夹的对应句柄
     */
    createFolder: (path: folderType, name: string) => Promise<FileSystemDirectoryHandle>;
    /**
     * 创建个文件
     * @param path 文件的句柄
     * @param name 文件名
     * @param content 文件内容
     * @returns
     */
    createFile: (path: folderType, name: string, content: string) => Promise<FileSystemFileHandle>;
    /**
     * 返回这个文件夹内是不是空的
     * @returns 是否有文件
     */
    isEmpty: (path: folderType) => Promise<boolean>;
}

export interface IVM {
    Runtime: IRuntime;
    Settings: IVMSettings;
    editingTargetID: string;
    ProjectManager: IProjectManager;
    Blocks: IBlocks;
    /**
     * 选择一个文件夹打开作为项目
     */
    selectProject: () => Promise<void>;
    /**
     * 初始化项目
     */
    initProject: () => Promise<void>;
}
