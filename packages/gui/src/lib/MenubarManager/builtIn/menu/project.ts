import { menubarManager } from '../..';
import { commandManager } from '../../../CommandManager';

export default () => {
    const projectID = menubarManager.addCategory('project', {
        id: 'astratch_menu_project_project',
        translate: true,
        nameID: 'astratch_menu_project_project',
    });
    // 新项目
    menubarManager.addValue('project', projectID, {
        translate: true,
        nameID: 'project_createProject',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'project_createProject',
            descriptionID: 'project_createProject_description',
            author: 'The Astras Team',
            callback: () => {
                console.log('CREATE_PROJECT');
            },
        }).id,
    });
    // 打开项目
    menubarManager.addValue('project', projectID, {
        translate: true,
        nameID: 'project_openProject',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'project_openProject',
            descriptionID: 'project_openProject_description',
            author: 'The Astras Team',
            callback: () => {
                console.log('OPEN_PROJECT');
            },
        }).id,
    });
    // 关闭项目
    menubarManager.addValue('project', projectID, {
        translate: true,
        nameID: 'project_closeProject',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'project_closeProject',
            descriptionID: 'project_closeProject_description',
            author: 'The Astras Team',
            callback: () => {
                console.log('CLOSE_PROJECT');
            },
        }).id,
    });
    menubarManager.addValue('project', projectID, {
        isDivider: true,
    });
    // 保存项目
    menubarManager.addValue('project', projectID, {
        translate: true,
        nameID: 'project_saveProject',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'project_saveProject',
            descriptionID: 'project_saveProject_description',
            author: 'The Astras Team',
            callback: () => {
                console.log('SAVE_PROJECT');
            },
        }).id,
    });
    const editorID = 'astratch_menu_project_editor' as const;
    menubarManager.addCategory('project', {
        id: editorID,
        translate: true,
        nameID: 'astratch_menu_project_editor',
    });

    // 设置
    menubarManager.addValue('project', editorID, {
        translate: true,
        nameID: 'editor_settings',
        children: [
            {
                translate: true,
                nameID: 'editor_settings_theme',
                commandID: commandManager.addCommand({
                    translate: true,
                    nameID: 'editor_settings_theme',
                    descriptionID: 'editor_settings_theme_description',
                    author: 'The Astras Team',
                    callback: () => {
                        console.log('OPEN_THEME_SETTINGS');
                    },
                }).id,
            },
            {
                translate: true,
                nameID: 'editor_settings_shortcuts',
                commandID: commandManager.addCommand({
                    translate: true,
                    nameID: 'editor_settings_shortcuts',
                    descriptionID: 'editor_settings_shortcuts_description',
                    author: 'The Astras Team',
                    callback: () => {
                        console.log('OPEN_SHORTCUTS_SETTINGS');
                    },
                }).id,
            },
            {
                isDivider: true,
            },
            {
                translate: true,
                nameID: 'editor_settings',
                commandID: commandManager.addCommand({
                    translate: true,
                    nameID: 'editor_settings',
                    descriptionID: 'editor_settings_description',
                    author: 'The Astras Team',
                    callback: () => {
                        console.log('OPEN_SETTINGS');
                    },
                }).id,
            },
        ],
    });
    // 退出编辑器
    menubarManager.addValue('project', editorID, {
        translate: true,
        nameID: 'editor_exit',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'editor_exit',
            descriptionID: 'editor_exit_description',
            author: 'The Astras Team',
            callback: () => {
                console.log('EXIT_EDITOR');
            },
        }).id,
    });
};
