import { blocklyAdapter } from '../src/blockly';
import * as Blockly from 'blockly';
import { getToolbox } from '../src/toolbox/index';
import { dark, light } from './theme';

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

Object.assign(window, {
    blockly: Blockly,
    workspace: blocklyAdapter.workspaces[id],
});
