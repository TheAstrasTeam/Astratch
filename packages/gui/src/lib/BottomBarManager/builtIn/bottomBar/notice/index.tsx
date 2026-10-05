import type { BottomBarSubmitItem } from '../../..';
import { commandManager } from '../../../../CommandManager';
import { NoticeButton } from './Renderer';

export default {
    translate: true,
    descriptionID: 'bottomBar_notice',
    Renderer: NoticeButton,
    commandID: commandManager.addCommand({
        translate: true,
        callback: () => {
            alert('OPEN_NOTICE');
        },
        author: 'The Astras Team',
        nameID: 'notice_name',
        descriptionID: 'notice_description',
    }).id,
    pos: 'right',
} satisfies BottomBarSubmitItem;
