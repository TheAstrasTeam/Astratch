/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    OPCODES,
    type IBlocks,
    type IWorkspaceState,
    type Language,
} from '../../../types/vm/blocks';
import * as Blockly from 'blockly';
// 导入两个插件试试
import * as AstratchToolbox from '../../../../plugins/astratch-toolbox/src';
import {
    setWorkspaceSearchTranslator,
    WorkspaceSearch,
} from '../../../../plugins/workspace-search/src';
import * as En from 'blockly/msg/en';
import * as ZhHans from 'blockly/msg/zh-hans';
import { setupBlockly } from '../../../lib/BlocklyAdapter';
import { AshConnectionChecker } from '../../../lib/BlocklyAdapter/connectionRules';
import { getBlocklyComponentStyles } from '../../../lib/Theme/guiThemeManager';
import {
    events,
    type IDataCreatedEvent,
    type IFunctionCreatedEvent,
    type IVM,
    type TViewportUpdateEvent,
} from '../../../types/vm/vm';
import { getBlocklyI18nByI18next } from '../../../utils/ash-i18n';
import i18next from 'i18next';
import { replaceChineseI18n } from '../../../lib/BlocklyAdapter/i18n';
import { Toast } from '../../../lib/ToastManager';
import { spawnRandomString } from '../../../utils/ash-data';
import type { IFunctionDefinition } from '../../../components/modal_createFunction/functionPreview';
import { sendError } from '../../../utils/debug';

/**
 * 用于便捷的管理WebGPU或Blockly工作区
 *
 * 用一个就好了！
 */
class Blocks implements IBlocks {
    workspaceSvg: Blockly.WorkspaceSvg | null;
    Blockly: typeof Blockly;
    supportLanguages: { en: Language; 'zh-Hans': Language };
    workspaceConfig: Blockly.BlocklyOptions | Record<string, unknown>;
    toolbox: Blockly.utils.toolbox.ToolboxDefinition | object;
    theme: Blockly.Theme;
    vm: IVM;

    /**
     * 缓存的 DOM，用于进行重启操作等
     */
    private _DOM: HTMLDivElement | null;
    /**
     * 标记此时是否正在创建工作区，来防止时序问题
     */
    private _isCreating = false;
    /**
     * 当前工作区绑定的搜索组件；随工作区一同创建与销毁。
     */
    private workspaceSearch: WorkspaceSearch | null = null;
    /**
     * 在工作区出现事件时需要同步积木，
     * 但是不是所有事件都会修改工作区，
     * 所以需要过滤掉一些防止更改过于频繁
     *
     * : string[] 用于防止TS把类型改了
     * 如果没它会导致 `includes` 报类型错误
     */
    private _disableUpdateType: string[] = [
        // 选择一个积木
        // `Class for a selected event. Notifies listeners that a new element has been selected.`
        Blockly.Events.SELECTED,
        // 拖动一个积木
        // 事实上，它常和`move`一起触发
        // 但drag是“拖动”，而拖动会造成移动
        // 所以只需要检测`move`即可
        Blockly.Events.COMMENT_DRAG,
        Blockly.Events.BLOCK_DRAG,
        // 视口更改，其实就是移动工作区镜头
        Blockly.Events.VIEWPORT_CHANGE,
        // 选择工具箱
        Blockly.Events.TOOLBOX_ITEM_SELECT,
    ];
    /**
     * 延迟释放的定时器。必须由 Blocks 持有而非 React ref：
     * 语言切换等场景整棵组件树重挂（key 变化），新组件实例的 ref
     * 是空的，清不掉旧实例调度好的释放，工作区会被延迟 dispose 杀掉。
     */
    private _disposeTimer: ReturnType<typeof setTimeout> | null = null;

