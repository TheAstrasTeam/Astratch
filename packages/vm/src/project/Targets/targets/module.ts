import { Target, type ITargetInfo } from '.';
import type { IEvents } from 'astratch-core';
import type { IVMEventsType } from '../../../vm';

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
        data: string[];
        custom: Record<string, string[]>;
    };
}

class Module extends Target implements IModuleInfo {
    linkData: IModuleInfo['linkData'];
    exportData: IModuleInfo['exportData'];
    constructor(meta: Partial<IModuleInfo>, emitMethod: IEvents<IVMEventsType>['emit']) {
        super({ ...meta }, emitMethod);
        this.linkData = meta.linkData ?? {
            function: new Map(),
            data: new Map(),
            custom: {},
        };
        this.exportData = meta.exportData ?? {
            function: [],
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
            workspaceSvg: this.workspaceSvg,
            parent: this.parent,
        };
    }

    setParent(newPathID: string | null): void {
        this.emit('MOVE_TARGET', {
            mode: 'module',
            targetID: this.id,
            from: this.parent,
            to: newPathID,
        });
        this.parent = newPathID;
    }
}

export { Module, type IModuleInfo };
