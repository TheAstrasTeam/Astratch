/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import Runtime from './runtime/runtime';
import Target from './runtime/target';
import Folder from './runtime/folder';
import {
    type IVM,
    type IRuntime,
    type IProjectManager,
    type IEvent,
    type TEvents,
    projectFileNames,
    events,
    allProjectCheckError,
    type TTargetMode,
    type DirectoryHandle,
    type IProjectMetaJSON,
    type ITargetBlocks,
    TargetModes,
    type TTargetInfo,
} from '../types/vm/vm.ts';
import { ProjectManager } from './project/projectManager';
import { addonManager } from '../addons/manager';
import { t } from 'i18next';
import { modal } from '../components/Modal/modal';
import { ConfirmModal } from '../components/modal_confirm';
import { sendError } from '../utils/debug';
import type { IAsset } from '../types/vm/assets.ts';

/**
 * 虚拟机，管理整个ASH
 */
export class VM implements IVM {
    runtime: IRuntime;
    projectManager: IProjectManager;
    isEditingProject: boolean;

    /**
     * 事件
     */
    private events = new Map<string, IEvent[]>();

    constructor() {
        /**
         * 运行时，它实际是是“项目”的总管
         * 而非只管运行相关
         */
        this.runtime = new Runtime(this);

        /**
         * 管理项目目录
         */
        this.projectManager = new ProjectManager(this);

        /**
         * 正在编辑项目
         * 如果已经打开了一个项目，则返回true
         * 额，这个不是正在拖放积木的编辑！
         */
        this.isEditingProject = false;
    }

    on(id: TEvents, callback: (data: object) => void, once = false) {
        if (!this.events.has(id)) this.events.set(id, []);
        const listeners = this.events.get(id);
        if (!listeners) return;
        if (listeners.some(e => e.callback === callback)) return;
        listeners.push({
            callback,
            once,
        });
    }

    off(id: TEvents, callback: (data: object) => void) {
        const listeners = this.events.get(id);
        if (!listeners) return;
        const index = listeners.findIndex(e => e.callback === callback);
        if (index !== -1) listeners.splice(index, 1);
    }

    emit(id: TEvents, data: object = {}) {
        const callbacks = this.events.get(id);
        if (!callbacks) return;

        for (let i = callbacks.length - 1; i >= 0; i--) {
            const event = callbacks[i];
            event.callback?.(data);
            if (event.once) {
                callbacks.splice(i, 1);
            }
        }
    }

    async selectProject() {
        await this.projectManager.selectFolder();
    }

