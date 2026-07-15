import { SNAP_RADIUS, type IBlocks, type IWorkspaceState, type Language } from '../../types/blocks';
import * as Blockly from 'blockly';
// 导入两个插件试试
import * as ContinuousToolbox from '../../../plugins/continuous-toolbox/src';
import * as En from 'blockly/msg/en';
import * as ZhHans from 'blockly/msg/zh-hans';
import getToolbox from './toolbox';
import { initBlocks } from './definitions';
import { AshConnectionChecker } from './cBlockWrap';
import { getBlocklyComponentStyles } from '../../lib/Theme/guiThemeManager';
import type { IVM } from '../../types/vm';
import { getBlocklyI18nByI18next } from '../../utils/ash-i18n';
import i18next from 'i18next';
import { replaceChineseI18n } from './i18n';

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
        Blockly.Events.TOOLBOX_ITEM_SELECT
    ];

    handleWorkspaceChange = (event: Blockly.Events.Abstract | null, byHand = false) => {
        // 检测更新，并检查这个事件是否需要忽略
        const update = () => {
            if (!this.workspaceSvg) return;
            this.vm.runtime.setTargetBlock(
                this.vm.runtime.editingTargetID,
                this.Blockly.serialization.workspaces.save(this.workspaceSvg) as IWorkspaceState,
            );
        };
        if (event) {
            if (!this._disableUpdateType.includes(event.type)) update();
        } else if (byHand) update();
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
            scrollbars: true,
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

            this._DOM = DOM;
            if (i18next.language) this.setLanguage(getBlocklyI18nByI18next(i18next.language));
            await this.init();
            this.workspaceSvg = this.Blockly.inject(DOM, this.workspaceConfig);
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
