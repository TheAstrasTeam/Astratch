import { menubarManager } from '../..';
import { commandManager } from '../../../CommandManager';

export default () => {
    const runID = menubarManager.addCategory('run', {
        id: 'astratch_menu_run_run',
        translate: true,
        nameID: 'menu_runMenu.run.name',
    });
    // 运行项目
    menubarManager.addValue('run', runID, {
        id: 'astratch_menu_run_run_runProject',
        translate: true,
        nameID: 'command_run.runProject.name',
        commandID: commandManager.addCommand({
            callback: () => {
                alert('RUN_PROJECT');
            },
            author: 'The Astras Team',
            translate: true,
            descriptionID: 'command_run.runProject.description',
            nameID: 'command_run.runProject.name',
        }).id,
    });
    // 暂停项目
    menubarManager.addValue('run', runID, {
        id: 'astratch_menu_run_run_pauseProject',
        translate: true,
        nameID: 'command_run.pauseProject.name',
        commandID: commandManager.addCommand({
            callback: () => {
                alert('PAUSE_PROJECT');
            },
            author: 'The Astras Team',
            translate: true,
            descriptionID: 'command_run.pauseProject.description',
            nameID: 'command_run.pauseProject.name',
        }).id,
    });
    // 继续项目
    menubarManager.addValue('run', runID, {
        id: 'astratch_menu_run_run_resumeProject',
        translate: true,
        nameID: 'command_run.resumeProject.name',
        commandID: commandManager.addCommand({
            callback: () => {
                alert('RESUME_PROJECT');
            },
            author: 'The Astras Team',
            translate: true,
            descriptionID: 'command_run.resumeProject.description',
            nameID: 'command_run.resumeProject.name',
        }).id,
    });
    // 停止项目
    menubarManager.addValue('run', runID, {
        id: 'astratch_menu_run_run_stopProject',
        translate: true,
        nameID: 'command_run.stopProject.name',
        commandID: commandManager.addCommand({
            callback: () => {
                alert('STOP_PROJECT');
            },
            author: 'The Astras Team',
            translate: true,
            descriptionID: 'command_run.stopProject.description',
            nameID: 'command_run.stopProject.name',
        }).id,
    });
    const debugID = 'astratch_menu_run_debug';
    menubarManager.addCategory('run', {
        id: debugID,
        translate: true,
        nameID: 'menu_runMenu.debug.name',
    });
    // 添加断点
    menubarManager.addValue('run', debugID, {
        id: 'astratch_menu_run_run_addBreakpointToSelectedBlock',
        translate: true,
        nameID: 'command_run.addBreakpointToSelectedBlock.name',
        commandID: commandManager.addCommand({
            callback: () => {
                alert('ADD_BREAKPOINT_TO_SELECTED_BLOCK');
            },
            author: 'The Astras Team',
            translate: true,
            descriptionID: 'command_run.addBreakpointToSelectedBlock.description',
            nameID: 'command_run.addBreakpointToSelectedBlock.name',
        }).id,
    });
    // 删除断点
    menubarManager.addValue('run', debugID, {
        id: 'astratch_menu_run_run_deleteBreakpointToSelectedBlock',
        translate: true,
        nameID: 'command_run.deleteBreakpointToSelectedBlock.name',
        commandID: commandManager.addCommand({
            callback: () => {
                alert('DELETE_BREAKPOINT_TO_SELECTED_BLOCK');
            },
            author: 'The Astras Team',
            translate: true,
            descriptionID: 'command_run.deleteBreakpointToSelectedBlock.description',
            nameID: 'command_run.deleteBreakpointToSelectedBlock.name',
        }).id,
    });
};
