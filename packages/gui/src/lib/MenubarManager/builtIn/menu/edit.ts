import { menubarManager } from '../..';
import { commandManager } from '../../../CommandManager';

export default () => {
    const editID = menubarManager.addCategory('edit', {
        id: 'astratch_menu_edit_edit',
        translate: true,
        nameID: 'menu.edit.name',
    });
    menubarManager.addValue('edit', editID, {
        translate: true,
        nameID: 'command_edit.undo.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_edit.undo.name',
            descriptionID: 'command_edit.undo.description',
            author: 'The Astras Team',
            callback: () => {
                alert('UNDO');
            },
        }).id,
    });
    menubarManager.addValue('edit', editID, {
        translate: true,
        nameID: 'command_edit.redo.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_edit.redo.name',
            descriptionID: 'command_edit.redo.description',
            author: 'The Astras Team',
            callback: () => {
                alert('REDO');
            },
        }).id,
    });
    menubarManager.addValue('edit', editID, {
        isDivider: true,
    });
    // 创建目标
    menubarManager.addValue('edit', editID, {
        translate: true,
        nameID: 'menu_edit.createTarget.name',
        children: [
            {
                translate: true,
                nameID: 'command_edit.createTargetEntity.name',
                commandID: commandManager.addCommand({
                    translate: true,
                    nameID: 'command_edit.createTargetEntity.name',
                    descriptionID: 'command_edit.createTargetEntity.description',
                    author: 'The Astras Team',
                    callback: () => {
                        alert('CREATE_ENTITY');
                    },
                }).id,
            },
            {
                translate: true,
                nameID: 'command_edit.createTargetModule.name',
                commandID: commandManager.addCommand({
                    translate: true,
                    nameID: 'command_edit.createTargetModule.name',
                    descriptionID: 'command_edit.createTargetModule.description',
                    author: 'The Astras Team',
                    callback: () => {
                        alert('CREATE_MODULE');
                    },
                }).id,
            },
        ],
    });
    // 添加文件夹
    menubarManager.addValue('edit', editID, {
        translate: true,
        nameID: 'command_edit.addFolder.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_edit.addFolder.name',
            descriptionID: 'command_edit.addFolder.description',
            author: 'The Astras Team',
            callback: () => {
                alert('ADD_FOLDER');
            },
        }).id,
    });
    menubarManager.addValue('edit', editID, {
        isDivider: true,
    });
    // 删除选择的目标
    menubarManager.addValue('edit', editID, {
        translate: true,
        nameID: 'command_edit.deleteSelectedTarget.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_edit.deleteSelectedTarget.name',
            descriptionID: 'command_edit.deleteSelectedTarget.description',
            author: 'The Astras Team',
            callback: () => {
                alert('DELETE_TARGET');
            },
        }).id,
    });
};
