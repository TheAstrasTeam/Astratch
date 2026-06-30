export const guiThemes = {
    dark: 'dark',
    light: 'light',
} as const;
export type guiTheme = keyof typeof guiThemes;
export const DEFAULT_GUITHEME = 'dark' as const;
export interface IGuiSettings {
    userName: string;
    guiTheme: guiTheme;
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
     * 加载界面
     */
    LOADING: 'loading',
} as const;

export type IGuiInterface = (typeof guiInterface)[keyof typeof guiInterface];
export const defaultGuiInterface = guiInterface.START;
