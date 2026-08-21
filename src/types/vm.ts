/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IBlocks, ICustomFunction, IWorkspaceState } from './blocks';
import * as Blockly from 'blockly/core';

export const DATA_VISIBILITY = {
    PUBLIC: 'public',
    PRIVATE: 'private',
} as const;
export type TDATA_VISIBILITY = (typeof DATA_VISIBILITY)[keyof typeof DATA_VISIBILITY];

export const targets = {
    ASH: 'ash',
    SCRATCH: 'scratch',
    TURBOWARP: 'turbowarp',
} as const;
export type TallTarget = (typeof targets)[keyof typeof targets];

/**
 * 内置Tab
 */
export const allBuiltInTabs = {
    TARGETS: 'targets',
    ADDONS: 'addons',
    DEBUG: 'debug',
} as const;
export type TallBuiltInTabs = (typeof allBuiltInTabs)[keyof typeof allBuiltInTabs];

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
    /**
     * 文件夹从属，null则为顶层
     */
    parentID: string | null;
    /**
     * 从属，模块或对象
     */
    mode: TTargetMode;
    viewX: number;
    viewY: number;
    viewScale: number;
    /**
     * 链接的模块
     */
    links: string[];
    /**
     * 数据
     */
    data: Map<string, IVariable>;
    /**
     * 函数
     */
    function: Map<string, ICustomFunction>;
    /**
     * 重命名目标
     */
    rename: (name: string) => void;
    /**
     * 设置父文件夹
     */
    setParent: (parentID: string | null) => void;
    /**
     * 链接一个模块，自链接会失败并返回false
     */
    addLink: (linkTargetID: string) => boolean;
    /**
     * 解除与模块的链接
     */
    removeLink: (linkTargetID: string) => void;
    /**
     * 设置目标的所有块
     * @param state 块的AST
     */
    setBlocks: (state: IWorkspaceState) => void;
    /**
     * 更新视口（位置/缩放）
     */
    setViewport: (data: TViewportUpdateEvent) => void;
    /**
     * 创建一个数据，名字重复会警告但仍会创建
     * @returns 数据的ID
     */
    createData: (name: string, data: unknown, isPrivate?: boolean, isConst?: boolean) => string;
    /**
     * 获取数据，不存在则返回null
     */
    getData: (dataID: string) => IVariable | null;
    /**
     * 生成一个带原型（方法）的树节点副本
     */
    cloneAsNode: () => ITarget & { type: 'target' };
    /**
     * 序列化为纯字段对象（不含blocks）
     */
    toJSON: () => TTargetInfo;
    /**
     * 添加一个自定义函数配置
     * @returns 是否创建成功
     */
    addCustomFunction: (id: string, meta: ICustomFunction) => boolean;
    /** 根据稳定 ID 获取一个自定义函数，不存在时返回 null。 */
    getFunction: (id: string) => ICustomFunction | null;
    /** 获取自定义函数的只读快照，供动态工具箱生成内容。 */
    listFunctions: () => readonly ICustomFunction[];
}

/**
 * 纯字段的目标结构（用于默认值模板与序列化）
 *
 * 序列化时 data / function 以数组存储（Map 无法被 JSON 序列化，会变成 {}），
 * 加载时由 fromJSON 还原为 Map
 */
export type TTargetInfo = Omit<
    ITarget,
    | 'rename'
    | 'setParent'
    | 'addLink'
    | 'removeLink'
    | 'setBlocks'
    | 'setViewport'
    | 'createData'
    | 'getData'
    | 'cloneAsNode'
    | 'toJSON'
    | 'addCustomFunction'
    | 'data'
    | 'function'
    | 'getFunction'
    | 'listFunctions'
> & {
    data: IVariable[];
    function: ICustomFunction[];
};

export interface IVariable {
    name: string;
    id: string;
    data: unknown;
    // TODO: 类型系统
    type?: unknown;
    /**
     * 是否是私有
     * 如果是，则它为“单个脚本共享”，否则为“整个目标共享”
     */
    isPrivate: boolean;
    /**
     * 是否是常量
     */
    isConst: boolean;
}

export const TargetModes = {
    ENTITY: 'entity',
    MODULE: 'module',
} as const;
export type TTargetMode = (typeof TargetModes)[keyof typeof TargetModes];

export interface ITargetMeta {
    name?: string;
    mode?: TTargetMode;
    id?: string;
    parent?: string | null;
    from?: string;
    /**
     * 数据，如果是导入的target的话
     * TODO: 确认类型注解
     */
    data?: ArrayBuffer;
}

