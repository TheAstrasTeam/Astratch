import type { IBlocks, Language } from '../../types/blocks'
import type * as Blockly from 'blockly'
// 导入两个插件试试
import * as  ContinuousToolbox from '@blockly/continuous-toolbox'
// @ts-expect-error 这个插件本来就不支持TS
import { Multiselect } from '@mit-app-inventor/blockly-plugin-workspace-multiselect'
import toolbox from './toolbox'
import * as En from 'blockly/msg/en'
import * as ZhHans from 'blockly/msg/zh-hans'

/**
 * 用于便捷的管理WebGPU或Blockly工作区
 * 
 * 用一个就好了！
 */
class Blocks implements IBlocks {
    workspaceSvg: Blockly.WorkspaceSvg | null;
    Blockly: typeof Blockly;
    supportLanguages: { 'en': Language; 'zh-Hans': Language; };
    workspaceConfig: Blockly.BlocklyOptions | any;
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
            // Blockly太坏了语言包自己会报语法错误
            // @ts-expect-error
            'en': En,
            // @ts-expect-error
            'zh-Hans': ZhHans
        }
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
            // 多选插件的配置选项
            // 拖拽后碰撞邻居积木以避免重叠
            bumpNeighbours: false,
            // 保持多个同类型积木的字段值相同
            multiFieldUpdate: true,
            // 鼠标进入工作区时自动聚焦
            // 这玩意怪怪的
            workspaceAutoFocus: false,
            // 多选快捷键，默认是 Shift
            // 值得一提的是，按住 Ctrl 可以拖出单个积木
            multiSelectKeys: ['Shift'],
            // 复制粘贴配置
            multiselectCopyPaste: {
                // 启用跨标签页复制粘贴功能
                crossTab: true,
                // 显示复制粘贴菜单项
                menu: true,
            },
            multiselectIcon: {
                hideIcon: false,
                weight: 3,
                // todo: 用本地的
                enabledIcon: 'https://github.com/mit-cml/workspace-multiselect/raw/main/test/media/select.svg',
                disabledIcon: 'https://github.com/mit-cml/workspace-multiselect/raw/main/test/media/unselect.svg',
            },
        }
    }

    init(): void {
        // 对于完全不需要现在的工作区的
        ContinuousToolbox.registerContinuousToolbox();
        // 对于需要现在的工作区的
        if (this.workspaceSvg) {
            // https://github.com/mit-cml/workspace-multiselect
            // 哪有问题你倒是说一下啊 @cyberexplorer
            console.log(this.workspaceSvg)
            const multiselectPlugin = new Multiselect(this.workspaceSvg);
            multiselectPlugin.init(this.workspaceConfig);
        }
    };

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
        return !!this.workspaceSvg
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

export default Blocks