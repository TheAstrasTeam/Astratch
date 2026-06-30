import Runtime from './runtime/runtime';
import Settings from './settings/index';
import type { IVM, IRuntime, IVMSettings, IProjectManager } from '../types/vm';
import { ProjectManager } from './project';
import { t } from 'i18next';

/**
 * 虚拟机，管理整个ASH
 */
export class VM implements IVM {
    runtime: IRuntime;
    settings: IVMSettings;
    editingTargetID: string;
    projectManager: IProjectManager;

    constructor() {
        /**
         * 运行时
         */
        this.runtime = new Runtime();

        /**
         * 存储项目设置
         */
        this.settings = new Settings();

        /**
         * 当前的编辑目标ID
         */
        this.editingTargetID = '';

        /**
         * 管理项目目录
         */
        this.projectManager = new ProjectManager();
    }

    async selectProject() {
        await this.projectManager.selectFolder();
    }

    async initProject() {
        if (!this.projectManager.folderHandle)
            throw new Error('Please load/create a project first!');
        if (!(await this.projectManager.isEmpty(this.projectManager.folderHandle)))
            throw new Error('Please select a empty folder!');

        await this.projectManager.createFolder(this.projectManager.folderHandle, 'assets');
        await this.projectManager.createFolder(this.projectManager.folderHandle, 'sprites');
        await this.projectManager.createFile(
            this.projectManager.folderHandle,
            'projectMeta.json',
            JSON.stringify({
                id: crypto.randomUUID(),
                name: t('project'),
                author: ['you'],
            }),
        );
    }
}
