import type { IEvents } from 'astratch-core';
import { type IVMEventsType } from '../vm';
import { Targets } from './Targets';
import * as Comlink from 'comlink';

interface IProjectMeta {
    name: string;
    id: string;
    author: string[];
    // config: {

    // }
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
