import * as Blockly from 'blockly';
import { registerAstratchRenderer } from './renderer';

import { registerContinuousToolbox } from './plugins/astratch-toolbox/src';

import './style.scss';

const workspaceMeta: Blockly.BlocklyOptions = {
    renderer: 'astratch',
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
    },
} as const;

class BlocklyAdapter {
    workspaces: Record<
        string,
        { id: string; DOM: HTMLDivElement; workspaceSvg: Blockly.WorkspaceSvg }
    >;
    Blockly: typeof Blockly = Blockly;

    private _isCreating = false;
    // protected _initWorkspace(workspacesID: string): void {
    //     const workspaceSvg = this.workspaces[workspacesID].workspaceSvg;
    // }
    private init(): void {
        // 删除自带的积木
        for (const blockType of Object.keys(Blockly.Blocks)) {
            Reflect.deleteProperty(Blockly.Blocks, blockType);
        }
        registerContinuousToolbox();
    }

    constructor() {
        this.workspaces = {};
        registerAstratchRenderer();
        this.init();
    }
    /**
     * 新建工作区
     * @param DOM 要注入的<div>
     * @param Data 工作区序列化数据
     * @param Options 自定义选项，无则使用默认配置: {@link workspaceMeta}
     */
    addWorkspace(
        DOM: HTMLDivElement,
        Data?: Record<string, unknown>,
        Options?: Blockly.BlocklyOptions,
    ): string {
        if (this._isCreating)
            throw new Error(
                "[Add Workspace] There's already has a workspace is creating.\nPlease try later.",
            );
        this._isCreating = true;
        Blockly.Events.disable();
        const id = crypto.randomUUID();
        try {
            const workspaceSvg = Blockly.inject(DOM, { ...workspaceMeta, ...Options });
            this.workspaces[id] = {
                id,
                DOM,
                workspaceSvg,
            };
            // 加载积木
            if (Data) Blockly.serialization.workspaces.load(Data, workspaceSvg);
            // this._initWorkspace(id);

            Blockly.Events.enable();
        } finally {
            this._isCreating = false;
        }
        return id;
    }
}

export const blocklyAdapter = new BlocklyAdapter();
