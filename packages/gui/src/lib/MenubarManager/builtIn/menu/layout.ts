import { menubarManager } from '../..';
import { commandManager } from '../../../CommandManager';
import { isChildWindow } from '../../../../utils/window';
import { windowManager } from '../../../WindowManager';

export default () => {
    const layoutID = menubarManager.addCategory('layout', {
        translate: true,
        nameID: 'menu.layout.name',
    });
    // 打开目标
    menubarManager.addValue('layout', layoutID, {
        translate: true,
        nameID: 'command_layout.openTarget.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_layout.openTarget.name',
            descriptionID: 'command_layout.openTarget.description',
            author: 'The Astras Team',
            callback: () => {
                alert('OPEN_TARGET');
            },
        }).id,
    });
    // 打开新窗口
    menubarManager.addValue('layout', layoutID, {
        translate: true,
        nameID: 'command_layout.openNewWindow.name',
        isEnable: () => !isChildWindow,
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_layout.openNewWindow.name',
            descriptionID: 'command_layout.openNewWindow.description',
            author: 'The Astras Team',
            isEnable: () => !isChildWindow,
            callback: () => {
                void windowManager.newWindow().catch((error: unknown) => {
                    console.error(error);
                });
            },
        }).id,
    });
    // 打开目标到新窗口
    menubarManager.addValue('layout', layoutID, {
        translate: true,
        nameID: 'command_layout.openTargetInNewWindow.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_layout.openTargetInNewWindow.name',
            descriptionID: 'command_layout.openTargetInNewWindow.description',
            author: 'The Astras Team',
            callback: () => {
                alert('OPEN_TARGET_TO_NEW_WINDOW');
            },
        }).id,
    });
    // 移动正在选择的目标到新窗口
    menubarManager.addValue('layout', layoutID, {
        translate: true,
        nameID: 'command_layout.moveSelectedTargetToNewWindow.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_layout.moveSelectedTargetToNewWindow.name',
            descriptionID: 'command_layout.moveSelectedTargetToNewWindow.description',
            author: 'The Astras Team',
            callback: () => {
                alert('MOVE_SELECTED_TARGET_TO_NEW_WINDOW');
            },
        }).id,
    });

    const uiID = menubarManager.addCategory('layout', {
        translate: true,
        nameID: 'menu_layout.ui.name',
    });
    // 显示/隐藏侧边栏
    // TODO: 显示/隐藏
    menubarManager.addValue('layout', uiID, {
        translate: true,
        nameID: 'command_layout.showSidebar.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_layout.showSidebar.name',
            descriptionID: 'command_layout.showSidebar.description',
            author: 'The Astras Team',
            callback: () => {
                alert('SHOW_SIDEBAR');
            },
        }).id,
    });
    // 切换侧边栏到
    menubarManager.addValue('layout', uiID, {
        translate: true,
        nameID: 'command_layout.switchSidebarTo.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_layout.switchSidebarTo.name',
            descriptionID: 'command_layout.switchSidebarTo.description',
            author: 'The Astras Team',
            callback: () => {
                alert('SWITCH_SIDEBAR');
            },
        }).id,
    });
    menubarManager.addValue('layout', uiID, {
        isDivider: true,
    });
    // 展开/收起目标树
    // TODO: 展开/收起
    menubarManager.addValue('layout', uiID, {
        translate: true,
        nameID: 'command_layout.showTargetsTree.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_layout.showTargetsTree.name',
            descriptionID: 'command_layout.showTargetsTree.description',
            author: 'The Astras Team',
            callback: () => {
                alert('SHOW_TARGETS_TREE');
            },
        }).id,
    });
    menubarManager.addValue('layout', uiID, {
        isDivider: true,
    });

    // 移动工作区的镜头位置
    menubarManager.addValue('layout', uiID, {
        translate: true,
        nameID: 'command_layout.moveWorkspaceCameraPos.name',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'command_layout.moveWorkspaceCameraPos.name',
            descriptionID: 'command_layout.moveWorkspaceCameraPos.description',
            author: 'The Astras Team',
            callback: () => {
                alert('MOVE_WORKSPACE_CAMERA');
            },
        }).id,
    });
};
