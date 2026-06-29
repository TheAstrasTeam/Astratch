import type { IRuntime } from '../../types/vm';
import Blocks from '../blocks';
import * as Blockly from 'blockly';

/**
 * 运行时，管理关于项目的执行
 */
class Runtime implements IRuntime {
    projectAuthor: string[];
    projectID: string;
    blocks: Blocks;
    constructor() {
        this.projectAuthor = [];
        this.projectID = '';

        /**
         * Blockly/WebGPU 工作区管理
         */
        this.blocks = new Blocks(Blockly);
    }
}

export default Runtime;
