import { t } from 'astratch-i18n';
import { menubarManager } from '../..';
import { StartPanel } from '../../../../components/tabs/start';
import { commandManager } from '../../../CommandManager';
import { tabsManager } from '../../../TabsManager';

export default () => {
    const helpID = menubarManager.addCategory('help', {
        id: 'astratch_menu_help_help',
        translate: true,
        nameID: 'menu.help.name',
    });
    menubarManager.addValue('help', helpID, {
        translate: true,
        nameID: 'command_help.openStartPanel.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_help.openStartPanel.name',
            descriptionID: 'command_help.openStartPanel.description',
            author: 'The Astras Team',
            callback: () => {
                tabsManager.insertElementToFocusingGroup({
                    Renderer: StartPanel,
                    name: t('gui:tab.start.name'),
                });
            },
        }).id,
    });
    menubarManager.addValue('help', helpID, {
        translate: true,
        nameID: 'command_help.about.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_help.about.name',
            descriptionID: 'command_help.about.description',
            author: 'The Astras Team',
            callback: () => {
                alert('OPEN_ABOUT');
            },
        }).id,
    });
    menubarManager.addValue('help', helpID, {
        translate: true,
        nameID: 'command_help.document.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_help.document.name',
            descriptionID: 'command_help.document.description',
            author: 'The Astras Team',
            callback: () => {
                alert('OPEN_DOCUMENT');
            },
        }).id,
    });
    menubarManager.addValue('help', helpID, {
        isDivider: true,
    });
    menubarManager.addValue('help', helpID, {
        translate: true,
        nameID: 'command_help.contributors.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_help.contributors.name',
            descriptionID: 'command_help.contributors.description',
            author: 'The Astras Team',
            callback: () => {
                alert('OPEN_CONTRIBUTORS');
            },
        }).id,
    });
    menubarManager.addValue('help', helpID, {
        translate: true,
        nameID: 'command_help.source.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_help.source.name',
            descriptionID: 'command_help.source.description',
            author: 'The Astras Team',
            callback: () => {
                window.open('https://github.com/TheAstrasTeam/Astratch');
            },
        }).id,
    });
};
