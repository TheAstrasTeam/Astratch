import type { IBlocks, Language } from '../../types/blocks';
import type * as Blockly from 'blockly';
// 导入两个插件试试
import * as ContinuousToolbox from './plugins/continuous-toolbox/src';
import toolbox from './toolbox';
import * as En from 'blockly/msg/en';
import * as ZhHans from 'blockly/msg/zh-hans';

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
    toolbox: Blockly.utils.toolbox.ToolboxDefinition;
    /**
     * 缓存的 DOM，用于进行重启操作等
     */
    private _DOM: HTMLDivElement | null;

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
        this.toolbox = toolbox;
        this.init(); // 初始化始出
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
            /**
             * Todo: 在未来我们打算自己搞一套渲染器，这将会非常*炫酷*
             *
             * 不是吗？
             *
             * - 渲染器指的是积木的样式渲染，你还想咋改
             */
            renderer: 'Zelos',
            plugins: {
                toolbox: ContinuousToolbox.ContinuousToolbox,
                flyoutsVerticalToolbox: ContinuousToolbox.ContinuousFlyout,
                metricsManager: ContinuousToolbox.ContinuousMetrics,
            },
        };
    }

    init(): void {
        // 对于完全不需要现在的工作区的
        ContinuousToolbox.registerContinuousToolbox();
        // 对于需要现在的工作区的
        if (this.workspaceSvg) {
            // 暂定
        }
    }

    /**
     * 重启工作区
     */
    restartWorkspace(): void {
        if (!this._DOM) {
            console.warn('No existing workspace');
            return;
        }
        this.createWorkspace(this._DOM);
    }

    setLanguage(lang: 'en' | 'zh-Hans'): void {
        this.Blockly.setLocale(this.supportLanguages[lang]);
        /**
         * 重启工作区
         * 这会丢失所有未保存的数据qwq
         * Todo: 兼容保存
         */
        this.restartWorkspace();
    }

    createWorkspace(DOM: HTMLDivElement): boolean {
        if (this.workspaceSvg) {
            // 若已有存在的工作区，*即刻重启*
            this.dispose();
        }

        this._DOM = DOM;
        this.workspaceSvg = this.Blockly.inject(DOM, this.workspaceConfig);
        this.init();
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
