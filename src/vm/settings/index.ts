import { targets, type IProjectMeta, type IVMSettings, type IVM } from '../../types/vm';

/**
 * 设置，管理关于项目的一些设置
 *
 * **注意，这和位于`utils/`的设置不同，它用来关于`ASH`本身**
 */
class Settings implements IVMSettings {
    vm: IVM;
    enableTurboMode: boolean;
    projectMeta: IProjectMeta;

    constructor(vm: IVM) {
        this.vm = vm;
        this.enableTurboMode = false;
        this.projectMeta = {
            author: [],
            projectName: '',
            projectID: '',
            projectMode: targets.ASH,
        };
    }

    setProjectMeta(meta: Partial<IProjectMeta>) {
        this.projectMeta = { ...this.projectMeta, ...meta };
    }
}

export default Settings;
