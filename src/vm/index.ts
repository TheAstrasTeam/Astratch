import Runtime from "./runtime/runtime"
import Settings from "./settings/index"
import type { IVM, IRuntime, IVMSettings, IProjectManager } from "../types/vm"
import { ProjectManager } from "./projectManager";

/**
 * 虚拟机，管理整个AEN
 */
export class VM implements IVM {
    Runtime: IRuntime;
    Settings: IVMSettings;
    editingTargetID: string;
    ProjectManager: IProjectManager;

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

        /**
         * 管理项目目录
         */
        this.ProjectManager = new ProjectManager();
    }

    async selectProject(){
        await this.ProjectManager.selectFolder();
    }
}