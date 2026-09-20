interface ITarget {
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
        blocks: Blockly;
    };
    serialize(): TJsonTarget;
}

interface TJsonTarget {
    effect: ITarget['effects'];
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
    constructor() {
        this.effects = {
            brightness: 100,
            color: 0,
            fisheye: 0,
            ghost: 0,
            mosaic: 0,
            pixelate: 0,
            whirl: 0,
        };
    }
    serialize(): TJsonTarget {
        return {
            effect: this.effects,
        };
    }
}

export { Target, type ITarget };
