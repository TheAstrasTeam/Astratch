import { EventBus } from 'astratch-core';
import { Runtime, type IRuntime } from './runtime';

interface IVMEventsType {
    SWITCH_TARGET: {
        targetID: string;
    };
    UPDATE_PROJECT: {
        targetID: string;
    };
}

interface IVM {
    runtime: IRuntime;
}

class VM extends EventBus<IVMEventsType> implements IVM {
    runtime: IRuntime;
    constructor() {
        super();
        this.runtime = new Runtime();
    }
}

export { VM };
