import { menubarManager } from '../..';
import { commandManager } from '../../../CommandManager';

export default () => {
    const editID = menubarManager.addCategory('edit', {
        id: 'astratch_menu_edit_edit',
        translate: true,
        nameID: 'astratch_menu_edit_edit',
    });
    menubarManager.addValue('edit', editID, {
        translate: true,
        nameID: 'edit_undo',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'edit_undo',
            descriptionID: 'edit_undo_description',
            author: 'The Astras Team',
            callback: () => {
                console.log('UNDO');
            },
        }).id,
    });
    menubarManager.addValue('edit', editID, {
        translate: true,
        nameID: 'edit_redo',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'edit_redo',
            descriptionID: 'edit_redo_description',
            author: 'The Astras Team',
            callback: () => {
                console.log('REDO');
            },
        }).id,
    });
    menubarManager.addValue('edit', editID, {
        isDivider: true,
    });
    // 创建目标
    menubarManager.addValue('edit', editID, {
        translate: true,
        nameID: 'edit_createTarget',
        children: [
            {
                translate: true,
                nameID: 'edit_create_target_entity',
                commandID: commandManager.addCommand({
                    translate: true,
                    nameID: 'edit_create_target_entity',
                    descriptionID: 'edit_create_target_entity_description',
                    author: 'The Astras Team',
                    callback: () => {
                        console.log('CREATE_ENTITY');
                    },
                }).id,
            },
            {
                translate: true,
                nameID: 'edit_create_target_module',
                commandID: commandManager.addCommand({
                    translate: true,
                    nameID: 'edit_create_target_module',
                    descriptionID: 'edit_create_target_module_description',
                    author: 'The Astras Team',
                    callback: () => {
                        console.log('CREATE_MODULE');
                    },
                }).id,
            },
        ],
    });
    // 添加文件夹
    menubarManager.addValue('edit', editID, {
        translate: true,
        nameID: 'edit_addFolder',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'edit_addFolder',
            descriptionID: 'edit_addFolder_description',
            author: 'The Astras Team',
            callback: () => {
                console.log('ADD_FOLDER');
            },
        }).id,
    });
    menubarManager.addValue('edit', editID, {
        isDivider: true,
    });
    // 删除选择的目标
    menubarManager.addValue('edit', editID, {
        translate: true,
        nameID: 'edit_deleteSelectedTarget',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'edit_deleteSelectedTarget',
            descriptionID: 'edit_deleteSelectedTarget_description',
            author: 'The Astras Team',
            callback: () => {
                console.log('DELETE_TARGET');
            },
        }).id,
    });
};
