import { Runtime, type IRuntime } from './runtime';

interface IVM {
    runtime: IRuntime;
}

class VM implements IVM {
    runtime: IRuntime;
    constructor() {
        this.runtime = new Runtime();
    }
}

export { VM };