    async saveProject() {
        const checkResult = await this.projectManager.checkProjectCanSave();
        if (!checkResult.pass) sendError({ text: checkResult.result ?? '' }, 'error');

        const saveTargets = async (mode: TTargetMode, folder: DirectoryHandle) => {
            // 存储所有文件名，这用来判断是否是已存在target名称
            const allTargetNames: string[] = [];
            const targets = new Map(
                [...this.runtime.targets].filter(([_, target]) => target.mode === mode),
            );
            for (const targetMap of targets) {
                const target = targetMap[1];

                const targetFolderName = `${target.name}_${target.id}`;
                allTargetNames.push(targetFolderName);
                const spriteHandle = await this.projectManager.createFolder(
                    folder,
                    targetFolderName,
                );

                // 向对应的target存储meta.json和blocks.json
                // hmm，事实上它们是存一起的，不过这里会分开
                if (spriteHandle) {
                    await this.projectManager.createFile(
                        spriteHandle,
                        projectFileNames.targetMeta,
                        JSON.stringify(target.toJSON()),
                    );
                    await this.projectManager.createFile(
                        spriteHandle,
                        projectFileNames.targetBlocks,
                        JSON.stringify(target.blocks),
                    );
                }
            }
            const targetNames = await this.projectManager.listAllFileName(folder);
            if (!targetNames) sendError({ text: 'vm:err.fs.cannotFoundTargets' });
            else
                // 删除不应有的target
                for (const targetName of targetNames)
                    if (!allTargetNames.includes(targetName))
                        await this.projectManager.removeFile(folder, targetName);
        };
        const saveAssets = async (folder: DirectoryHandle) => {
            const assets = this.runtime.assets.listAssets();
            const metaJSON: Record<string, Omit<IAsset, 'blob'>> = {};
            for (const asset of assets) {
                // 去除blob
                const { blob, ...assetResult } = asset;
                metaJSON[asset.id] = {
                    ...assetResult,
                };
                // 生成blob
                await this.projectManager.createFile(
                    folder,
                    `${asset.id}.${asset.extension}`,
                    blob,
                );
            }
            await this.projectManager.createFile(
                folder,
                projectFileNames.assetsMeta,
                JSON.stringify(metaJSON),
            );
        };

        const moduleHandle = await this.projectManager.createFolder(
            this.projectManager.folderHandle,
            'modules',
        );
        if (!moduleHandle) {
            sendError({ text: 'vm:err.fs.moduleHandleLost' });
            return;
        }
        const entityHandle = await this.projectManager.createFolder(
            this.projectManager.folderHandle,
            'entitys',
        );
        if (!entityHandle) {
            sendError({ text: 'vm:err.fs.entityHandleLost' });
            return;
        }
        const assetHandle = await this.projectManager.createFolder(
            this.projectManager.folderHandle,
            'assets',
        );
        if (!assetHandle) {
            sendError({ text: 'vm:err.fs.assetHandleLost' });
            return;
        }
        await saveAssets(assetHandle);

        await saveTargets('entity', entityHandle);
        await saveTargets('module', moduleHandle);

        const entitysFolder = this.runtime.folders.get('entity') ?? [];
        const modulesFolder = this.runtime.folders.get('module') ?? [];

        const projectMeta: IProjectMetaJSON = {
            projectSaveVersion: 1,
            meta: this.runtime.settings.projectMeta,
            folders: {
                entity: entitysFolder,
                module: modulesFolder,
            },
            addonState: addonManager.getProjectAddonState(),
        };

        await this.projectManager.createFile(
            this.projectManager.folderHandle,
            projectFileNames.meta,
            JSON.stringify(projectMeta),
        );
    }

    async saveProjectAs() {
        // 重新选择文件夹，然后保存到新位置
        await this.projectManager.selectFolder();
        await this.saveProject();
    }

    async initProject() {
        // TODO: 改进进入机制
        const checkResult = await this.projectManager.checkProjectCanSave();
        if (!checkResult.pass) {
            if (checkResult.error === allProjectCheckError.FOLDER_NOT_EMPTY) {
                const userWantRemoveAllFile = await new Promise(resolve => {
                    void modal.open(ConfirmModal, {
                        message: t('vm:project.removeAllFileAsk'),
                        callback: (result: boolean) => {
                            resolve(result);
                        },
                    });
                });

                if (!userWantRemoveAllFile) throw new Error(checkResult.result);
                const fileNames = await this.projectManager.listAllFileName(
                    this.projectManager.folderHandle,
                );
                if (fileNames)
                    for (const name of fileNames) {
                        await this.projectManager.removeFile(
                            this.projectManager.folderHandle,
                            name,
                        );
                    }
            } else throw new Error(checkResult.result);
        }

        this.runtime.createTarget({
            name: 'Astratch',
            mode: 'entity',
        });
        await this.saveProject();
        // 进入编辑器
        this.isEditingProject = true;
        this.emit(events.CREATE_PROJECT);
    }

