import {
    events,
    TargetModes,
    type IFS,
    type IObjectInfo,
    type IRuntime,
    type ITarget,
    type ITargetMeta,
    type IVM,
    type TTargetMode,
    type TTargetTree,
    type IVMSettings,
} from '../../types/vm';
import Settings from './settings/index';
import type { IWorkspaceState } from '../../types/blocks';
import Blocks from './blocks';
import * as Blockly from 'blockly';
import { sendError } from '../../utils/debug';
import i18next from 'i18next';

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
    DEFAULT_OBJECTINFO: IObjectInfo;
    fs: Map<TTargetMode, IFS[]>;

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
        this.fs = new Map();
        // 初始化
        this.fs.set('object', []);
        this.fs.set('module', []);

        /**
         * 对于实体额外的info
         */
        this.DEFAULT_OBJECTINFO = {
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
            from: 'object',
        };

        /**
         * 当前的编辑目标ID
         */
        this.editingTargetID = '';
    }

    createTarget(meta: ITargetMeta, switchTo = true) {
        // TODO: 处理Data
        const id = meta.id ?? crypto.randomUUID();
        this.targets.set(id, {
            // 直接 this.DEFAULT_TARGETINFO 会造成浅拷贝
            ...structuredClone(this.DEFAULT_TARGETINFO),
            mode: meta.mode ?? TargetModes.OBJECT,
            name: meta.name ?? this.DEFAULT_TARGETINFO.name,
            parentID: meta.parent ?? this.DEFAULT_TARGETINFO.parentID,
            from: meta.from ?? this.DEFAULT_TARGETINFO.from,
            id,
        } as ITarget);

        this.vm.emit(events.UPDATE_PROJECT);
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
        if (switchTo) this.switchTarget(id);
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

    getFolderByID(id: string, pos: TTargetMode) {
        return this.fs.get(pos)?.find(folder => folder.id === id) ?? null;
    }

    addFolder(pos: TTargetMode, meta: IFS) {
        if (this.fs.get(pos)?.find(folder => folder.id === meta.id))
            sendError(i18next.t('error.fs.alreadyExist'));
        this.fs.get(pos)?.push(meta);
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    getFolderParent(pos: TTargetMode, id: string) {
        const folder = this.fs.get(pos)?.find(folder => folder.id === id);
        if (folder) {
            return this.fs.get(pos)?.find(folder => folder.id === folder.parentID) ?? null;
        } else return null;
    }

    setFolderName(pos: TTargetMode, id: string, name: string) {
        const folder = this.fs.get(pos)?.find(folder => folder.id === id);
        if (folder) folder.name = name;
        else sendError(i18next.t('error.fs.noExist'));
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    setFolderColor(pos: TTargetMode, id: string, color: string) {
        const folder = this.fs.get(pos)?.find(folder => folder.id === id);
        if (folder) folder.color = color;
        else sendError(i18next.t('error.fs.noExist'));
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    getFolderChildren(pos: TTargetMode, id: string | null) {
        const result: IFS[] = [];
        this.fs.get(pos)?.forEach(folder => {
            if (folder.parentID === id) {
                result.push(folder);
            }
        });
        return result;
    }

    getFolderDescendants(pos: TTargetMode, id: string | null) {
        const result: IFS[] = [];
        this.fs.get(pos)?.forEach(folder => {
            if (folder.parentID === id) {
                result.push(folder);
                result.push(...this.getFolderDescendants(pos, folder.id));
            }
        });
        return result;
    }

    removeFolderFolder(pos: TTargetMode, id: string) {
        const FS = this.fs.get(pos);
        if (FS) {
            const childrenIDs = this.getFolderDescendants(pos, id).map(folder => folder.id);
            this.fs.set(
                pos,
                FS.filter(folder => folder.id !== id && !childrenIDs.includes(folder.id)),
            );
            this.targets.forEach(target => {
                if (childrenIDs.includes(target.parentID ?? '')) this.removeTarget(target.id);
            });
        }
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    generateTargetsTree(pos: TTargetMode) {
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
            if (target.parentID === null && target.from === pos)
                result.push({ ...target, type: 'target' });
        });
        result.push(...collectFoldersAndTargets(null, pos));
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

    moveTarget(pos: TTargetMode, targetID: string, newParentID: string | null) {
        const target = this.targets.get(targetID);
        if (!target) return false;
        if (newParentID && !this.getFolderByID(newParentID, pos)) {
            sendError(`Not found folder "${newParentID}".`, 'warn');
            return false;
        }
        target.parentID = newParentID;
        this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
        return true;
    }

    moveFolder(pos: TTargetMode, folderID: string, newParentID: string | null) {
        const folder = this.getFolderByID(folderID, pos);
        if (newParentID)
            if (!this.getFolderByID(newParentID, pos)) {
                sendError(
                    i18next.t('gui:err.moveTarget.parentUndefined', {
                        id: newParentID,
                    }),
                    'warn',
                );
                return false;
            }
        if (folder) {
            if (folder.id === newParentID) {
                sendError(i18next.t('gui:err.moveFolder.inSelf'), 'warn');
                return false;
            }
            if (
                this.getFolderDescendants(pos, folderID).findIndex(
                    folder => folder.id === newParentID,
                ) !== -1 &&
                newParentID !== null
            ) {
                sendError(i18next.t('gui:err.moveFolder.inSelf'), 'warn');
                return false;
            }
            folder.parentID = newParentID;
            this.vm.emit(events.UPDATE_TARGET_STRUCTURE);
            return true;
        } else return false;
    }
}

export default Runtime;
