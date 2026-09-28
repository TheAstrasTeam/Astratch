import { menubarManager } from '../..';
import { commandManager } from '../../../CommandManager';

export default () => {
    const runID = menubarManager.addCategory('run', {
        id: 'astratch_menu_run_run',
        translate: true,
        nameID: 'menu_RunMenu_Run_title',
    });
    // 运行项目
    menubarManager.addValue('run', runID, {
        id: 'astratch_menu_run_run_runProject',
        translate: true,
        nameID: 'runtime_runProject',
        commandID: commandManager.addCommand({
            callback: () => {
                console.log('RUN_PROJECT');
            },
            author: 'The Astras Team',
            translate: true,
            descriptionID: 'runtime_runProject_description',
            nameID: 'runtime_runProject',
        }).id,
    });
    // 暂停项目
    menubarManager.addValue('run', runID, {
        id: 'astratch_menu_run_run_pauseProject',
        translate: true,
        nameID: 'runtime_pauseProject',
        commandID: commandManager.addCommand({
            callback: () => {
                console.log('PAUSE_PROJECT');
            },
            author: 'The Astras Team',
            translate: true,
            descriptionID: 'runtime_pauseProject_description',
            nameID: 'runtime_pauseProject',
        }).id,
    });
    // 继续项目
    menubarManager.addValue('run', runID, {
        id: 'astratch_menu_run_run_resumeProject',
        translate: true,
        nameID: 'runtime_resumeProject',
        commandID: commandManager.addCommand({
            callback: () => {
                console.log('RESUME_PROJECT');
            },
            author: 'The Astras Team',
            translate: true,
            descriptionID: 'runtime_resumeProject_description',
            nameID: 'runtime_resumeProject',
        }).id,
    });
    // 停止项目
    menubarManager.addValue('run', runID, {
        id: 'astratch_menu_run_run_stopProject',
        translate: true,
        nameID: 'runtime_stopProject',
        commandID: commandManager.addCommand({
            callback: () => {
                console.log('STOP_PROJECT');
            },
            author: 'The Astras Team',
            translate: true,
            descriptionID: 'runtime_stopProject_description',
            nameID: 'runtime_stopProject',
        }).id,
    });
    const debugID = 'astratch_menu_run_debug';
    menubarManager.addCategory('run', {
        id: debugID,
        translate: true,
        nameID: 'menu_RunMenu_Debug_title',
    });
    // 添加断点
    menubarManager.addValue('run', debugID, {
        id: 'astratch_menu_run_run_addBreakpointToSelectedBlock',
        translate: true,
        nameID: 'debug_addBreakpointToSelectedBlock',
        commandID: commandManager.addCommand({
            callback: () => {
                console.log('ADD_BREAKPOINT_TO_SELECTED_BLOCK');
            },
            author: 'The Astras Team',
            translate: true,
            descriptionID: 'debug_addBreakpointToSelectedBlock_description',
            nameID: 'debug_addBreakpointToSelectedBlock',
        }).id,
    });
    // 删除断点
    menubarManager.addValue('run', debugID, {
        id: 'astratch_menu_run_run_deleteBreakpointToSelectedBlock',
        translate: true,
        nameID: 'debug_deleteBreakpointToSelectedBlock',
        commandID: commandManager.addCommand({
            callback: () => {
                console.log('DELETE_BREAKPOINT_TO_SELECTED_BLOCK');
            },
            author: 'The Astras Team',
            translate: true,
            descriptionID: 'debug_deleteBreakpointToSelectedBlock_description',
            nameID: 'debug_deleteBreakpointToSelectedBlock',
        }).id,
    });
};
