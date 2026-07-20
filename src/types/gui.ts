export const guiThemes = {
    dark: 'dark',
    light: 'light',
} as const;
export type TGuiTheme = keyof typeof guiThemes;
export const DEFAULT_GUITHEME = 'dark' as const;

export const guiAccents = {
    blue: 'blue',
    pink: 'pink',
} as const;
export type TGuiAccent = keyof typeof guiAccents;
export const DEFAULT_GUIACCENT = 'blue' as const;

export const DEFAULT_GUITHEME_MAP = {
    gui: 'dark',
    accent: 'blue',
} as const;
export type TGuiThemeMap = typeof DEFAULT_GUITHEME_MAP;

export interface IGuiSettings {
    userName: string;
    guiTheme: TGuiThemeMap;
}

export const guiInterface = {
    /**
     * 程序一开始的 “开始” 页面
     * 关于“打开项目、新建项目”什么的
     * 就和IDE一样
     */
    START: 'start',
    /**
     * 编辑器，关于实际的编辑器界面
     * 相当于Scratch的界面
     */
    EDITOR: 'editor',
    /**
     * TBD:
     * 扩展界面
     * 事实上在Scratch中它是一个Modal
     * 而不是一个单纯的界面
     */
    EXTENSION: 'extension',
    /**
     * 创建项目
     */
    CREATE_PROJECT: 'create_project',
} as const;

export type IGuiInterface = (typeof guiInterface)[keyof typeof guiInterface];
export const defaultGuiInterface = guiInterface.START;

export const AllContextMenu = {
    MENUBAR_FILE: 'menubar_file',
    MENUBAR_FILE_NEW: 'menubar_file_new',
    MENUBAR_FILE_OPEN: 'menubar_file_open',
    MENUBAR_FILE_SAVE: 'menubar_file_save',
    MENUBAR_FILE_SAVE_AS: 'menubar_file_save_as',
    MENUBAR_FILE_EXIT: 'menubar_file_exit',
    MENUBAR_EDIT: 'menubar_edit',
    MENUBAR_EDIT_UNDO: 'menubar_edit_undo',
    MENUBAR_EDIT_REDO: 'menubar_edit_redo',
    MENUBAR_EDIT_RESTORE: 'menubar_edit_restore',
    MENUBAR_RUN: 'menubar_run',
    MENUBAR_RUN_RUN: 'menubar_run_run',
    MENUBAR_RUN_STOP: 'menubar_run_stop',
    MENUBAR_HELP: 'menubar_help',
    MENUBAR_HELP_ABOUT: 'menubar_help_about',
    MENUBAR_HELP_DOCS: 'menubar_help_docs',
    BLOCKLY: 'blockly',
};
export type TAllContextMenu = (typeof AllContextMenu)[keyof typeof AllContextMenu];
