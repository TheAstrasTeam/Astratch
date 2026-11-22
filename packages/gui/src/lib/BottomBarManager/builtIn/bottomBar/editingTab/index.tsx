import type { BottomBarSubmitItem } from '../../..';
import { commandManager } from '../../../../CommandManager';
import { EditingTabHint } from './Renderer.tsx';

export default {
    translate: true,
    descriptionID: 'bottomBar_focusingTab',
    Renderer: EditingTabHint,
    commandID: commandManager.addCommand({
        translate: true,
        callback: () => {
            alert('CHANGE_FOCUSING_TAB');
        },
        author: 'The Astras Team',
        nameID: 'notice_name',
        descriptionID: 'notice_description',
    }).id,
    pos: 'left',
} satisfies BottomBarSubmitItem;
