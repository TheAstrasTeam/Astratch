import type { IBlocks } from './blocks';
import * as Blockly from 'blockly/core';

export const targets = {
    ASH: 'ash',
    SCRATCH: 'scratch',
    TURBOWARP: 'turbowarp',
};
export type TallTarget = (typeof targets)[keyof typeof targets];

export interface IProjectMeta {
    author: string[];
    projectName: string;
    projectID: string;
    projectMode: TallTarget;
}

export interface IVMSettings {
    enableTurboMode: boolean;
    projectMeta: IProjectMeta;
    setProjectMeta: (meta: Partial<IProjectMeta>) => void;
}

export interface ITargetBlocks {
    _blocks: (typeof Blockly.serialization.blocks)[];
    _script: string[];
}

export interface ITargetEffects {
    brightness: number;
    color: number;
    fisheye: number;
    ghost: number;
    mosaic: number;
    pixelate: number;
    whirl: number;
}

export interface ITarget {
    size: number;
    id: string;
    blocks: ITargetBlocks;
    comments: Record<string, Blockly.serialization.workspaceComments.State>;
    direction: number;
    currentCostume: number;
    effects: ITargetEffects;
    volume: number;
    x: number;
    y: number;
}

export interface IRuntime {
    /**
     * 项目ID
     */
    projectID: string;
    /**
     * 项目作者（们）
     */
    projectAuthor: string[];
    /**
     * 关于积木的
     */
    blocks: IBlocks;
    /**
     * 关于*角色*的
     * 
     * ps: 角色是 Scratch 的`sprite`的中文叫法，target 在 ASH 指代是“实体”
     */
    targets: ITarget[];
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
     * @returns 这个文件夹的对应句柄，如果错误则返回 false
     */
    createFolder: (path: folderType, name: string) => Promise<FileSystemDirectoryHandle | false>;
    /**
     * 创建个文件
     * @param path 文件的句柄
     * @param name 文件名
     * @param content 文件内容
     * @returns 这个文件对应句柄，如果错误则返回 false
     */
    createFile: (
        path: folderType,
        name: string,
        content: string,
    ) => Promise<FileSystemFileHandle | false>;
    /**
     * 返回这个文件夹内是不是空的
     * @returns 是否有文件
     */
    isEmpty: (path: folderType) => Promise<boolean>;
}

export interface IVM {
    runtime: IRuntime;
    settings: IVMSettings;
    editingTargetID: string;
    projectManager: IProjectManager;
    /**
     * 选择一个文件夹打开作为项目
     */
    selectProject: () => Promise<void>;
    /**
     * 初始化项目
     */
    initProject: () => Promise<void>;
}
