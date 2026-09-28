export { blocklyAdapter } from './blockly';

import * as Blockly from 'blockly/core';
import type * as IBlockly from 'blockly/core';
export { type IBlockly, Blockly };

export interface IBlocksState {
    languageVersion: number;
    blocks: IBlockly.serialization.blocks.State[];
}

export interface IWorkspaceState {
    blocks: IBlocksState;
    workspaceComments?: IBlockly.serialization.workspaceComments.State[];
}

export { OPCODES, type TOPCODES_VALUE } from './opcodes';

export { BlocksColor, type IBlocksColor, type IBlockColor } from './color';