export interface IEntityInfo {
    size: number;
    direction: number;
    currentCostume: number;
    effects: ITargetEffects;
    volume: number;
    x: number;
    y: number;
}

export interface IFolder {
    name: string;
    id: string;
    color: string;
    /**
     * 父ID，若为null则为根目录
     */
    parentID: string | null;
    /**
     * 重命名文件夹
     */
    rename: (name: string) => void;
    /**
     * 设置文件夹颜色
     */
    setColor: (color: string) => void;
    /**
     * 设置父文件夹
     */
    setParent: (parentID: string | null) => void;
    /**
     * 生成一个带原型（方法）的树节点副本
     */
    cloneAsNode: () => IFolder & { type: 'folder' };
}

/**
 * 纯字段的文件夹结构（用于默认值模板与序列化）
 */
export type TFolderInfo = Omit<IFolder, 'rename' | 'setColor' | 'setParent' | 'cloneAsNode'>;

export interface TTargetTreeNode extends IFolder {
    children: TTargetTree;
    type: 'folder';
}

export type TTargetTree = (TTargetTreeNode | (ITarget & { type: 'target' }))[];

export interface IRuntime {
    /**
     * 关于积木的
     */
    blocks: IBlocks;
    /**
     * 关于作品设置的
     */
    settings: IVMSettings;
    /**
     * 关于*目标*的
     *
     * ps: 角色是 Scratch 的`sprite`的中文叫法，target 在 ASH 指代是“目标”
     */
    targets: Map<string, ITarget>;
    /**
     * 文件夹系统，存储整个项目的目录
     * ASH 原生支持文件夹，来管理项目
     */
    folders: Map<TTargetMode, IFolder[]>;
    /**
     * 对于实体额外的info
     */
    DEFAULT_ENTITYINFO: IEntityInfo;
    /**
     * 默认target的信息
     */
    DEFAULT_TARGETINFO: TTargetInfo;
    /**
     * 创建一个新的target，并返回他的ID
     */
    createTarget: (meta: ITargetMeta) => string;
    /**
     * 切换target
     */
    switchTarget: (id: string) => void;
    /**
     * 当前的编辑目标ID
     */
    editingTargetID: string;
    /**
     * 通过ID获取这个target
     */
    getTargetByID: (id: string) => ITarget | undefined;
    /**
     * 获取当前编辑中的目标
     */
    getEditingTarget: () => ITarget | undefined;

    /**
     * 根据id获取文件夹
     * @param mode "entity" | "module"
     * @param id
     * @returns
     */
    getFolderByID: (mode: TTargetMode, id: string) => IFolder | null;
    /**
     * 添加一个新的文件夹
     * @param mode "entity" | "module"
     * @param meta
     * @returns
     */
    addFolder: (mode: TTargetMode, meta: TFolderInfo) => void;
    /**
     * 获取父文件夹（如果有，否则返回 null）
     * @param mode "entity" | "module"
     * @param id
     * @returns
     */
    getFolderParent: (mode: TTargetMode, id: string) => IFolder | null;
    /**
     * 删除文件夹
     * @param mode "entity" | "module"
     * @param id
     * @returns
     */
    removeFolder: (mode: TTargetMode, id: string) => void;
    /**
     * 获取文件夹的所有子项
     * 只会获取第一层
     * @param mode "entity" | "module"
     * @param id
     * @returns
     */
    getFolderChildren: (mode: TTargetMode, id: string | null) => IFolder[];
    /**
     * 获取文件夹的所有子项
     * 会获取依赖它的所有文件夹及其子文件夹
     * @param mode "entity" | "module"
     * @param id
     * @returns 文件夹的所有子项
     */
    getFolderDescendants: (mode: TTargetMode, id: string | null) => IFolder[];
    /**
     * 生成此界面的文件树，以树形式输出项目结构（包括targets和文件夹）
     * @param mode "entity" | "module"
     * @returns 树形式的项目结构
     */
    generateTargetsTree: (mode: TTargetMode) => TTargetTree;
    /**
     * 删除一个目标
     * @param id 目标的id
     * @returns 是否成功删除
     */
    removeTarget: (id: string) => boolean;
    /**
     * 修改一个目标的父id
     * @param mode "entity" | "module"
     * @param targetID 要修改父id的目标id
     * @param newParentID 新的父id
     * @returns 是否修改成功
     */
    moveTarget: (mode: TTargetMode, targetID: string, newParentID: string | null) => boolean;
    /**
     * 修改一个文件夹的父id
     * @param mode "entity" | "module"
     * @param folderID 要修改父id的文件夹id
     * @param newParentID 新的父id
     * @returns 是否修改成功
     */
    moveFolder: (mode: TTargetMode, folderID: string, newParentID: string | null) => boolean;
    /**
     * 让目标引用一个模块，并返回是否引用成功
     */
    /**
     * 链接目标
     * @param targetID 要被链接的目标id
     * @param linkTargetID 链接到的目标id
     * @returns 是否链接成功
     */
    linkTarget: (targetID: string, linkTargetID: string) => boolean;
}

