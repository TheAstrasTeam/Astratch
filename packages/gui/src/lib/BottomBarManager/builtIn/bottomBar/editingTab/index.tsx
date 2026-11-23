import type { BottomBarSubmitItem } from '../../..';
import { commandManager } from '../../../../CommandManager';
import { EditingTabHint } from './Renderer.tsx';

export default {
    translate: true,
    descriptionID: 'bottomBar.focusingTab.name',
    Renderer: EditingTabHint,
    commandID: commandManager.addCommand({
        translate: true,
        callback: () => {
            alert('CHANGE_FOCUSING_TAB');
        },
        author: 'The Astras Team',
        nameID: 'command.focusingTab.name',
        descriptionID: 'command.focusingTab.description',
    }).id,
    pos: 'left',
} satisfies BottomBarSubmitItem;
