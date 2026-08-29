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
    type TTargetTreeNode,
    type IVMSettings,
    type TEmit,
    type TEvents,
    type TFolderInfo,
    type TTargetInfo,
    type TViewportUpdateEvent,
} from '../../types/vm/vm';
import Settings from './settings/index';
import Blocks from './blocks';
import * as Blockly from 'blockly';
import { sendError } from '../../utils/debug';
import { t } from 'i18next';
import Target from './target';
import Folder from './folder';

/**
 * 运行时，管理关于项目的东西
 *
 * 只做编排：集合存储、跨目标/文件夹的校验、事件分发；
 * 单个目标/文件夹自身的交互由 Target / Folder 结构体负责
 */
class Runtime implements IRuntime {
    vm: IVM;
    blocks: Blocks;
    settings: IVMSettings;
    targets: Map<string, ITarget>;
    DEFAULT_TARGETINFO: TTargetInfo;
    editingTargetID: string;
    DEFAULT_ENTITYINFO: IEntityInfo;
    folders: Map<TTargetMode, IFolder[]>;

    private emit: TEmit = (id: TEvents, data?: object) => {
        this.vm.emit(id, data);
    };

    private updateView(data: TViewportUpdateEvent) {
        this.getEditingTarget()?.setViewport(data);
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
            data: [],
            function: [],
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
        const target = Target.fromMeta(
            meta,
            this.DEFAULT_TARGETINFO,
            this.DEFAULT_ENTITYINFO,
            this.emit,
        );
        this.targets.set(target.id, target);

        this.vm.emit(events.UPDATE_PROJECT);
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
        if (switchTo) this.switchTarget(target.id);
        return target.id;
    }

    switchTarget(id: string) {
        this.editingTargetID = id;
        this.vm.emit(events.SWITCH_TARGET);
    }

    getTargetByID(id: string) {
        return this.targets.get(id);
    }

    getEditingTarget() {
        return this.getTargetByID(this.editingTargetID);
    }

    getFolderByID(mode: TTargetMode, id: string) {
        return this.folders.get(mode)?.find(folder => folder.id === id) ?? null;
    }

    addFolder(mode: TTargetMode, meta: TFolderInfo) {
        if (this.folders.get(mode)?.find(folder => folder.id === meta.id))
            sendError(t('err.fs.alreadyExist'));
        this.folders.get(mode)?.push(Folder.fromJSON(meta, this.emit));
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    getFolderParent(mode: TTargetMode, id: string) {
        const folder = this.folders.get(mode)?.find(folder => folder.id === id);
        if (folder) {
            return this.folders.get(mode)?.find(item => item.id === folder.parentID) ?? null;
        } else return null;
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
                const targets: (ITarget & { type: 'target' })[] = [];
                this.targets.forEach(target => {
                    if (target.parentID === folder.id) targets.push(target.cloneAsNode());
                });
                const folderNode = folder.cloneAsNode() as TTargetTreeNode;
                folderNode.children = [...collectFoldersAndTargets(folder.id, mode), ...targets];
                result.push(folderNode);
            });
            return result;
        };
        const result: TTargetTree = [];
        // 先加入顶层，因为 `collectFoldersAndTargets` 并不处理最顶层的元素
        // 它只处理子元素
        this.targets.forEach(target => {
            if (target.parentID === null && target.mode === mode) result.push(target.cloneAsNode());
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
        target.setParent(newParentID);
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
            folder.setParent(newParentID);
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

        selectedTarget.addLink(linkTargetID);
        return true;
    }
}

export default Runtime;
