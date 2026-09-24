import * as Blockly from 'blockly';
import { registerAstratchRenderer } from './renderer';

import * as AstratchToolbox from './plugins/astratch-toolbox/src';
import { WorkspaceSearch } from './plugins/workspace-search/src';
import { AshConnectionChecker } from './plugins/connectionRules';

const workspaceMeta: Blockly.BlocklyOptions = {
    renderer: 'astratch',
    toolbox: undefined,
    plugins: {
        toolbox: AstratchToolbox.ContinuousToolbox,
        flyoutsVerticalToolbox: AstratchToolbox.ContinuousFlyout,
        metricsManager: AstratchToolbox.ContinuousMetrics,
        connectionChecker: AshConnectionChecker,
    },
} as const;

interface IBlocklyAdapter {
    workspaces: Record<
        string,
        {
            id: string;
            DOM: HTMLDivElement;
            workspaceSvg: Blockly.WorkspaceSvg;
        }
    >;
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
    ): string;
}

class BlocklyAdapter implements IBlocklyAdapter {
    workspaces: Record<
        string,
        { id: string; DOM: HTMLDivElement; workspaceSvg: Blockly.WorkspaceSvg }
    >;

    private _isCreating = false;
    protected _initWorkspace(workspacesID: string): void {
        const workspaceSvg = this.workspaces[workspacesID].workspaceSvg;
        const workspaceSearch = new WorkspaceSearch(workspaceSvg);
        workspaceSearch.init();
    }
    private init(): void {
        // TODO
    }

    constructor() {
        this.workspaces = {};
        registerAstratchRenderer();
        this.init();
    }
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
            this._initWorkspace(id);

            Blockly.Events.enable();
        } finally {
            this._isCreating = false;
        }
        return id;
    }
}

export const blocklyAdapter = new BlocklyAdapter();
