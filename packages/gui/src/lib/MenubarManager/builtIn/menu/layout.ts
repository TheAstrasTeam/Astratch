import { menubarManager } from '../..';
import { commandManager } from '../../../CommandManager';

export default () => {
    const layoutID = menubarManager.addCategory('layout', {
        translate: true,
        nameID: 'astratch_menu_layout_layout',
    });
    // 打开目标
    menubarManager.addValue('layout', layoutID, {
        translate: true,
        nameID: 'layout_openTarget',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'layout_openTarget',
            descriptionID: 'layout_openTarget_description',
            author: 'The Astras Team',
            callback: () => {
                alert('OPEN_TARGET');
            },
        }).id,
    });
    // 打开目标到新窗口
    menubarManager.addValue('layout', layoutID, {
        translate: true,
        nameID: 'layout_openTarget_newWindow',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'layout_openTarget_newWindow',
            descriptionID: 'layout_openTarget_newWindow_description',
            author: 'The Astras Team',
            callback: () => {
                alert('OPEN_TARGET_TO_NEW_WINDOW');
            },
        }).id,
    });
    // 移动正在选择的目标到新窗口
    menubarManager.addValue('layout', layoutID, {
        translate: true,
        nameID: 'layout_moveSelectedTarget_newWindow',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'layout_moveSelectedTarget_newWindow',
            descriptionID: 'layout_moveSelectedTarget_newWindow_description',
            author: 'The Astras Team',
            callback: () => {
                alert('MOVE_SELECTED_TARGET_TO_NEW_WINDOW');
            },
        }).id,
    });

    const uiID = menubarManager.addCategory('layout', {
        translate: true,
        nameID: 'astratch_menu_layout_ui',
    });
    // 显示/隐藏侧边栏
    // TODO: 显示/隐藏
    menubarManager.addValue('layout', uiID, {
        translate: true,
        nameID: 'layout_showSidebar',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'layout_showSidebar',
            descriptionID: 'layout_showSidebar_newWindow_description',
            author: 'The Astras Team',
            callback: () => {
                alert('SHOW_SIDEBAR');
            },
        }).id,
    });
    // 切换侧边栏到
    menubarManager.addValue('layout', uiID, {
        translate: true,
        nameID: 'layout_switchSidebarTo',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'layout_switchSidebarTo',
            descriptionID: 'layout_switchSidebarTo_newWindow_description',
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
        nameID: 'layout_showTargetsTree',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'layout_showTargetsTree',
            descriptionID: 'layout_showTargetsTree_newWindow_description',
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
        nameID: 'layout_moveWorkspaceCameraPos',
        commandID: commandManager.addCommand({
            translate: true,
            nameID: 'layout_moveWorkspaceCameraPos',
            descriptionID: 'layout_moveWorkspaceCameraPos_newWindow_description',
            author: 'The Astras Team',
            callback: () => {
                alert('MOVE_WORKSPACE_CAMERA');
            },
        }).id,
    });
};
