import type { IWorkspaceState } from 'astratch-blockly';

interface ITargetInfo {
    name: string;
    id: string;
    blocks: {
        script: Record<string, string>;
        blocks: IWorkspaceState;
    };
}

interface ITarget extends ITargetInfo {
    /** 序列化Target */
    serialize(): unknown;
    /** 反序列化Target */
    deserialize(data: unknown): void;
}

abstract class Target implements ITarget {
    declare name: ITarget['name'];
    declare id: ITarget['id'];
    declare blocks: ITarget['blocks'];

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
    }
    /** 返回的应是**可序列化的**各自的 `Info` */
    abstract serialize(): unknown;

    deserialize(data: unknown): void {
        Object.assign(this, data);
    }
}

export { Target, type ITarget, type ITargetInfo };