    private handleWorkspaceChange = (event: Blockly.Events.Abstract | null, byHand = false) => {
        // 检测更新，并检查这个事件是否需要忽略
        const update = () => {
            if (!this.workspaceSvg) return;
            try {
                this.vm.runtime
                    .getEditingTarget()
                    ?.setBlocks(
                        this.Blockly.serialization.workspaces.save(
                            this.workspaceSvg,
                        ) as IWorkspaceState,
                    );
            } catch (error) {
                Toast.create({
                    id: `Workspace_save_Error${spawnRandomString()}`,
                    text: i18next.t('gui:err.save.failed', { err: (error as Error).message }),
                    type: 'warn',
                });
            }
        };
        const getInfoOfViewportUpdate = (
            event: Blockly.Events.ViewportChange,
        ): TViewportUpdateEvent => {
            // 常理来说是不会出现位置大小
            // 都更改的事件，所以暂不处理
            if (event.oldScale !== event.scale)
                return {
                    changed: 'scale',
                    oldScale: event.oldScale ?? 1,
                    scale: event.scale ?? 1,
                };
            else
                return {
                    changed: 'position',
                    x: event.viewLeft ?? 0,
                    y: event.viewTop ?? 0,
                };
        };
        if (event) {
            if (!this._disableUpdateType.includes(event.type)) update();
            // 对于视口更改的额外事件
            else if (event.type === (Blockly.Events.VIEWPORT_CHANGE as string))
                this.vm.emit(
                    events.VIEWPORT_VIEW,
                    getInfoOfViewportUpdate(event as Blockly.Events.ViewportChange),
                );
        } else if (byHand) update();
    };

    private handleThemeUpdate = () => {
        void this.restartWorkspace();
    };

    private handleVariableCreated = (rawData: object) => {
        const data = rawData as IDataCreatedEvent;
        if (data.targetID === this.vm.runtime.editingTargetID)
            this.workspaceSvg?.refreshToolboxSelection();
    };

    private handleFunctionCreated = (rawData: object) => {
        const data = rawData as IFunctionCreatedEvent;
        if (data.targetID === this.vm.runtime.editingTargetID) {
            this.workspaceSvg?.refreshToolboxSelection();
            // 添加帽子块
            const definition = this.workspaceSvg?.newBlock(
                OPCODES.FUNCTION_DEFINITION,
            ) as unknown as IFunctionDefinition;
            definition.setFunctionRef({ targetId: data.targetID, functionId: data.id });
            if (this.workspaceSvg?.rendered) {
                const svg = definition as unknown as Blockly.BlockSvg;
                svg.initSvg();
                svg.moveBy(-this.workspaceSvg.scrollX, -this.workspaceSvg.scrollY);
                svg.render();
            }
        } else {
            const target = this.vm.runtime.getTargetByID(data.targetID);
            if (!target) {
                sendError({ text: 'vm:err.target.undefined' });
                return;
            }
            // 新建一个临时工作区并创建头积木
            // 再将数据加会target内
            const tempWorkspace = new this.Blockly.Workspace();

            const definition = tempWorkspace.newBlock(
                OPCODES.FUNCTION_DEFINITION,
            ) as IFunctionDefinition;
            definition.setFunctionRef({ targetId: data.targetID, functionId: data.id });

            // 格式直接来自生成，绝对不会为null
            const state = this.Blockly.serialization.blocks.save(
                definition,
            ) as unknown as Blockly.serialization.blocks.State;

            // 销毁工作区
            tempWorkspace.dispose();
            state.x = target.viewX;
            state.y = target.viewY;

            target.blocks._workspace.blocks.blocks.push(state);
        }
    };

