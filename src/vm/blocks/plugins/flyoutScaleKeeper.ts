import type * as Blockly from 'blockly';

/**
 * 让Flyout的工具箱不在和工作区缩放一致
 * 这就和Scratch一样
 */
export class flyoutScaleKeeper {
    workspace: Blockly.WorkspaceSvg;
    flyoutEle: Blockly.IFlyout | null;
    constructor(workspace: Blockly.WorkspaceSvg) {
        this.workspace = workspace;
        this.flyoutEle = null;
    }

    /**
     * 初始化
     */
    init() {
        this.flyoutEle = this.workspace.getFlyout();
    }
}
