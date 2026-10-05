import type { Blockly, IWorkspaceState } from 'astratch-blockly';

interface ITargetInfo {
    name: string;
    id: string;
    blocks: {
        script: Record<string, string>;
        blocks: IWorkspaceState;
    };
    workspaceSvg: null | Blockly.WorkspaceSvg;
}

interface ITarget extends ITargetInfo {
    /** 序列化Target */
    serialize(): unknown;
    /** 反序列化Target */
    deserialize(data: unknown): void;
    /** 选择一个工作区 */
    selectWorkspace(workspaceSvg: Blockly.WorkspaceSvg): void;
}

abstract class Target implements ITarget {
    name: ITarget['name'];
    id: ITarget['id'];
    blocks: ITarget['blocks'];
    workspaceSvg: ITarget['workspaceSvg'];

    constructor(meta: Partial<ITargetInfo>) {
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
    }
    /** 返回的应是**可序列化的**各自的 `Info` */
    abstract serialize(): unknown;

    deserialize(data: unknown): void {
        Object.assign(this, data);
    }

    selectWorkspace(workspaceSvg: Blockly.WorkspaceSvg): void {
        this.workspaceSvg = workspaceSvg;
    }
}

export { Target, type ITarget, type ITargetInfo };
