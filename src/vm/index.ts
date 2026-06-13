import Runtime from "./runtime/runtime"
import Settings from "./settings/index"
import type { IFVM, IFRuntime, IFSettings } from "../typescript/interface"

/**
 * 虚拟机，管理整个AEN
 */
export class VM implements IFVM {
    Runtime: IFRuntime;
    Settings: IFSettings;
    editingTargetID: string;

    constructor() {
        /**
         * 运行时
         */
        this.Runtime = new Runtime();

        /**
         * 存储项目设置
         */
        this.Settings = new Settings();

        /**
         * 当前的编辑目标ID
         */
        this.editingTargetID = "";
    }
}