import { events, type IRuntime, type ITarget, type ITargetMeta, type IVM } from '../../types/vm';
import Blocks from '../blocks';
import * as Blockly from 'blockly';

/**
 * 运行时，管理关于项目的执行
 */
class Runtime implements IRuntime {
    vm: IVM;
    projectAuthor: string[];
    projectID: string;
    blocks: Blocks;
    targets: ITarget[];
    DEFAULT_TARGETINFO: ITarget;

    constructor(vm: IVM) {
        this.vm = vm;
        this.projectAuthor = [];
        this.projectID = '';

        /**
         * Blockly/WebGPU 工作区管理
         */
        this.blocks = new Blocks(Blockly);

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
            id: crypto.randomUUID(),
            blocks: {
                _blocks: {
                    languageVersion: 0,
                    blocks: [],
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
    }

    createTarget(Meta: ITargetMeta) {
        // todo: 处理Data
        this.targets.push({
            ...this.DEFAULT_TARGETINFO,
            name: Meta.name ?? this.DEFAULT_TARGETINFO.name,
            id: Meta.id ?? crypto.randomUUID(),
        });

        this.vm.emit(events.UPDATE_PROJECT);
    }
}

export default Runtime;
