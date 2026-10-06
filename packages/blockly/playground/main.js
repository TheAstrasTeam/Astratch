import { blocklyAdapter } from '../src/blockly';
import * as Blockly from 'blockly';
import { getDefaultToolbox } from '../src/toolbox/default/index';
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

const id = blocklyAdapter.addWorkspace(document.querySelector('#app'), undefined, {
    toolbox: getDefaultToolbox(),
});

Object.assign(window, {
    blockly: Blockly,
    workspace: blocklyAdapter.workspaces[id],
});
