import { blocklyAdapter } from '../src/blockly';
import * as Blockly from 'blockly';
import { getDefaultToolbox } from '../src/toolbox/default/index';

const id = blocklyAdapter.addWorkspace(document.querySelector('#app'), undefined, {
    toolbox: getDefaultToolbox(),
});

Object.assign(window, {
    blockly: Blockly,
    workspace: blocklyAdapter.workspaces[id],
});
