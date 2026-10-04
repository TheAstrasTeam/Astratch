import { Target, type ITargetInfo } from '.';

interface IModuleInfo extends ITargetInfo {
    /** 链接的数据 */
    linkData: {
        function: Map<
            string,
            {
                ID: string;
                from: string;
            }
        >;
        cloneTemple: Map<
            string,
            {
                ID: string;
                from: string;
            }
        >;
        data: Map<
            string,
            {
                ID: string;
                from: string;
            }
        >;
        custom: Record<
            string,
            Map<
                string,
                {
                    ID: string;
                    from: string;
                }
            >
        >;
    };
    /** 导出的数据 */
    exportData: {
        function: string[];
        cloneTemple: string[];
        data: string[];
        custom: Record<string, string[]>;
    };
}

class Module extends Target implements IModuleInfo {
    linkData: IModuleInfo['linkData'];
    exportData: IModuleInfo['exportData'];
    constructor(meta: Partial<IModuleInfo>) {
        super({ ...meta });
        this.linkData = meta.linkData ?? {
            function: new Map(),
            cloneTemple: new Map(),
            data: new Map(),
            custom: {},
        };
        this.exportData = meta.exportData ?? {
            function: [],
            cloneTemple: [],
            data: [],
            custom: {},
        };
    }

    serialize(): IModuleInfo {
        return {
            name: this.name,
            id: this.id,
            blocks: this.blocks,
            linkData: this.linkData,
            exportData: this.exportData,
        };
    }
}

export { Module, type IModuleInfo };
