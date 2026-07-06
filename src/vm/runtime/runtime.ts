import { events, type IRuntime, type ITarget, type ITargetMeta, type IVM } from '../../types/vm';
import type { IWorkspaceState } from '../../types/blocks';
import Blocks from '../blocks';
import * as Blockly from 'blockly';

/**
 * 运行时，管理关于项目的执行
 */
class Runtime implements IRuntime {
    vm: IVM;
    blocks: Blocks;
    targets: ITarget[];
    DEFAULT_TARGETINFO: ITarget;
    editingTargetID: string;

    constructor(vm: IVM) {
        this.vm = vm;
        /**
         * Blockly/WebGPU 工作区管理
         */
        this.blocks = new Blocks(Blockly, vm);

        /**
         * Targets
         */
        this.targets = [];

        /**
         * 默认的Target
         */
        this.DEFAULT_TARGETINFO = {
            name: '',
            size: 100,
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
         * 当前的编辑目标ID
         */
        this.editingTargetID = '';
    }

    createTarget(Meta: ITargetMeta, switchTo = true) {
        // todo: 处理Data
        const id = Meta.id ?? crypto.randomUUID();
        this.targets.push({
            // 直接 this.DEFAULT_TARGETINFO 会造成浅拷贝
            ...structuredClone(this.DEFAULT_TARGETINFO),
            name: Meta.name ?? this.DEFAULT_TARGETINFO.name,
            id,
        });

        this.vm.emit(events.UPDATE_PROJECT);
        if (switchTo) this.switchTarget(id);
    }

    switchTarget(id: string) {
        this.editingTargetID = id;
        this.vm.emit(events.SWITCH_TARGET);
    }

    getTargetByID(id: string) {
        return this.targets.find(target => target.id === id)
    }

    setTargetBlock(targetID: string, state: IWorkspaceState) {
        const target = this.targets.find(target => target.id === targetID)
        if(!target) throw new Error(`Not found ${targetID} in project.`);

        target.blocks._workspace = state;
        this.vm.emit(events.UPDATE_PROJECT);
    }
}

export default Runtime;
