import { SNAP_RADIUS, type IBlocks, type IWorkspaceState, type Language } from '../../types/blocks';
import * as Blockly from 'blockly';
// 导入两个插件试试
import * as ContinuousToolbox from '../../../plugins/continuous-toolbox/src';
import * as En from 'blockly/msg/en';
import * as ZhHans from 'blockly/msg/zh-hans';
import getToolbox from './toolbox';
import { collectOptions, initBlocks } from './definitions';
import { AshConnectionChecker } from '../../../plugins/cBlockWrap';
import { getBlocklyComponentStyles } from '../../lib/Theme/guiThemeManager';
import { events, type IVM, type viewportUpdateEvent } from '../../types/vm';
import { getBlocklyI18nByI18next } from '../../utils/ash-i18n';
import i18next from 'i18next';
import { replaceChineseI18n } from './i18n';
import { closeContextMenu, openContextMenu } from '../../gui/contextMenu';
import { AllContextMenu } from '../../types/gui';
import {
    installContextMenuPatch,
    setContextMenuHandler,
} from '../../../plugins/context-menu-patch';
import { ScratchCommentBubble } from '../../../plugins/scratch-comment';

let _blocklyMenuOptions: Blockly.ContextMenuRegistry.ContextMenuOption[] | null = null;
let _blocklyMenuEvent: Event | null = null;

export function getBlocklyMenuOptions(): Blockly.ContextMenuRegistry.ContextMenuOption[] | null {
    return _blocklyMenuOptions;
}

export function getBlocklyMenuEvent(): Event | null {
    return _blocklyMenuEvent;
}

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

    handleWorkspaceChange = (event: Blockly.Events.Abstract | null, byHand = false) => {
        // 检测更新，并检查这个事件是否需要忽略
        const update = () => {
            if (!this.workspaceSvg) return;
            try {
                this.vm.runtime.setTargetBlock(
                    this.vm.runtime.editingTargetID,
                    this.Blockly.serialization.workspaces.save(
                        this.workspaceSvg,
                    ) as IWorkspaceState,
                );
            } catch (e) {
                console.warn(e);
            }
        };
        const getInfoOfViewportUpdate = (
            event: Blockly.Events.ViewportChange,
        ): viewportUpdateEvent => {
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

    handleThemeUpdate = () => {
        void this.restartWorkspace();
    };

    private _patchBlocklyContextMenu(): void {
        // 此函数由 Ai 生成
        installContextMenuPatch(this.Blockly);
        setContextMenuHandler((options, event, location) => {
            // ScratchCommentBubble 是 ASH 自定义的，不在插件覆盖范围内，单独处理
            const focusedNode = this.Blockly.getFocusManager().getFocusedNode();
            if (focusedNode instanceof ScratchCommentBubble) {
                options = collectOptions(focusedNode, event);
            }
            _blocklyMenuOptions = options;
            _blocklyMenuEvent = event;
            if (options.length) {
                openContextMenu(AllContextMenu.BLOCKLY, location);
            } else {
                closeContextMenu();
            }
        });
    }

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
            media: '/vm/blocks/images',
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
                // 调整缩放的设置
            },
            trashcan: true,
            move: {
                scrollbars: true,
                drag: true,
                wheel: true,
            },
            renderer: 'Zelos',
            theme: this.theme,
            plugins: {
                toolbox: ContinuousToolbox.ContinuousToolbox,
                flyoutsVerticalToolbox: ContinuousToolbox.ContinuousFlyout,
                metricsManager: ContinuousToolbox.ContinuousMetrics,
                connectionChecker: AshConnectionChecker,
            },
            // 网格，暂定48
            grid: {
                spacing: 48,
            },
        };
    }

    async init(): Promise<void> {
        // 初始化积木区
        this.toolbox = await getToolbox();
        this.workspaceConfig.toolbox = this.toolbox;

        this.Blockly.config.snapRadius = SNAP_RADIUS;
        this.Blockly.config.connectingSnapRadius = SNAP_RADIUS;

        this.theme.componentStyles = {
            ...getBlocklyComponentStyles(),
            flyoutOpacity: 0.5,
        };

        // 对于完全不需要现在的工作区的
        ContinuousToolbox.registerContinuousToolbox();

        // 定义积木
        initBlocks(this.Blockly);
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
        // await this.restartWorkspace();
    }

    async createWorkspace(DOM: HTMLDivElement): Promise<boolean> {
        // 如果创建工作区过于频繁·
        // 会出现init没进行完成就再次运行以此
        // 从而创建了多次工作区
        if (this._isCreating) return false;

        this._isCreating = true;
        try {
            if (this.workspaceSvg) {
                // 若已有存在的工作区，*即刻重启*
                this.dispose();
            }

            this.vm.on(events.UPDATE_THEME, this.handleThemeUpdate);
            this._DOM = DOM;
            if (i18next.language) this.setLanguage(getBlocklyI18nByI18next(i18next.language));
            await this.init();
            this.workspaceSvg = this.Blockly.inject(DOM, this.workspaceConfig);

            this._patchBlocklyContextMenu();

            const nowTarget = this.vm.runtime.getTargetByID(this.vm.runtime.editingTargetID);
            if (nowTarget?.blocks)
                this.Blockly.serialization.workspaces.load(
                    nowTarget.blocks._workspace,
                    this.workspaceSvg,
                );
            this.workspaceSvg.addChangeListener(this.handleWorkspaceChange);
        } finally {
            this._isCreating = false;
        }

        return !!this.workspaceSvg;
    }

    dispose(): boolean {
        if (this.workspaceSvg) {
            this.vm.off(events.UPDATE_THEME, this.handleThemeUpdate);
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
