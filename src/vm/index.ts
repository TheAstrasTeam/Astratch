import Runtime from "./runtime/runtime"
import Settings from "./settings/index"
import type { IVM, IRuntime, IVMSettings, IProjectManager } from "../types/vm"
import { ProjectManager } from "./projectManager";
import { t } from "i18next";
import Blocks from "./blocks";
import * as Blockly from 'blockly';

/**
 * 虚拟机，管理整个AEN
 */
export class VM implements IVM {
    Runtime: IRuntime;
    Settings: IVMSettings;
    editingTargetID: string;
    ProjectManager: IProjectManager;
    Blocks: Blocks;

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

        /**
         * Blockly/WebGPU 工作区管理
         */
        this.Blocks = new Blocks(Blockly);
    }

    async selectProject(){
        await this.ProjectManager.selectFolder();
    }

    async initProject(){
        if(!this.ProjectManager.folderHandle) 
            throw new Error('Please load/create a project first!');
        if(!await this.ProjectManager.isEmpty(this.ProjectManager.folderHandle)) 
            throw new Error('Please select a empty folder!');

        await this.ProjectManager.createFolder(this.ProjectManager.folderHandle, 'assets');
        await this.ProjectManager.createFolder(this.ProjectManager.folderHandle, 'sprites');
        await this.ProjectManager.createFile(this.ProjectManager.folderHandle, 'projectMeta.json', JSON.stringify({
                id: crypto.randomUUID(),
                name: t('project'),
                author: ['you']
            }
        ));
    }
}