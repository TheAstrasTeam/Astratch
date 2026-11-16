import type { Blockly, IWorkspaceState } from 'astratch-blockly';
import type { IEvents } from 'astratch-core';
import type { IVMEventsType } from '../../../vm';

interface ITargetInfo {
    name: string;
    id: string;
    blocks: {
        script: Record<string, string>;
        blocks: IWorkspaceState;
    };
    workspaceSvg: null | Blockly.WorkspaceSvg;
    /** 所在的目录位置，null则为顶层 */
    parent: string | null;
}

interface ITarget extends ITargetInfo {
    /** 序列化Target */
    serialize(): unknown;
    /** 反序列化Target */
    deserialize(data: unknown): void;
    /** 选择一个工作区 */
    selectWorkspace(workspaceSvg: Blockly.WorkspaceSvg): void;
    setParent(newID: string | null): void;
}

abstract class Target implements ITarget {
    protected emit: IEvents<IVMEventsType>['emit'];
    name: ITarget['name'];
    id: ITarget['id'];
    blocks: ITarget['blocks'];
    workspaceSvg: ITarget['workspaceSvg'];
    parent: ITarget['parent'];

    constructor(meta: Partial<ITargetInfo>, emitMethod: IEvents<IVMEventsType>['emit']) {
        this.emit = emitMethod;
        this.name = meta.name ?? 'target';
        this.id = meta.id ?? crypto.randomUUID();
        this.blocks = meta.blocks ?? {
            script: {},
            blocks: {
                blocks: {
                    languageVersion: 1,
                    blocks: [],
                },
                workspaceComments: [],
            },
        };
        this.workspaceSvg = null;
        this.parent = meta.parent ?? null;
    }
    /** 返回的应是**可序列化的**各自的 `Info` */
    abstract serialize(): unknown;

    deserialize(data: unknown): void {
        Object.assign(this, data);
    }

    selectWorkspace(workspaceSvg: Blockly.WorkspaceSvg): void {
        this.workspaceSvg = workspaceSvg;
    }

    getParent(): string | null {
        return this.parent;
    }

    abstract setParent(newID: string | null): void;
}

export { Target, type ITarget, type ITargetInfo };
