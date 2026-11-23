import { menubarManager } from '../..';
import { commandManager } from '../../../CommandManager';

export default () => {
    const projectID = menubarManager.addCategory('project', {
        id: 'astratch_menu_project_project',
        translate: true,
        nameID: 'menu.project.name',
    });
    // 新项目
    menubarManager.addValue('project', projectID, {
        translate: true,
        nameID: 'command_project.createProject.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_project.createProject.name',
            descriptionID: 'command_project.createProject.description',
            author: 'The Astras Team',
            callback: () => {
                alert('CREATE_PROJECT');
            },
        }).id,
    });
    // 打开项目
    menubarManager.addValue('project', projectID, {
        translate: true,
        nameID: 'command_project.openProject.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_project.openProject.name',
            descriptionID: 'command_project.openProject.description',
            author: 'The Astras Team',
            callback: () => {
                alert('OPEN_PROJECT');
            },
        }).id,
    });
    // 关闭项目
    menubarManager.addValue('project', projectID, {
        translate: true,
        nameID: 'command_project.closeProject.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_project.closeProject.name',
            descriptionID: 'command_project.closeProject.description',
            author: 'The Astras Team',
            callback: () => {
                alert('CLOSE_PROJECT');
            },
        }).id,
    });
    menubarManager.addValue('project', projectID, {
        isDivider: true,
    });
    // 保存项目
    menubarManager.addValue('project', projectID, {
        translate: true,
        nameID: 'command_project.saveProject.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_project.saveProject.name',
            descriptionID: 'command_project.saveProject.description',
            author: 'The Astras Team',
            callback: () => {
                alert('SAVE_PROJECT');
            },
        }).id,
    });
    const editorID = 'astratch_menu_project_editor' as const;
    menubarManager.addCategory('project', {
        id: editorID,
        translate: true,
        nameID: 'menu_project.editor.name',
    });

    // 设置
    menubarManager.addValue('project', editorID, {
        translate: true,
        nameID: 'command_project.settings.name',
        children: [
            {
                translate: true,
                nameID: 'command_project.themeSettings.name',
                commandID: commandManager.addCommand({
                    translate: true,
                    nameID: 'command_project.themeSettings.name',
                    descriptionID: 'command_project.themeSettings.description',
                    author: 'The Astras Team',
                    callback: () => {
                        alert('OPEN_THEME_SETTINGS');
                    },
                }).id,
            },
            {
                translate: true,
                nameID: 'command_project.shortcutSettings.name',
                commandID: commandManager.addCommand({
                    translate: true,
                    nameID: 'command_project.shortcutSettings.name',
                    descriptionID: 'command_project.shortcutSettings.description',
                    author: 'The Astras Team',
                    callback: () => {
                        alert('OPEN_SHORTCUTS_SETTINGS');
                    },
                }).id,
            },
            {
                isDivider: true,
            },
            {
                translate: true,
                nameID: 'command_project.settings.name',
                commandID: commandManager.addCommand({
                    translate: true,
                    nameID: 'command_project.settings.name',
                    descriptionID: 'command_project.settings.description',
                    author: 'The Astras Team',
                    callback: () => {
                        alert('OPEN_SETTINGS');
                    },
                }).id,
            },
        ],
    });
    // 退出编辑器
    menubarManager.addValue('project', editorID, {
        translate: true,
        nameID: 'command_project.exit.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_project.exit.name',
            descriptionID: 'command_project.exit.description',
            author: 'The Astras Team',
            callback: () => {
                alert('EXIT_EDITOR');
            },
        }).id,
    });
};
