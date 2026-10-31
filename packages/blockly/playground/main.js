import { blocklyAdapter } from '../src/blockly';
import * as Blockly from 'blockly';
import { getToolbox } from '../src/toolbox/index';
import { dark, light } from './theme';
import { OPCODES } from '../src';

const style = document.createElement('style');
// 默认是暗色
style.textContent = dark;
document.body.appendChild(style);

/** @type {HTMLSelectElement | null} */
const select = document.querySelector('#themeSelect');
if (select)
    select.onchange = () => {
        /** @type {'dark' | 'light'} */
        const value = select.value;
        if (value === 'dark') style.textContent = dark;
        else style.textContent = light;
    };

const handler = (type, data) => {
    console.debug(`Got event "${type}": `, data);
    if (type === 'GET_MENU' && data.type === 'entities') {
        data.handler([
            ['A', 'a'],
            ['B', 'b'],
        ]);
    }
    if (type === 'GET_ASSET') {
        data.handler('testHandle');
    }
    if (type === 'GET_ASSET_INFO') {
        data.handler({
            name: String('你好' + crypto.randomUUID()),
            type: 'text',
            raw: 'Hello World!',
        });
    }
};

const id = blocklyAdapter.addWorkspace(document.querySelector('#app'), handler, undefined, {
    toolbox: getToolbox(),
});

const workspace = blocklyAdapter.workspaces[id]

const spawnRandomBlocksButton = document.getElementById('spawnRandomBlocks');
if (spawnRandomBlocksButton) 
    spawnRandomBlocksButton.onclick = () => {
        for(let i=0;i<=50;i+=1) {
            const newBlock = workspace.workspaceSvg.newBlock(Object.values(OPCODES)[Math.floor(Math.random() * Object.values(OPCODES).length)]);
            newBlock.moveTo(new Blockly.utils.Coordinate(Math.random() * 1000,Math.random() * 1000));
            newBlock.initSvg();     
            newBlock.render();
        }
    }
const reloadWorkspace = document.getElementById('reloadWorkspace')
if (reloadWorkspace)
    reloadWorkspace.onclick = () => {
        const project = Blockly.serialization.workspaces.save(workspace.workspaceSvg);
        Blockly.serialization.workspaces.load(project, workspace.workspaceSvg)
    }

Object.assign(window, {
    blockly: Blockly,
    workspace,
});
