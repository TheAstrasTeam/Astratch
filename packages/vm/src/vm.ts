import { EventBus } from 'astratch-core';
import { Project, type IProjectMeta } from './project';
import * as Comlink from 'comlink';
import type { TTARGETS } from './project/Targets';

export * from './project';

interface IVMEventsType {
    SWITCH_TARGET: {
        targetID: string;
        mode: TTARGETS;
    };
    UPDATE_PROJECT: {
        targetID: string;
        mode: TTARGETS;
    };
    CREATE_TARGET: {
        targetID: string;
        mode: TTARGETS;
    };
    REMOVE_TARGET: {
        mode: TTARGETS;
        targetID: string;
    };
    MOVE_TARGET: {
        mode: TTARGETS;
        targetID: string;
        from: string | null;
        to: string | null;
    };
    RENAME_TARGET: {
        mode: TTARGETS;
        targetID: string;
    };

    ADD_PATH: {
        mode: TTARGETS;
        pathID: string;
    };
    DELETE_PATH: {
        mode: TTARGETS;
        pathID: string;
    };
}

class VM extends EventBus<IVMEventsType> {
    /**
     * ASH是单例的，因此有且只能有一个项目在同源编辑
     */
    private project: Project | undefined;

    /**
     * @param projectMeta 如果要自动创建项目
     */
    constructor(projectMeta?: IProjectMeta) {
        super();
        if (projectMeta) this.createProject(projectMeta);
    }

    /** 创建一个新项目 */
    createProject(projectMeta: IProjectMeta) {
        this.project = new Project(this.emit.bind(this), projectMeta);
    }

    isCreatedProject() {
        return !!this.project;
    }

    get getProject(): Project | undefined {
        return this.project ? Comlink.proxy(this.project) : undefined;
    }
}
const vm = new VM();
export { vm, type IVMEventsType, type VM };

try {
    (self as unknown as SharedWorkerGlobalScope).onconnect = event => {
        Comlink.expose(vm, event.ports[0]);
    };
} catch {
    console.warn('Self is undefined');
}