    private handleFunctionEdited = (rawData: object) => {
        const data = rawData as { id?: string; targetID?: string };
        if (!data.id || !data.targetID) return;

        if (data.targetID === this.vm.runtime.editingTargetID)
            this.workspaceSvg?.refreshToolboxSelection();
        const blocks = this.workspaceSvg?.getAllBlocks(false) ?? [];
        for (const block of blocks) {
            if (block.type !== OPCODES.FUNCTION_VALUE) continue;
            const value = block as unknown as {
                functionRef?: { targetId: string; functionId: string } | null;
                refreshFromFunctionData?: () => void;
            };
            if (
                value.functionRef?.targetId !== data.targetID ||
                value.functionRef.functionId !== data.id ||
                !value.refreshFromFunctionData
            )
                continue;
            value.refreshFromFunctionData();
        }
        for (const block of blocks) {
            if (block.type === OPCODES.FUNCTION_CALL || block.type === OPCODES.FUNCTION_EXECUTE) {
                (block as unknown as { syncArgs?: () => void }).syncArgs?.();
            }
        }
    };

    private handleFunctionRemoved = (rawData: object) => {
        const data = rawData as { id?: string; targetID?: string };
        if (!data.id || !data.targetID) return;

        if (data.targetID === this.vm.runtime.editingTargetID)
            this.workspaceSvg?.refreshToolboxSelection();

        const blocks = this.workspaceSvg?.getAllBlocks(false) ?? [];
        const matchingBlocks = blocks.filter(block => {
            if (
                !([OPCODES.FUNCTION_VALUE, OPCODES.FUNCTION_DEFINITION] as string[]).includes(
                    block.type,
                )
            )
                return false;
            const value = block as Blockly.Block & {
                functionRef?: { targetId: string; functionId: string } | null;
            };
            const ref = value.functionRef;
            return !!ref && ref.targetId === data.targetID && ref.functionId === data.id;
        });
        const matchingIds = new Set(matchingBlocks.map(block => block.id));
        // 定义帽销毁时会递归销毁自己的签名 FUNCTION_VALUE；只处理最外层
        // 匹配块，避免随后对已销毁的子块再次 dispose。
        const blocksToDispose = matchingBlocks.filter(block => {
            let parent = block.getParent();
            while (parent) {
                if (matchingIds.has(parent.id)) return false;
                parent = parent.getParent();
            }
            return true;
        });
        const wasEnabled = this.Blockly.Events.isEnabled();
        if (wasEnabled) this.Blockly.Events.disable();
        try {
            for (const block of blocksToDispose) block.dispose(true);
        } finally {
            if (wasEnabled) this.Blockly.Events.enable();
        }
        this.handleWorkspaceChange(null, true);
        for (const block of blocks) {
            if (block.type === OPCODES.FUNCTION_CALL || block.type === OPCODES.FUNCTION_EXECUTE) {
                (block as Blockly.Block & { syncArgs?: () => void }).syncArgs?.();
            }
        }
    };

