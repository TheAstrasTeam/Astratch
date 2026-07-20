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
    events,
    allProjectCheckError,
} from '../types/vm';
import { ProjectManager } from './project';
import { t } from 'i18next';
import { modal } from '../components/Modal/modal';
import { ConfirmModal } from '../components/modal_confirm';

/**
 * 虚拟机，管理整个ASH
 */
export class VM implements IVM {
    runtime: IRuntime;
    settings: IVMSettings;
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
        const callbacks = this.events.get(id);
        if (!callbacks) return;

        for (let i = callbacks.length - 1; i >= 0; i--) {
            const event = callbacks[i];
            event.callback?.(data);
            if (event.once) {
                callbacks.splice(i, 1);
            }
        }
    }

    async selectProject() {
        await this.projectManager.selectFolder();
    }

    async saveProject() {
        const checkResult = await this.projectManager.checkProjectCanSave();
        if (!checkResult.pass) throw new Error(checkResult.result);

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
        const checkResult = await this.projectManager.checkProjectCanSave();
        if (!checkResult.pass) {
            if (checkResult.error === allProjectCheckError.FOLDER_NOT_EMPTY) {
                const userWantRemoveAllFile = await new Promise(resolve => {
                    void modal.open(ConfirmModal, {
                        message: t('vm:project.removeAllFileAsk'),
                        callback: result => {
                            resolve(result);
                        },
                    });
                });

                if (!userWantRemoveAllFile) throw new Error(checkResult.result);
                const fileNames = await this.projectManager.listAllFileName(
                    this.projectManager.folderHandle,
                );
                if (fileNames)
                    for (const name of fileNames) {
                        await this.projectManager.removeFile(
                            this.projectManager.folderHandle,
                            name,
                        );
                    }
            } else throw new Error(checkResult.result);
        }

        this.runtime.createTarget({
            name: 'Astratch',
        });
        await this.saveProject();
        // 进入编辑器
        this.isEditingProject = true;
        this.emit(events.CREATE_PROJECT);
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
            this.settings.setProjectMeta(projectMeta);
        } catch {
            return false;
        }

        return true;
    }
}
