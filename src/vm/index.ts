/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import Runtime from './runtime/runtime';
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
    type folderType,
    type IProjectMetaJSON,
    type ITargetBlocks,
    TargetModes,
    type ITarget,
} from '../types/vm';
import { ProjectManager } from './project';
import { t } from 'i18next';
import { modal } from '../components/Modal/modal';
import { ConfirmModal } from '../components/modal_confirm';
import { sendError } from '../utils/debug';

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
        const saveTargets = async (mode: TTargetMode, folder: folderType) => {
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
                    const targetExpectBlocks = Object.fromEntries(
                        Object.entries(target).filter(targetInfo => targetInfo[0] !== 'blocks'),
                    );
                    await this.projectManager.createFile(
                        spriteHandle,
                        projectFileNames.targetMeta,
                        JSON.stringify(targetExpectBlocks),
                    );
                    await this.projectManager.createFile(
                        spriteHandle,
                        projectFileNames.targetBlocks,
                        JSON.stringify(target.blocks),
                    );
                }
            }
            const targetNames = await this.projectManager.listAllFileName(folder);
            if (!targetNames) sendError(t('fs.error.cannotFoundTargets'));
            else
                // 删除不应有的target
                for (const targetName of targetNames)
                    if (!allTargetNames.includes(targetName))
                        await this.projectManager.removeFile(folder, targetName);
        };

        const checkResult = await this.projectManager.checkProjectCanSave();
        if (!checkResult.pass) sendError(checkResult.result, 'error');

        // TODO: 资源
        await this.projectManager.createFolder(this.projectManager.folderHandle, 'assets');

        const objectHandle = await this.projectManager.createFolder(
            this.projectManager.folderHandle,
            'objects',
        );
        if (!objectHandle) sendError(t('fs.error.objectHandleLost'));
        else await saveTargets('object', objectHandle);

        const moduleHandle = await this.projectManager.createFolder(
            this.projectManager.folderHandle,
            'modules',
        );
        if (!moduleHandle) sendError(t('fs.error.moduleHandleLost'));
        else await saveTargets('module', moduleHandle);

        const objectsFolder = this.runtime.fs.get('object') ?? [];
        const modulesFolder = this.runtime.fs.get('module') ?? [];

        const projectMeta: IProjectMetaJSON = {
            projectSaveVersion: 1,
            meta: this.runtime.settings.projectMeta,
            folders: {
                object: objectsFolder,
                module: modulesFolder,
            },
        };

        await this.projectManager.createFile(
            this.projectManager.folderHandle,
            projectFileNames.meta,
            JSON.stringify(projectMeta),
        );
    }

    async initProject() {
        // TODO: 改进进入机制
        const checkResult = await this.projectManager.checkProjectCanSave();
        if (!checkResult.pass) {
            if (checkResult.error === allProjectCheckError.FOLDER_NOT_EMPTY) {
                const userWantRemoveAllFile = await new Promise(resolve => {
                    void modal.open(ConfirmModal, {
                        message: t('vm:project.removeAllFileAsk'),
                        callback: result => {
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
            mode: 'object',
        });
        await this.saveProject();
        // 进入编辑器
        this.isEditingProject = true;
        this.emit(events.CREATE_PROJECT);
    }

    async loadProject() {
        const loadTargets = async (folder: folderType) => {
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
                    ) as Partial<ITarget>;

                    const targetInfo = {
                        ...targetMeta,
                        blocks: targetBlocks,
                    } as ITarget;

                    this.runtime.targets.set(targetInfo.id, targetInfo);
                }
            }
        };

        await this.selectProject();
        // 获取元文件句柄
        const metaFileHandle = await this.projectManager.getFile(
            this.projectManager.folderHandle,
            projectFileNames.meta,
        );
        const objectHandle = await this.projectManager.getFolder(
            this.projectManager.folderHandle,
            'objects',
        );
        if (objectHandle) await loadTargets(objectHandle);
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
            for (const mode of Object.values(TargetModes)) {
                this.runtime.fs.set(mode, projectMeta.folders[mode]);
            }
        } catch {
            return false;
        }

        this.isEditingProject = true;
        this.emit(events.CREATE_PROJECT);
        return true;
    }
}
