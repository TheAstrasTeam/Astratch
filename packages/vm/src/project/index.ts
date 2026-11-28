import type { IEvents } from 'astratch-core';
import { type IVMEventsType } from '../vm';
import { Targets } from './Targets';
import * as Comlink from 'comlink';

export const PROJECT_CONFIG_KEYS = ['frameSync', 'allowChangeImportedVar'] as const;

interface IProjectMeta {
    name: string;
    id: string;
    author: string[];
    config: Record<(typeof PROJECT_CONFIG_KEYS)[number], boolean>;
}

class Project {
    meta: IProjectMeta;
    private Targets: Targets;
    private emit: IEvents<IVMEventsType>['emit'];

    constructor(vmEmit: IEvents<IVMEventsType>['emit'], projectMeta: IProjectMeta) {
        this.emit = vmEmit;
        this.Targets = new Targets(this.emit);
        this.meta = projectMeta;
    }

    get getTargets() {
        return Comlink.proxy(this.Targets);
    }
}

export { Project, type IProjectMeta };
export * from './Targets';
