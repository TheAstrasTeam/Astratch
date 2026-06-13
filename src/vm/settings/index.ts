import type { IFSettings } from "../../typescript/interface"

/**
 * 设置，管理关于项目的一些设置
 * 
 * **注意，这和位于`utils/`的设置不同，它用来关于`AEN`本身**
 */
class Settings implements IFSettings{
    enableTurboMode: boolean;

    constructor() {
        this.enableTurboMode = false;
    }
}

export default Settings