/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    events,
    type IFolder,
    type IEntityInfo,
    type IRuntime,
    type ITarget,
    type ITargetMeta,
    type IVM,
    type TTargetMode,
    type TTargetTree,
    type IVMSettings,
    type TViewportUpdateEvent,
    type IDataCreatedEvent,
} from '../../types/vm';
import Settings from './settings/index';
import type { IWorkspaceState } from '../../types/blocks';
import Blocks from './blocks';
import * as Blockly from 'blockly';
import { sendError } from '../../utils/debug';
import { t } from 'i18next';
import { spawnRandomString } from '../../utils/ash-string';

/**
 * 运行时，管理关于项目的东西
 */
class Runtime implements IRuntime {
    vm: IVM;
    blocks: Blocks;
    settings: IVMSettings;
    targets: Map<string, ITarget>;
    DEFAULT_TARGETINFO: ITarget;
    editingTargetID: string;
    DEFAULT_ENTITYINFO: IEntityInfo;
    folders: Map<TTargetMode, IFolder[]>;

    private updateView(data: TViewportUpdateEvent) {
        const target = this.targets.get(this.editingTargetID);
        if (data.changed === 'position') {
            if (target) {
                target.viewX = data.x;
                target.viewY = data.y;
            }
        } else {
            if (target) {
                target.viewScale = data.scale;
            }
        }
    }

    constructor(vm: IVM) {
        this.vm = vm;
        /**
         * Blockly/WebGPU 工作区管理
         */
        this.blocks = new Blocks(Blockly, vm);

        /**
         * 存储项目设置
         */
        this.settings = new Settings(this.vm);

        /**
         * Targets
         */
        this.targets = new Map();

        /**
         * 文件夹系统
         */
        this.folders = new Map();
        // 初始化
        this.folders.set('entity', []);
        this.folders.set('module', []);

        /**
         * 对于实体额外的info
         */
        this.DEFAULT_ENTITYINFO = {
            size: 100,
            direction: 90,
            currentCostume: 0,
            effects: {
                brightness: 0,
                color: 0,
                fisheye: 0,
                ghost: 0,
                mosaic: 0,
                pixelate: 0,
                whirl: 0,
            },
            volume: 100,
            x: 0,
            y: 0,
        };

        /**
         * 默认的Target
         */
        this.DEFAULT_TARGETINFO = {
            name: '',
            // id 会在创建项目时自动创建
            id: '',
            blocks: {
                _workspace: {
                    blocks: {
                        languageVersion: 0,
                        blocks: [],
                    },
                },
                _script: [],
            },
            comments: {},
            parentID: null,
            mode: 'entity',
            viewX: 0,
            viewY: 0,
            viewScale: 1,
            links: [],
            data: new Map(),
        };

        /**
         * 当前的编辑目标ID
         */
        this.editingTargetID = '';

        // 监听视口更改并将其更新到target meta
        // VIEWPORT_VIEW 发来的数据总会为 TViewportUpdateEvent
        // 但是我太懒了所以类型总是object，所以直接as了
        this.vm.on(events.VIEWPORT_VIEW, this.updateView.bind(this) as (data: object) => void);
    }

    createTarget(meta: ITargetMeta, switchTo = true) {
        // TODO: 处理Data
        const id = meta.id ?? crypto.randomUUID();
        let finalMeta = {
            // 直接 this.DEFAULT_TARGETINFO 会造成浅拷贝
            ...structuredClone(this.DEFAULT_TARGETINFO),
            name: meta.name ?? this.DEFAULT_TARGETINFO.name,
            parentID: meta.parent ?? this.DEFAULT_TARGETINFO.parentID,
            mode: meta.mode ?? this.DEFAULT_TARGETINFO.mode,
            id,
        };
        if (finalMeta.mode === 'entity')
            finalMeta = {
                ...finalMeta,
                ...this.DEFAULT_ENTITYINFO,
            };
        this.targets.set(id, finalMeta);

        this.vm.emit(events.UPDATE_PROJECT);
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
        if (switchTo) this.switchTarget(id);
        return id;
    }

    switchTarget(id: string) {
        this.editingTargetID = id;
        this.vm.emit(events.SWITCH_TARGET);
    }

    getTargetByID(id: string) {
        return this.targets.get(id);
    }

    setTargetBlock(targetID: string, state: IWorkspaceState) {
        const target = this.getTargetByID(targetID);
        if (!target) throw new Error(`Not found target "${targetID}" in project.`);

        target.blocks._workspace = state;
        this.vm.emit(events.UPDATE_PROJECT);
    }

    getFolderByID(mode: TTargetMode, id: string) {
        return this.folders.get(mode)?.find(folder => folder.id === id) ?? null;
    }

