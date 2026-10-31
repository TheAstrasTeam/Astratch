import * as Blockly from 'blockly';

import './style.css';
import './blockStyle.css';
import { registerAstratchToolbox } from './plugins/astratch-toolbox/src';
import { registerAstratchRenderer } from './renderer';
import { FieldMultilineInput } from './plugins/fields/field_multilineinput';
import { FieldColourHsvSliders } from './plugins/fields/field_colour_hsv_sliders';
import { FieldAngle } from './plugins/fields/field_angle';
import { ashConnectionChecker } from './connectionChecker';
import { inject } from './inject';
import { ashMultiSelectorManager } from './plugins/workspace/multiSelector';
import { ashWorkspaceMultiDragger } from './plugins/workspace/dragger';

const workspaceMeta: Blockly.BlocklyOptions = {
    renderer: 'astratch',
    theme: 'astratch',
    media: import.meta.resolve('./media'),
    grid: {
        spacing: 48,
    },
    scrollbars: true,
    collapse: false,
    disable: false,
    zoom: {
        controls: true,
        wheel: true,
        startScale: 0.9,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
        // 这个捏可以让手机端用！
        pinch: true,
    },
    plugins: {
        flyoutsVerticalToolbox: 'ContinuousFlyout',
        metricsManager: 'ContinuousMetrics',
        toolbox: 'ContinuousToolbox',
        connectionChecker: ashConnectionChecker,
        blockDragger: ashWorkspaceMultiDragger,
    },
} as const;

type TASSET_TYPE = 'font' | 'image' | 'audio' | 'any' | 'text';
type TASSET_INFO = {
    name: string;
} & (
    | {
          type: 'font';
          // TODO: 确定类型
          raw: unknown;
      }
    | {
          type: 'image';
          // TODO: 确定类型
          raw: unknown;
      }
    | {
          type: 'audio';
          // TODO: 确定类型
          raw: unknown;
      }
    | {
          type: 'text';
          raw: string;
      }
);

interface IHANDLE_TYPE {
    /** 全部事件 */
    ALL: unknown;
    ADD_BLOCK: Blockly.Events.BlockCreate;
    CHANGE_BLOCK: Blockly.Events.BlockChange;
    DELETED_BLOCK: Blockly.Events.BlockDelete;
    DRAG_BLOCK: Blockly.Events.BlockDrag;
    MOVE_BLOCK: Blockly.Events.BlockMove;
    GET_MENU: {
        type: 'entities' | 'modules' | 'targets';
        /**
         * 用于处理项的地方，由 Astratch-Blockly 提供
         *
         * 若工作区未创建完成，它会放进队列里而不是直接执行
         * */
        handler(data: [string, string][]): void;
    };
    GET_ASSET: {
        type: TASSET_TYPE;
        handler(assetHandle: string): void;
    };
    GET_ASSET_INFO: {
        assetHandle: string;
        handler(assetInfo: TASSET_INFO): void;
    };
}

/**
 * 是否反转缩放和选取的操作
 * 若为false，则左键选取、中键移动
 * 若为true ，则左键移动、中键选取
 */
export let revertDrag = false;

// eslint-disable-next-line @typescript-eslint/unbound-method
const originalBumpBlock = Blockly.BlockSvg.prototype.bumpNeighbours;
// eslint-disable-next-line @typescript-eslint/unbound-method
const originalBumpConnection = Blockly.RenderedConnection.prototype.bumpAwayFrom;

class BlocklyAdapter {
    workspaces: Record<
        string,
        {
            id: string;
            DOM: HTMLDivElement;
            workspaceSvg: Blockly.WorkspaceSvg;
            handler: <K extends keyof IHANDLE_TYPE>(type: K, data: IHANDLE_TYPE[K]) => void;
        }
    >;
    Blockly: typeof Blockly = Blockly;

    private _isCreating = false;
    // protected _initWorkspace(workspacesID: string): void {
    //     const workspaceSvg = this.workspaces[workspacesID].workspaceSvg;
    // }
    private init(): void {
        Blockly.fieldRegistry.register('text_input', FieldMultilineInput);
        Blockly.fieldRegistry.register('color_input', FieldColourHsvSliders);
        Blockly.fieldRegistry.register('angle_input', FieldAngle);
        registerAstratchRenderer();

        Blockly.Scrollbar.scrollbarThickness = 10;
        Blockly.Theme.defineTheme('astratch', {
            name: 'scratch',
            base: Blockly.Themes.Zelos,
            startHats: true, // 给Hat一个帽子，就和 Scratch 一样
            componentStyles: {
                workspaceBackgroundColour: 'var(--ui-secondary)',
                toolboxBackgroundColour: 'var(--ui-tertiary)',
                toolboxForegroundColour: 'var(--ui-secondary-icon)',
                flyoutBackgroundColour: 'var(--ui-primary)',
                flyoutForegroundColour: 'var(--ui-primary-icon)',
                scrollbarColour: 'var(--ui-quaternary)',
                insertionMarkerColour: '#555555',
                cursorColour: 'var(--ui-quaternary)',
                selectedGlowColour: 'var(--accent-quaternary)',
                flyoutOpacity: 0.5,
            },
            fontStyle: {
                weight: 'normal',
                size: 12,
            },
        });
        // 删除自带的积木
        for (const blockType of Object.keys(Blockly.Blocks)) {
            Reflect.deleteProperty(Blockly.Blocks, blockType);
        }
        registerAstratchToolbox();
    }

