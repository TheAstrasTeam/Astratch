import { menubarManager } from '../..';
import { commandManager } from '../../../CommandManager';

export default () => {
    const helpID = menubarManager.addCategory('help', {
        id: 'astratch_menu_help_help',
        translate: true,
        nameID: 'astratch_menu_help_help',
    });
    menubarManager.addValue('help', helpID, {
        translate: true,
        nameID: 'help_about',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'help_about',
            descriptionID: 'help_about_description',
            author: 'The Astras Team',
            callback: () => {
                alert('OPEN_ABOUT');
            },
        }).id,
    });
    menubarManager.addValue('help', helpID, {
        translate: true,
        nameID: 'help_document',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'help_document',
            descriptionID: 'help_document_description',
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
        nameID: 'help_contributors',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'help_contributors',
            descriptionID: 'help_contributors_description',
            author: 'The Astras Team',
            callback: () => {
                alert('OPEN_CONTRIBUTORS');
            },
        }).id,
    });
    menubarManager.addValue('help', helpID, {
        translate: true,
        nameID: 'help_source',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'help_source',
            descriptionID: 'help_source_description',
            author: 'The Astras Team',
            callback: () => {
                window.open('https://github.com/TheAstrasTeam/Astratch');
            },
        }).id,
    });
};
