import type { IWorkspaceState } from 'astratch-blockly';

const DEFAULT_EFFECTS: ITargetInfo['effects'] = {
    brightness: 100,
    color: 0,
    fisheye: 0,
    ghost: 0,
    mosaic: 0,
    pixelate: 0,
    whirl: 0,
} as const;

interface ITargetInfo {
    effects: {
        /** 亮度 */
        brightness: number;
        /** 颜色 */
        color: number;
        /** 鱼眼 */
        fisheye: number;
        /** 透明度 */
        ghost: number;
        /** 马赛克 */
        mosaic: number;
        /** 像素 */
        pixelate: number;
        /** 漩涡 */
        whirl: number;
    };
    name: string;
    id: string;
    blocks: {
        script: Record<string, string>;
        blocks: IWorkspaceState;
    };
}

interface ITarget extends ITargetInfo {
    serialize(): ITargetInfo;
}

class Target implements ITarget {
    effects: {
        brightness: number;
        color: number;
        fisheye: number;
        ghost: number;
        mosaic: number;
        pixelate: number;
        whirl: number;
    };
    name: string;
    id: string;
    blocks: {
        script: Record<string, string>;
        blocks: IWorkspaceState;
    };

    constructor(meta: Partial<ITargetInfo>) {
        this.effects = { ...DEFAULT_EFFECTS };
        this.name = meta.name ?? 'target';
        this.id = meta.id ?? crypto.randomUUID();
        this.effects = meta.effects ?? { ...DEFAULT_EFFECTS };
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
    serialize(): ITargetInfo {
        return {
            effects: this.effects,
            name: this.name,
            id: this.id,
            blocks: this.blocks,
        };
    }
}

export { Target, type ITarget };
