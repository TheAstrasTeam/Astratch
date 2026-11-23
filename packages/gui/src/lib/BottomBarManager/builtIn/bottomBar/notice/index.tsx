import type { BottomBarSubmitItem } from '../../..';
import { commandManager } from '../../../../CommandManager';
import { NoticeButton } from './Renderer';

export default {
    translate: true,
    descriptionID: 'bottomBar.notice.description',
    Renderer: NoticeButton,
    commandID: commandManager.addCommand({
        translate: true,
        callback: () => {
            alert('OPEN_NOTICE');
        },
        author: 'The Astras Team',
        nameID: 'command.notice.name',
        descriptionID: 'command.notice.description',
    }).id,
    pos: 'right',
} satisfies BottomBarSubmitItem;
