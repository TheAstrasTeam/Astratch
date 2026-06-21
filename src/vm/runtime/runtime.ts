import type { IRuntime } from "../../types/vm"

/**
 * 运行时，管理关于项目的执行
 */
class Runtime implements IRuntime{
    projectAuthor: string[];
    projectID: string;
    constructor(){
        this.projectAuthor = []
        this.projectID = ""
    }
}

export default Runtime