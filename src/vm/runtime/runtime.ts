import type { IRuntime } from "../../types/vm"

/**
 * 运行时，管理关于项目的执行
 */
class Runtime implements IRuntime{
    projectAdult: string[];
    projectID: string;
    constructor(){
        this.projectAdult = []
        this.projectID = ""
    }
}

export default Runtime