    addFolder(mode: TTargetMode, meta: IFolder) {
        if (this.folders.get(mode)?.find(folder => folder.id === meta.id))
            sendError(t('err.fs.alreadyExist'));
        this.folders.get(mode)?.push(meta);
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    getFolderParent(mode: TTargetMode, id: string) {
        const folder = this.folders.get(mode)?.find(folder => folder.id === id);
        if (folder) {
            return this.folders.get(mode)?.find(item => item.id === folder.parentID) ?? null;
        } else return null;
    }

    setFolderName(mode: TTargetMode, id: string, name: string) {
        const folder = this.folders.get(mode)?.find(folder => folder.id === id);
        if (folder) folder.name = name;
        else sendError(t('err.fs.noExist'));
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    setFolderColor(mode: TTargetMode, id: string, color: string) {
        const folder = this.folders.get(mode)?.find(folder => folder.id === id);
        if (folder) folder.color = color;
        else sendError(t('err.fs.noExist'));
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    getFolderChildren(mode: TTargetMode, id: string | null) {
        const result: IFolder[] = [];
        this.folders.get(mode)?.forEach(folder => {
            if (folder.parentID === id) {
                result.push(folder);
            }
        });
        return result;
    }

    getFolderDescendants(mode: TTargetMode, id: string | null) {
        const result: IFolder[] = [];
        this.folders.get(mode)?.forEach(folder => {
            if (folder.parentID === id) {
                result.push(folder);
                result.push(...this.getFolderDescendants(mode, folder.id));
            }
        });
        return result;
    }

    removeFolder(mode: TTargetMode, id: string) {
        const folders = this.folders.get(mode);
        if (folders) {
            const childrenIDs = this.getFolderDescendants(mode, id).map(folder => folder.id);
            this.folders.set(
                mode,
                folders.filter(folder => folder.id !== id && !childrenIDs.includes(folder.id)),
            );
            this.targets.forEach(target => {
                if (childrenIDs.includes(target.parentID ?? '') || target.parentID === id) {
                    this.removeTarget(target.id);
                }
            });
        }
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    generateTargetsTree(mode: TTargetMode) {
        const collectFoldersAndTargets = (id: string | null, mode: TTargetMode) => {
            const result: TTargetTree = [];
            this.getFolderChildren(mode, id).forEach(folder => {
                const targets: (ITarget & { type: string })[] = [];
                this.targets.forEach(target => {
                    if (target.parentID === folder.id) targets.push({ ...target, type: 'target' });
                });
                result.push({
                    ...folder,
                    children: [...collectFoldersAndTargets(folder.id, mode), ...targets],
                    type: 'folder',
                });
            });
            return result;
        };
        const result = [];
        // 先加入顶层，因为 `collectFoldersAndTargets` 并不处理最顶层的元素
        // 它只处理子元素
        this.targets.forEach(target => {
            if (target.parentID === null && target.mode === mode)
                result.push({ ...target, type: 'target' });
        });
        result.push(...collectFoldersAndTargets(null, mode));
        return result;
    }

    removeTarget(id: string) {
        const success = this.targets.delete(id);
        if (success) {
            this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
            return success;
        }
        return false;
    }

    moveTarget(mode: TTargetMode, targetID: string, newParentID: string | null) {
        const target = this.getTargetByID(targetID);
        if (!target) return false;
        if (newParentID && !this.getFolderByID(mode, newParentID)) {
            sendError(t('vm:err.moveTarget.folderNotFound', { id: newParentID }), 'warn');
            return false;
        }
        target.parentID = newParentID;
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
        return true;
    }

    moveFolder(mode: TTargetMode, folderID: string, newParentID: string | null) {
        const folder = this.getFolderByID(mode, folderID);
        if (newParentID)
            if (!this.getFolderByID(mode, newParentID)) {
                sendError(
                    t('vm:err.moveTarget.parentUndefined', {
                        id: newParentID,
                    }),
                    'warn',
                );
                return false;
            }
        if (folder) {
            if (folder.id === newParentID) {
                sendError(t('vm:err.moveFolder.inSelf'), 'warn');
                return false;
            }
            if (
                this.getFolderDescendants(mode, folderID).findIndex(
                    folder => folder.id === newParentID,
                ) !== -1 &&
                newParentID !== null
            ) {
                sendError(t('vm:err.moveFolder.inSelf'), 'warn');
                return false;
            }
            folder.parentID = newParentID;
            this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
            return true;
        } else return false;
    }

    linkTarget(targetID: string, linkTargetID: string) {
        if (targetID === linkTargetID) {
            sendError(t('vm:err.link.linkSelf'), 'warn');
            return false;
        }
        const selectedTarget = this.getTargetByID(targetID);
        const linkTarget = this.getTargetByID(linkTargetID);
        if (!(selectedTarget && linkTarget)) {
            sendError(t('vm:err.link.undefined'), 'warn');
            return false;
        }
        if (linkTarget.mode === 'entity') {
            sendError(t('vm:err.link.tryToLinkEntity'), 'warn');
            return false;
        }

        selectedTarget.links.push(linkTargetID);
        // 这没有修改结构
        this.vm.emit(events.UPDATE_PROJECT);
        return true;
    }

    renameTarget(targetID: string, newName: string) {
        const target = this.getTargetByID(targetID);
        if (!target) {
            sendError(t('vm:err.target.undefined'), 'warn');
            return false;
        }

        target.name = newName;
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
        return true;
    }

    renameFolder(mode: TTargetMode, folderID: string, newName: string) {
        const folder = this.getFolderByID(mode, folderID);
        if (!folder) {
            sendError(t('vm:err.target.undefined'), 'warn');
            return false;
        }

        folder.name = newName;
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
        return true;
    }

    createData(targetID: string, name: string, data: unknown, isPrivate = false, isConst = false) {
        const target = this.getTargetByID(targetID);
        if (!target) {
            sendError(t('vm:err.target.undefined'));
            return '';
        }
        target.data.forEach(targetData => {
            if (targetData.name === name) sendError(t('vm:err.variable.nameExisting'));
        });
        const id = spawnRandomString();
        target.data.set(id, {
            id,
            name,
            data,
            isPrivate,
            isConst,
        });
        this.vm.emit(events.UPDATE_PROJECT);
        this.vm.emit(events.CREATE_DATA, {
            targetID,
            dataID: id,
        });
        return id;
    }

    getData(targetID: string, dataID: string) {
        const target = this.getTargetByID(targetID);
        if (!target) {
            sendError(t('vm:err.target.undefined'), 'warn');
            return null;
        }
        const data = target.data.get(dataID);
        if (!data) {
            sendError(t('vm:err.variable.undefined'), 'warn');
            return null;
        }
        return data;
    }
}

export default Runtime;
