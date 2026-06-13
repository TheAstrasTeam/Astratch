import type { IFRuntime } from "../../typescript/interface"

/**
 * 运行时，管理关于项目的执行
 */
class Runtime implements IFRuntime{
    projectAdult: string[];
    projectID: string;
    constructor(){
        this.projectAdult = []
        this.projectID = ""
    }
}

export default Runtime