    private waitingEvents: {
        workspaceID: string;
        event(): void;
    }[] = [];

    /** 禁用防遮挡 */
    disableBump() {
        Blockly.BlockSvg.prototype.bumpNeighbours = () => {
            /* empty */
        };
        Blockly.RenderedConnection.prototype.bumpAwayFrom = () => {
            /* empty */
        };
    }
    /** 启用防遮挡 */
    enableBump() {
        Blockly.BlockSvg.prototype.bumpNeighbours = originalBumpBlock;
        Blockly.RenderedConnection.prototype.bumpAwayFrom = originalBumpConnection;
    }

    /**
     * @param RevertDrag 反转拖动
     * @param disableBump 禁用防遮挡
     */
    constructor(RevertDrag?: boolean, disableBump = true) {
        revertDrag = RevertDrag ?? false;
        if (disableBump) this.disableBump();
        else this.enableBump();
        this.workspaces = {};
        this.init();
    }

    private handleChangeListener(e: Blockly.Events.Abstract, existingWorkspaceID?: string): void {
        const workspaceID = existingWorkspaceID ?? e.workspaceId;
        if (!workspaceID) return;
        const handler = this.workspaces[workspaceID].handler;
        switch (e.type) {
            case 'change':
                handler('CHANGE_BLOCK', e as unknown as Blockly.Events.BlockChange);
                return;
            case 'create':
                handler('ADD_BLOCK', e as unknown as Blockly.Events.BlockCreate);
                return;
            case 'drag':
                handler('DRAG_BLOCK', e as unknown as Blockly.Events.BlockDrag);
                return;
            case 'move':
                handler('MOVE_BLOCK', e as unknown as Blockly.Events.BlockMove);
                return;
            case 'delete':
                handler('DELETED_BLOCK', e as unknown as Blockly.Events.BlockDelete);
                return;
        }
    }

    /**
     * 新建工作区
     * @param DOM 要注入的<div>
     * @param handler 各种事件的处理区
     * @param Data 工作区序列化数据
     * @param Options 自定义选项，无则使用默认配置: {@link workspaceMeta}
     */
    addWorkspace(
        DOM: HTMLDivElement,
        handler: <K extends keyof IHANDLE_TYPE>(type: K, data: IHANDLE_TYPE[K]) => void,
        Data?: Record<string, unknown>,
        Options?: Blockly.BlocklyOptions,
    ): string {
        if (this._isCreating)
            throw new Error(
                "[Add Workspace] There's already has a workspace is creating.\nPlease try later.",
            );
        this._isCreating = true;
        Blockly.Events.disable();
        let id: string | null;
        try {
            const workspaceSvg = inject(DOM, { ...workspaceMeta, ...Options });
            id = workspaceSvg.id;
            ashMultiSelectorManager.registerWorkspace(workspaceSvg, id);
            this.workspaces[id] = {
                id,
                DOM,
                workspaceSvg,
                handler,
            };
            // 加载积木
            if (Data) Blockly.serialization.workspaces.load(Data, workspaceSvg);
            // this._initWorkspace(id);
            Blockly.Events.enable();
            workspaceSvg.addChangeListener(this.handleChangeListener.bind(this));
        } finally {
            this._isCreating = false;

            this.waitingEvents = this.waitingEvents.filter(event => {
                if (event.workspaceID === id) {
                    event.event();
                    return false;
                }
                return true;
            });
        }
        return id;
    }

    emit<K extends keyof IHANDLE_TYPE>(block: Blockly.Block, type: K, data: IHANDLE_TYPE[K]) {
        // 对于Flyout中的积木，需要获取父工作区的ID
        const id =
            (block.workspace as unknown as Blockly.IFlyout).targetWorkspace?.id ??
            block.workspace.id;
        if (this._isCreating)
            this.waitingEvents.push({
                workspaceID: id,
                event: () => {
                    this.workspaces[id].handler(type, data);
                },
            });
        else this.workspaces[id].handler(type, data);
    }

    setWorkspaceRevertDrag(value: boolean): void {
        revertDrag = value;
        // 工作区于每次修改都会读，所以不需要刷新
    }
}

export const blocklyAdapter = new BlocklyAdapter();
export type { TASSET_TYPE, TASSET_INFO };