/**
 * 事件发送函数（结构体方法用它发事件，绑定 VM 的 emit）
 */
export type TEmit = (id: TEvents, data?: object) => void;

export type DirectoryHandle = FileSystemDirectoryHandle | undefined;

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
    createFolder: (
        path: DirectoryHandle,
        name: string,
    ) => Promise<FileSystemDirectoryHandle | false>;
    /**
     * 创建个文件
     * @param path 文件的句柄
     * @param name 文件名
     * @param content 文件内容
     * @returns 这个文件对应句柄，如果错误则返回 false
     */
    createFile: (
        path: DirectoryHandle,
        name: string,
        content: string,
    ) => Promise<FileSystemFileHandle | false>;
    /**
     * 返回这个文件夹内是不是空的
     * @returns 是否有文件
     */
    isEmpty: (path: DirectoryHandle) => Promise<boolean>;
    /**
     * 获取一个文件
     * @param path 文件夹句柄
     * @param name 文件名称
     * @returns
     */
    getFile: (path: DirectoryHandle, name: string) => Promise<FileSystemFileHandle | false>;
    /**
     * 获取一个文件夹
     * @param path 文件夹句柄
     * @param name 文件夹名称
     * @returns
     */
    getFolder: (path: DirectoryHandle, name: string) => Promise<FileSystemDirectoryHandle | false>;
    /**
     * 检查项目是否是可以保存的
     */
    checkProjectCanSave: () => Promise<{
        pass: boolean;
        result?: string;
        error?: TAllProjectCheckError;
    }>;
    /**
     * 删除一个文件
     * @param path 路径句柄
     * @param name 文件名称
     * @returns
     */
    removeFile: (path: DirectoryHandle, name: string) => Promise<boolean>;
    /**
     * 列出所有文件/文件夹
     * @param path 路径句柄
     * @returns
     */
    listAllFileName: (path: DirectoryHandle) => Promise<string[] | false>;
}

export const allProjectCheckError = {
    API_UNDEFINED: 'api_undefined',
    NOTHING_SELECTED: 'nothing_selected',
    FOLDER_NOT_EMPTY: 'folder_not_empty',
} as const;
export type TAllProjectCheckError =
    (typeof allProjectCheckError)[keyof typeof allProjectCheckError];

export const projectFileNames = {
    meta: 'projectMeta.json',
    targetMeta: 'targetMeta.json',
    targetBlocks: 'targetBlocks.json',
} as const;

export interface IVM {
    runtime: IRuntime;
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
     * 另存为：重新选择文件夹后保存项目
     */
    saveProjectAs: () => Promise<void>;
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
    /**
     * 正在编辑项目
     * 如果已经打开了一个项目，则返回true
     * 额，这个不是正在拖放积木的编辑！
     */
    isEditingProject: boolean;
}

export interface IEvent {
    callback?: (data: object) => void;
    once?: boolean;
}

export const events = {
    SWITCH_TARGET: 'switch_target',
    UPDATE_PROJECT: 'update_project',
    CREATE_PROJECT: 'create_project',
    UPDATE_THEME: 'update_theme',
    VIEWPORT_VIEW: 'viewport_view',
    UPDATE_TARGET_STRUCTURE: 'update_target_structure',
    CREATE_DATA: 'create_data',
    CREATE_CUSTOM_FUNCTION: 'create_custom_function',
} as const;

export type TEvents = (typeof events)[keyof typeof events];

export type TViewportUpdateEvent =
    | {
          changed: 'scale';
          oldScale: number;
          scale: number;
      }
    | {
          changed: 'position';
          x: number;
          y: number;
      };

export interface IDataCreatedEvent {
    targetID: string;
    dataID: string;
}
export interface IFunctionCreatedEvent {
    id: string;
    targetID: string;
}

export interface IProjectMetaJSON {
    // 截至目前，1 为最新
    projectSaveVersion: number;
    meta: IProjectMeta;
    folders: Record<TTargetMode, IFolder[]>;
    /** 项目依赖的插件及其精确版本（addonId -> version），打开项目时据此恢复插件环境 */
    addons?: Record<string, string>;
}
