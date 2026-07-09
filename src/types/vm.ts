import type { IBlocks, IWorkspaceState } from './blocks';
import * as Blockly from 'blockly/core';

export const targets = {
    ASH: 'ash',
    SCRATCH: 'scratch',
    TURBOWARP: 'turbowarp',
};
export type TallTarget = (typeof targets)[keyof typeof targets];

export interface IProjectMeta {
    /**
     * 项目作者（们）
     */
    author: string[];
    projectName: string;
    /**
     * 项目ID
     */
    projectID: string;
    projectMode: TallTarget;
}

export interface IVMSettings {
    enableTurboMode: boolean;
    projectMeta: IProjectMeta;
    setProjectMeta: (meta: Partial<IProjectMeta>) => void;
}

export interface ITargetBlocks {
    /**
     * 序列化的工作区
     */
    _workspace: IWorkspaceState;
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
    name: string;
    id: string;
    blocks: ITargetBlocks;
    comments: Record<string, Blockly.serialization.workspaceComments.State>;
    size?: number;
    direction?: number;
    currentCostume?: number;
    effects?: ITargetEffects;
    volume?: number;
    x?: number;
    y?: number;
}

export const TargetModes = {
    OBJECT: 'object',
    MODULE: 'module'
} as const;
export type TTargetMode = typeof TargetModes[keyof typeof TargetModes]

export interface ITargetMeta {
    name?: string;
    mode?: TTargetMode;
    id?: string;
    /**
     * 数据，如果是导入的target的话
     * todo: 确认类型注解
     */
    data?: ArrayBuffer;
}

export interface IObjectInfo {
    size: number;
    direction: number;
    currentCostume: number;
    effects: ITargetEffects;
    volume: number;
    x: number;
    y: number;
}

export interface IRuntime {
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
    /**
     * 对于实体额外的info
     */
    DEFAULT_OBJECTINFO: IObjectInfo;
    /**
     * 默认target的信息
     */
    DEFAULT_TARGETINFO: ITarget;
    /**
     * 创建一个新的target
     */
    createTarget: (meta: ITargetMeta) => void;
    /**
     * 切换target
     */
    switchTarget: (id: string) => void;
    /**
     * 当前的编辑目标ID
     */
    editingTargetID: string;
    /**
     * 设置一个target的所有块
     * @param targetID 目标的ID
     * @param blocks 块的AST
     * @returns
     */
    setTargetBlock: (targetID: string, blocks: IWorkspaceState) => void;
    /**
     * 通过ID获取这个target的index
     */
    getTargetByID: (id: string) => ITarget | undefined;
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
    /**
     * 获取一个文件
     * @param path 文件夹句柄
     * @param name 文件名称
     * @returns
     */
    getFile: (path: folderType, name: string) => Promise<FileSystemFileHandle | false>;
    /**
     * 检查项目是否是可以保存的
     */
    checkProjectCanSave: () => Promise<{
        pass: boolean;
        result?: string;
    }>;
}

export const projectFileNames = {
    meta: 'projectMeta.json',
} as const;

export interface IVM {
    runtime: IRuntime;
    settings: IVMSettings;
    projectManager: IProjectManager;
    /**
     * 选择一个文件夹打开作为项目
     */
    selectProject: () => Promise<void>;
    /**
     * 保存项目
     */
    saveProject: () => Promise<void>;
    /**
     * 初始化项目
     */
    initProject: () => Promise<void>;
    /**
     * 订阅事件
     * @param id 订阅的事件
     * @param callback 回调
     * @param once 是否只探测一次
     */
    on: (id: TEvents, callback: (data: object) => void, once?: boolean) => void;
    /**
     * 取消订阅事件
     * @param id 取消订阅的事件
     * @param callback 回调
     */
    off: (id: TEvents, callback: (data: object) => void) => void;
    /**
     * 发送事件
     * @param id 发送的事件
     * @param data 数据
     * @returns
     */
    emit: (id: TEvents, data?: object) => void;
    /**
     * 加载项目
     * @returns 是否加载成功
     */
    loadProject: () => Promise<boolean>;
}

export interface IEvent {
    callback?: (data: object) => void;
    once?: boolean;
}

export const events = {
    SWITCH_TARGET: 'switch_target',
    UPDATE_PROJECT: 'update_project',
} as const;

export type TEvents = (typeof events)[keyof typeof events];
