import { type ITargetInfo, Target } from '.';

interface IEntityInfo extends ITargetInfo {
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
        /** 模糊 */
        blur: number;
    };
    /**
     * 混合模式
     * `normal`: 默认
     * `dissolve`: 溶解
     * `darken`: 变暗
     * `lighten`: 变亮
     * `screen`: 滤色
     * `multiply`: 正片叠底
     * `colorBurn`: 颜色加深
     * `colorDodge`: 颜色减淡
     * `overlay`: 叠加
     * `difference`: 差值
     * `pinLight`: 点光
     * `softLight`: 柔光
     * `hardLight`: 强光
     */
    mixMode:
        | 'normal'
        | 'dissolve'
        | 'darken'
        | 'lighten'
        | 'screen'
        | 'multiply'
        | 'colorBurn'
        | 'colorDodge'
        | 'overlay'
        | 'difference'
        | 'pinLight'
        | 'softLight'
        | 'hardLight';
    /**
     * 位置
     *
     * 在Astratch中，它的原点为**屏幕中心**，和Scratch一致
     */
    position: {
        x: number;
        y: number;
    };
    /**
     * 方向
     *
     * 在Astratch中，它的正方向为90°
     */
    direction: number;
    /**
     * 大小
     *
     * 100（%）为默认尺寸
     */
    size: number;
    costume: {
        /**
         * 造型
         *
         * 它存储着资源管理器的ID，如果ID为`undefined`，则为empty
         */
        usingCostume: string | undefined;
        isShowText: boolean;
        text: string;
        textColor: string;
        strokeColor: string;
        strokeWidth: number;
        fontAssetID: string;
    };
    /**
     * 裁切的顶点
     *
     * 其中的坐标按相对百分比算
     */
    clipPath: [number, number][];
    /** 是否隐藏 */
    isHidden: boolean;
    audio: Map<
        string,
        {
            /** 来自资源管理器的资源ID，若是undefined则是不存在资源 */
            assetID: string | undefined;
            isPause: boolean;
            volume: number;
            /** 百分比 */
            tone: number;
            /** 左右平衡，-1 ~ 1 */
            balance: number;
        }
    >;
    /** 图层位置 */
    align: number;
    tempData: Map<
        string,
        {
            name: string;
            // TODO: 类型定义
        }
    >;
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
}

class Entity extends Target implements IEntityInfo {
    effects: IEntityInfo['effects'];
    mixMode: IEntityInfo['mixMode'];
    position: IEntityInfo['position'];
    costume: IEntityInfo['costume'];
    direction: IEntityInfo['direction'];
    size: IEntityInfo['size'];
    clipPath: IEntityInfo['clipPath'];
    isHidden: IEntityInfo['isHidden'];
    audio: IEntityInfo['audio'];
    align: IEntityInfo['align'];
    tempData: IEntityInfo['tempData'];
    linkData: IEntityInfo['linkData'];

    constructor(meta: Partial<IEntityInfo>) {
        super({ ...meta });
        this.effects = meta.effects ?? {
            brightness: 100,
            color: 0,
            fisheye: 0,
            ghost: 0,
            mosaic: 0,
            pixelate: 0,
            whirl: 0,
            blur: 0,
        };
        this.mixMode = meta.mixMode ?? 'normal';
        this.position = meta.position ?? {
            x: 0,
            y: 0,
        };
        this.costume = meta.costume ?? {
            usingCostume: undefined,
            isShowText: false,
            text: '',
            textColor: '#ffffff',
            strokeColor: '#000000',
            strokeWidth: 0,
            // TODO: 默认字体资源ID
            fontAssetID: '',
        };
        this.direction = meta.direction ?? 90;
        this.size = meta.size ?? 100;
        this.clipPath = meta.clipPath ?? [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
        ];
        this.isHidden = meta.isHidden ?? false;
        // new Map创造的空的，肯定符合
        this.audio = meta.audio ?? (new Map() as IEntityInfo['audio']);
        this.tempData = meta.tempData ?? (new Map() as IEntityInfo['tempData']);
        this.linkData = meta.linkData ?? {
            function: new Map(),
            cloneTemple: new Map(),
            data: new Map(),
            custom: {},
        };
        this.align = meta.align ?? 0;
    }
    serialize(): IEntityInfo {
        return {
            effects: this.effects,
            name: this.name,
            id: this.id,
            blocks: this.blocks,
            mixMode: this.mixMode,
            position: this.position,
            clipPath: this.clipPath,
            costume: this.costume,
            direction: this.direction,
            size: this.size,
            isHidden: this.isHidden,
            align: this.align,
            audio: this.audio,
            linkData: this.linkData,
            tempData: this.tempData,
            workspaceSvg: this.workspaceSvg,
        };
    }
}

export { Entity, type IEntityInfo };