    constructor(BlocklySelf: typeof Blockly, vm: IVM) {
        this.vm = vm;
        this._DOM = null;
        this.workspaceSvg = null;
        this.Blockly = BlocklySelf;
        this.supportLanguages = {
            // @ts-expect-error 语言包类型不支持
            en: En,
            // @ts-expect-error 语言包类型不支持
            'zh-Hans': ZhHans,
        };
        this.toolbox = {};
        this.theme = this.Blockly.Theme.defineTheme('astratch', {
            name: 'scratch',
            base: this.Blockly.Themes.Zelos,
            startHats: true, // 给Hat一个帽子，就和 Scratch 一样
            componentStyles: {
                ...getBlocklyComponentStyles(),
                flyoutOpacity: 0.5,
            },
            fontStyle: {
                weight: 'normal',
                size: 12,
            },
        });
        this.workspaceConfig = {
            toolbox: this.toolbox,
            media: import.meta.env.BASE_URL + 'assets/blockly-media',
            scrollbars: true,
            // 折叠积木
            // 这玩意会导致注释无法正常工作
            collapse: false,
            // 禁用积木
            // 这玩意在ASH没用
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
                // 调整缩放的设置
            },
            trashcan: true,
            move: {
                scrollbars: true,
                drag: true,
                wheel: true,
            },
            renderer: 'astratch',
            theme: this.theme,
            plugins: {
                toolbox: AstratchToolbox.ContinuousToolbox,
                flyoutsVerticalToolbox: AstratchToolbox.ContinuousFlyout,
                metricsManager: AstratchToolbox.ContinuousMetrics,
                connectionChecker: AshConnectionChecker,
            },
            // 网格，暂定48
            grid: {
                spacing: 48,
            },
        };
    }

    async init(): Promise<void> {
        const { toolbox } = await setupBlockly(this.Blockly, this.vm);
        this.toolbox = toolbox;
        this.workspaceConfig.toolbox = toolbox;

        // 主题跟随 GUI 换肤，每次建工作区都要重新取。
        this.theme.componentStyles = {
            ...getBlocklyComponentStyles(),
            flyoutOpacity: 0.5,
        };
    }

    /**
     * 重启工作区
     */
    async restartWorkspace(): Promise<void> {
        if (!this._DOM) {
            console.warn('No existing workspace');
            return;
        }
        this.handleWorkspaceChange(null, true);
        // 删除遗留的DOM
        this._DOM.querySelector('[class*=injectionDiv]')?.remove();
        await this.createWorkspace(this._DOM);
    }

    setLanguage(lang: 'en' | 'zh-Hans'): void {
        this.Blockly.setLocale(this.supportLanguages[lang]);
        if (lang === 'zh-Hans') {
            replaceChineseI18n(this.Blockly);
        }
    }

    /**
     * 延迟释放工作区（供 React 组件 cleanup 调用）。
     *
     * 定时器由 Blocks 实例持有：组件树重挂（如语言切换的 key 变化）
     * 后，新组件实例调用 {@link cancelScheduledDispose} 依然能取消
     * 旧实例调度好的释放。
     */
    scheduleDispose(): void {
        this.cancelScheduledDispose();
        this._disposeTimer = setTimeout(() => {
            this._disposeTimer = null;
            this.dispose();
        }, 0);
    }

    /** 取消 {@link scheduleDispose} 调度的释放。 */
    cancelScheduledDispose(): void {
        if (this._disposeTimer) {
            clearTimeout(this._disposeTimer);
            this._disposeTimer = null;
        }
    }

    async createWorkspace(DOM: HTMLDivElement, restart = true): Promise<boolean> {
        // 如果创建工作区过于频繁·
        // 会出现init没进行完成就再次运行以此
        // 从而创建了多次工作区
        if (this._isCreating) return false;

        this._isCreating = true;
        // 取消组件 cleanup 调度好的延迟释放：本次调用要么复用、要么
        // 重建工作区，任何挂起的 dispose 都只会帮倒忙。
        this.cancelScheduledDispose();
        // 禁止发送事件，切换target的时候
        // 会广播大量`delete`和`create`
        // flyout 会被这些处理搞炸
        this.Blockly.Events.disable();
        try {
            // 容器 DOM 变了（如语言切换导致整棵组件树重挂）就必须重建：
            // 旧 workspaceSvg 的 injectionDiv 挂在已卸载的旧 div 上，
            // 复用它只会得到一份脱节的死 DOM。
            const domChanged = this.workspaceSvg !== null && this._DOM !== DOM;
            if (this.workspaceSvg && (restart || domChanged)) {
                if (domChanged) {
                    // DOM 已脱节，dispose 前最后保存一次现场。
                    this.handleWorkspaceChange(null, true);
                }
                // 若已有存在的工作区，*即刻重启*
                this.dispose();
            }

            if (i18next.language) this.setLanguage(getBlocklyI18nByI18next(i18next.language));
            if (restart || !this.workspaceSvg) {
                this._DOM = DOM;
                await this.init();
                this.workspaceSvg = this.Blockly.inject(DOM, this.workspaceConfig);

                setWorkspaceSearchTranslator(i18next.t);
                this.workspaceSearch = new WorkspaceSearch(this.workspaceSvg);
                this.workspaceSearch.init();

                // 注册动态工作区
                const { registerCategory } = await setupBlockly(this.Blockly, this.vm);
                registerCategory.forEach(category => {
                    this.workspaceSvg?.registerToolboxCategoryCallback(
                        category.CUSTOM,
                        category.FUNCTION,
                    );
                    category.CALLBACK.forEach(callback => {
                        this.workspaceSvg?.registerButtonCallback(callback.ID, callback.FUNCTION);
                    });
                });
                const toolbox = this.workspaceSvg.getToolbox();
                if (toolbox instanceof AstratchToolbox.ContinuousToolbox) {
                    const continuousToolbox = toolbox as unknown as {
                        refreshFlyoutContents: () => void;
                    };
                    continuousToolbox.refreshFlyoutContents();
                }
                this.vm.on(events.UPDATE_THEME, this.handleThemeUpdate);
                this.vm.on(events.CREATE_DATA, this.handleVariableCreated);
                this.vm.on(events.CREATE_CUSTOM_FUNCTION, this.handleFunctionCreated);
                this.vm.on(events.EDIT_CUSTOM_FUNCTION, this.handleFunctionEdited);
                this.vm.on(events.REMOVE_CUSTOM_FUNCTION, this.handleFunctionRemoved);
            }

            const nowTarget = this.vm.runtime.getTargetByID(this.vm.runtime.editingTargetID);
            const blocks = nowTarget?.blocks;
            if (blocks) {
                this.Blockly.serialization.workspaces.load(blocks._workspace, this.workspaceSvg);
                this.workspaceSvg.refreshToolboxSelection();
                // 调整镜头
                this.workspaceSvg.scrollX = -nowTarget.viewX;
                this.workspaceSvg.scrollY = -nowTarget.viewY;
                this.workspaceSvg.scale = nowTarget.viewScale;
                const metrics = this.workspaceSvg.getMetrics();
                this.workspaceSvg.translate(
                    this.workspaceSvg.scrollX + metrics.absoluteLeft,
                    this.workspaceSvg.scrollY + metrics.absoluteTop,
                );
                this.workspaceSvg.getGrid()?.update(this.workspaceSvg.scale);
                this.workspaceSvg.scrollbar?.resize();
            }

            this.workspaceSvg.removeChangeListener(this.handleWorkspaceChange);
            this.workspaceSvg.addChangeListener(this.handleWorkspaceChange);
        } catch (Error) {
            Toast.create({
                id: 'Workspace_create_Error',
                text: i18next.t('gui:err.workspace.failed', { err: (Error as Error).message }),
                type: 'error',
            });
            throw Error;
        } finally {
            this._isCreating = false;
            this.Blockly.Events.enable();
            // 重发一个切换事件
            if (this.workspaceSvg) {
                this.Blockly.Events.fire(
                    new this.Blockly.Events.FinishedLoading(this.workspaceSvg),
                );
            }
        }

        return !!this.workspaceSvg;
    }

    dispose(): boolean {
        this.vm.off(events.UPDATE_THEME, this.handleThemeUpdate);
        this.vm.off(events.CREATE_DATA, this.handleVariableCreated);
        this.vm.off(events.CREATE_CUSTOM_FUNCTION, this.handleFunctionCreated);
        this.vm.off(events.EDIT_CUSTOM_FUNCTION, this.handleFunctionEdited);
        this.vm.off(events.REMOVE_CUSTOM_FUNCTION, this.handleFunctionRemoved);
        this.workspaceSearch?.dispose();
        this.workspaceSearch = null;
        if (this.workspaceSvg) {
            this.workspaceSvg.removeChangeListener(this.handleWorkspaceChange);
            this.workspaceSvg.dispose();
            this.workspaceSvg = null;
            return true;
        }
        return false;
    }

    refreshBlocklySize(): void {
        if (this.workspaceSvg) this.Blockly.common.svgResize(this.workspaceSvg);
    }
}

export default Blocks;
