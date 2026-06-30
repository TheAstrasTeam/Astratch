import { type IBlocks, type Language } from '../../types/blocks';
import type * as Blockly from 'blockly';
// 导入两个插件试试
import * as ContinuousToolbox from '../../../plugins/continuous-toolbox/src';
import * as En from 'blockly/msg/en';
import * as ZhHans from 'blockly/msg/zh-hans';
import getToolbox from './toolbox';
import { initBlocks } from './definitions';

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
    /**
     * 缓存的 DOM，用于进行重启操作等
     */
    private _DOM: HTMLDivElement | null;
    /**
     * 标记此时是否正在创建工作区，来防止时序问题
     */
    private _isCreating = false;

    constructor(BlocklySelf: typeof Blockly) {
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
        this.theme = this.Blockly.Theme.defineTheme('scratch', {
            name: 'scratch',
            base: this.Blockly.Themes.Zelos,
            startHats: true, // 给Hat一个帽子，就和 Scratch 一样
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
            },
        };
    }

    async init(): Promise<void> {
        // 初始化积木区
        this.toolbox = await getToolbox();
        this.workspaceConfig.toolbox = this.toolbox;

        // 对于完全不需要现在的工作区的
        ContinuousToolbox.registerContinuousToolbox();

        // 定义积木
        initBlocks(this.Blockly);

        // 对于需要现在的工作区的
        if (this.workspaceSvg) {
            // 暂定
        }
    }

    /**
     * 重启工作区
     */
    async restartWorkspace(): Promise<void> {
        if (!this._DOM) {
            console.warn('No existing workspace');
            return;
        }
        /**
         * 重启工作区
         * 这会丢失所有未保存的数据qwq
         * Todo: 兼容保存
         */
        // 删除遗留的DOM
        this._DOM.querySelector('[class*=injectionDiv]')?.remove();
        await this.createWorkspace(this._DOM);
    }

    async setLanguage(lang: 'en' | 'zh-Hans'): Promise<void> {
        this.Blockly.setLocale(this.supportLanguages[lang]);
        await this.restartWorkspace();
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
            await this.init();
            this.workspaceSvg = this.Blockly.inject(DOM, this.workspaceConfig);
        } finally {
            this._isCreating = false;
        }

        return !!this.workspaceSvg;
    }

    dispose(): boolean {
        if (this.workspaceSvg) {
            this.workspaceSvg.dispose();
            this.workspaceSvg = null;
            return true;
        }
        return false;
    }
}

export default Blocks;
