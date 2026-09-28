import type { ITarget } from './targets';

interface IRuntime {
    targets: Map<string, ITarget>;
}

class Runtime implements IRuntime {
    targets: Map<string, ITarget>;
    constructor() {
        this.targets = new Map();
    }
}

export { Runtime, type IRuntime };
