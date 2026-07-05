import Runtime from './runtime/runtime';
import Settings from './settings/index';
import {
    type IVM,
    type IRuntime,
    type IVMSettings,
    type IProjectManager,
    type IEvent,
    type TEvents,
    projectFileNames,
    type IProjectMeta,
} from '../types/vm';
import { ProjectManager } from './project';


/**
 * 虚拟机，管理整个ASH
 */
export class VM implements IVM {
    runtime: IRuntime;
    settings: IVMSettings;
    editingTargetID: string;
    projectManager: IProjectManager;
    isEditingProject: boolean;

    /**
     * 事件
     */
    private events = new Map<string, IEvent[]>();

    constructor() {
        /**
         * 运行时
         */
        this.runtime = new Runtime(this);

        /**
         * 存储项目设置
         */
        this.settings = new Settings(this);

        /**
         * 当前的编辑目标ID
         */
        this.editingTargetID = '';

        /**
         * 管理项目目录
         */
        this.projectManager = new ProjectManager(this);

        /**
         * 正在编辑项目
         * 如果已经打开了一个项目，则返回true
         * 额，这个不是正在拖放积木的编辑！
         */
        this.isEditingProject = false;
    }

    on(id: TEvents, callback: (data: object) => void, once = false) {
        if (!this.events.has(id)) this.events.set(id, []);
        const listeners = this.events.get(id);
        if (!listeners) return;
        if (listeners.some(e => e.callback === callback)) return;
        listeners.push({
            callback,
            once,
        });
    }

    off(id: TEvents, callback: (data: object) => void) {
        const listeners = this.events.get(id);
        if (!listeners) return;
        const index = listeners.findIndex(e => e.callback === callback);
        if (index !== -1) listeners.splice(index, 1);
    }

    emit(id: TEvents, data: object = {}) {
        this.events.get(id)?.forEach((event, index) => {
            event.callback?.(data);
            if (event.once) {
                this.events.get(id)?.splice(index, 1);
            }
        });
    }

    async selectProject() {
        await this.projectManager.selectFolder();
    }

    async saveProject() {
        if (!this.projectManager.folderHandle)
            throw new Error('Please load/create a project first!');
        if (!(await this.projectManager.isEmpty(this.projectManager.folderHandle)))
            throw new Error('Please select a empty folder!');

        await this.projectManager.createFolder(this.projectManager.folderHandle, 'assets');
        await this.projectManager.createFolder(this.projectManager.folderHandle, 'sprites');
        await this.projectManager.createFile(
            this.projectManager.folderHandle,
            projectFileNames.meta,
            JSON.stringify(this.settings.projectMeta),
        );
    }

    async initProject() {
        // todo: 改进进入机制
        this.runtime.createTarget({
            name: 'Astratch',
        });
        await this.saveProject();
    }

    async loadProject() {
        await this.selectProject();
        // 获取元文件句柄
        const metaFileHandle = await this.projectManager.getFile(
            this.projectManager.folderHandle,
            projectFileNames.meta,
        );
        // todo: 读取其它数据
    
        // 元数据
        if (!metaFileHandle) return false;
        const metaFile = await metaFileHandle.getFile();
        // {...}
        const metaFileContent = await metaFile.text();
        if (!metaFileContent) return false;
        try {
            const projectMeta = JSON.parse(metaFileContent) as Partial<IProjectMeta>;
            this.settings.setProjectMeta(projectMeta)
        } catch {
            return false;
        }

        return true;
    }
}