    async loadProject() {
        const emit = this.emit.bind(this);
        const loadTargets = async (folder: DirectoryHandle) => {
            const folderNames = (await this.projectManager.listAllFileName(folder)) || [];

            for (const folderName of folderNames) {
                const targetHandle = await this.projectManager.getFolder(folder, folderName);
                // 这个东西不是一个文件夹，证明它不合法，跳过
                if (!targetHandle) continue;

                const targetBlocksHandle = await this.projectManager.getFile(
                    targetHandle,
                    projectFileNames.targetBlocks,
                );
                const targetMetaHandle = await this.projectManager.getFile(
                    targetHandle,
                    projectFileNames.targetMeta,
                );

                if (targetBlocksHandle && targetMetaHandle) {
                    const targetBlocks = JSON.parse(
                        await (await targetBlocksHandle.getFile()).text(),
                    ) as ITargetBlocks;
                    const targetMeta = JSON.parse(
                        await (await targetMetaHandle.getFile()).text(),
                    ) as Partial<TTargetInfo>;

                    const targetInfo = {
                        ...targetMeta,
                        blocks: targetBlocks,
                    } as TTargetInfo;

                    this.runtime.targets.set(targetInfo.id, Target.fromJSON(targetInfo, emit));
                }
            }
        };
        const loadAssets = async (folder: DirectoryHandle) => {
            const assetsMetaOrigin = await this.projectManager.getFile(
                folder,
                projectFileNames.assetsMeta,
            );
            if (!assetsMetaOrigin) {
                sendError({ text: 'vm:err.assets.metaLost' });
                return;
            }
            const assetMetaText = await (await assetsMetaOrigin.getFile()).text();
            const assetsMeta = JSON.parse(assetMetaText) as Record<string, Omit<IAsset, 'blob'>>;

            const assetsToLoad = Object.values(assetsMeta);

            await Promise.allSettled(
                assetsToLoad.map(async asset => {
                    try {
                        const blobHandle = await this.projectManager.getFile(
                            folder,
                            `${asset.id}.${asset.extension}`,
                        );
                        if (!blobHandle) {
                            sendError(
                                {
                                    text: 'vm:err.assets.assetLost',
                                    params: { name: asset.name },
                                },
                                'warn',
                            );
                            return;
                        }
                        const blob = await (await blobHandle.getFile()).arrayBuffer();

                        // 校验哈希
                        if ((await this.runtime.assets.spawnHash(blob)) !== asset.hash) {
                            sendError(
                                {
                                    text: 'vm:err.assets.hashCompareFailed',
                                },
                                'warn',
                            );
                            return;
                        }

                        await this.runtime.assets.loadAsset({
                            ...asset,
                            blob,
                        });
                    } catch {
                        sendError(
                            { text: 'vm:err.assets.loadFailed', params: { name: asset.name } },
                            'warn',
                        );
                    }
                }),
            );
        };

        await this.selectProject();
        const assetsFolderHandle = await this.projectManager.getFolder(
            this.projectManager.folderHandle,
            'assets',
        );
        if (assetsFolderHandle) await loadAssets(assetsFolderHandle);
        // 获取元文件句柄
        const metaFileHandle = await this.projectManager.getFile(
            this.projectManager.folderHandle,
            projectFileNames.meta,
        );
        const entityHandle = await this.projectManager.getFolder(
            this.projectManager.folderHandle,
            'entitys',
        );
        if (entityHandle) await loadTargets(entityHandle);
        const moduleHandle = await this.projectManager.getFolder(
            this.projectManager.folderHandle,
            'modules',
        );
        if (moduleHandle) await loadTargets(moduleHandle);

        // 元数据
        if (!metaFileHandle) return false;
        const metaFile = await metaFileHandle.getFile();
        // {...}
        const metaFileContent = await metaFile.text();
        if (!metaFileContent) return false;
        try {
            const projectMeta = JSON.parse(metaFileContent) as IProjectMetaJSON;
            this.runtime.settings.setProjectMeta(projectMeta.meta);
            if (projectMeta.addonState) {
                await addonManager.loadProjectAddonState(projectMeta.addonState);
            }
            for (const mode of Object.values(TargetModes)) {
                this.runtime.folders.set(
                    mode,
                    projectMeta.folders[mode].map(folder => Folder.fromJSON(folder, emit)),
                );
            }
        } catch {
            return false;
        }

        this.isEditingProject = true;
        this.emit(events.CREATE_PROJECT);
        return true;
    }
}
