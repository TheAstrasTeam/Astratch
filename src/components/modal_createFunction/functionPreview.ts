/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly';
import { BlocksColor, OPCODES, type IBlockColor } from '../../types/blocks';
import type { IFunctionReference } from '../../types/blocks';
import { t } from 'i18next';

export type TFunctionReturnField =
    'text' | 'dropdown' | 'boolean' | 'array' | 'object' | 'string' | 'number' | 'function' | null;

export type TFunctionInputField = 'boolean' | 'array' | 'object' | 'string' | 'number' | 'function';

export type TFunctionFieldType = TFunctionReturnField | TFunctionInputField[];

/** 一个函数的返回类型；null 表示没有返回值。 */
export type TFunctionReturnType = TFunctionInputField | TFunctionInputField[] | null;

export interface TPreviewFunctionData {
    type: TFunctionFieldType;
    text?: string;
}
export interface IFunctionValueBlock extends Blockly.Block {
    previewData: TPreviewFunctionData[];
    colors: IBlockColor;
    /** 持久化时指向 VM 中函数配置的稳定引用。 */
    functionRef: IFunctionReference | null;
    /** 是否显示为可传递的函数值；false 时显示为 Scratch 式积木。 */
    isValue: boolean;
    /** 函数返回类型；null 表示语句积木或无返回值。 */
    returnType: TFunctionReturnType;
    editMode: boolean;
    /** 当前激活（上次点击）的输入下标；-1 表示没有。 */
    activeInputIndex?: number;
    /** 控制栏 (foreignObject) */
    controlBar?: SVGForeignObjectElement | null;
    updateShape(): void;
    moveField(index: number, delta: number): void;
    removeField(index: number): void;
    selectInput(index: number): void;
    deselectInput(): void;
    updateControlBar(): void;
    onchange(): void;
}

const previewBlockId = 'preview-function';
const previewWrapperId = 'preview-function-wrapper';
let previewFunctionData: TPreviewFunctionData[] = [];
let previewBlockColor: IBlockColor = BlocksColor.function;
let previewBlock: IFunctionValueBlock | null = null;
let previewWrapperBlock: Blockly.BlockSvg | null = null;
let previewWorkspace: Blockly.WorkspaceSvg | null = null;
let previewRootBlock: Blockly.BlockSvg | IFunctionValueBlock | null = null;
let previewIsValue = true;
let previewReturnType: TFunctionReturnType = null;
let previewSession = 0;
let setupFrame: number | null = null;
let focusFrame: number | null = null;
let focusTimer: number | null = null;
let layoutFrame: number | null = null;

const isCurrentPreview = (
    session: number,
    workspace: Blockly.WorkspaceSvg,
    block: IFunctionValueBlock,
) =>
    session === previewSession &&
    workspace === previewWorkspace &&
    block === previewBlock &&
    !block.isDeadOrDying() &&
    !previewRootBlock?.isDeadOrDying();

const checksForReturnType = (returnType: TFunctionReturnType): string[] | null => {
    if (returnType === null) return null;
    const types = Array.isArray(returnType) ? returnType : [returnType];
    return types.map(type => `${type.charAt(0).toUpperCase()}${type.slice(1)}`);
};

const centerPreviewRoot = (workspace: Blockly.WorkspaceSvg) => {
    const root = previewRootBlock;
    if (!root || root.isDeadOrDying()) return;
    workspace.centerOnBlock(root.id);
};

/** 等 Blockly 完成当前渲染队列后，再按整棵预览树重新测量和居中。 */
const schedulePreviewLayout = (
    workspace: Blockly.WorkspaceSvg,
    session: number,
    block: IFunctionValueBlock,
) => {
    if (layoutFrame !== null) cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {
        layoutFrame = requestAnimationFrame(() => {
            layoutFrame = null;
            if (!isCurrentPreview(session, workspace, block)) return;
            Blockly.common.svgResize(workspace);
            centerPreviewRoot(workspace);
        });
    });
};

/** 删除外层调用积木，同时先断开内部签名，避免 Blockly 连带销毁签名。 */
const disposePreviewWrapper = () => {
    if (!previewWrapperBlock) return;
    if (previewWrapperBlock.isDeadOrDying()) {
        previewWrapperBlock = null;
        return;
    }
    const functionConnection = previewWrapperBlock.getInput('FUNCTION')?.connection;
    if (functionConnection?.isConnected()) functionConnection.disconnect();
    previewWrapperBlock.dispose(false);
    previewWrapperBlock = null;
};

/** 根据当前预览配置设置签名积木的连接形状。 */
const configureSignatureConnections = () => {
    if (!previewBlock) return;

    if (previewBlock.previousConnection?.isConnected()) {
        previewBlock.previousConnection.disconnect();
    }
    if (previewBlock.nextConnection?.isConnected()) {
        previewBlock.nextConnection.disconnect();
    }

    if (!previewIsValue) {
        if (previewReturnType === null) {
            previewBlock.setOutput(false);
            previewBlock.setPreviousStatement(true, 'Action');
            previewBlock.setNextStatement(true, 'Action');
        } else {
            previewBlock.setPreviousStatement(false);
            previewBlock.setNextStatement(false);
            previewBlock.setOutput(true, checksForReturnType(previewReturnType));
        }
    } else {
        previewBlock.setPreviousStatement(false);
        previewBlock.setNextStatement(false);
        previewBlock.setOutput(true, 'Function');
    }

    (previewBlock as unknown as Blockly.BlockSvg).render();
};

/** 按当前配置创建或移除外层调用积木。 */
const configurePreviewWrapper = () => {
    if (!previewWorkspace || !previewBlock) return;

    disposePreviewWrapper();
    if (!previewIsValue) {
        previewRootBlock = previewBlock;
        return;
    }

    const wrapperType =
        previewReturnType === null ? OPCODES.FUNCTION_EXECUTE : OPCODES.FUNCTION_CALL;
    const wrapper = Blockly.serialization.blocks.append(
        {
            id: previewWrapperId,
            type: wrapperType,
        },
        previewWorkspace,
    ) as Blockly.BlockSvg;
    wrapper.setMovable(false);
    wrapper.setDeletable(false);
    // 预览里的签名不是 FUNCTION_INLINE；禁止调用积木的自动实参同步，
    // 否则接入签名时会切换到手动模式并额外渲染「⊕」。
    wrapper.setOnChange(() => undefined);
    wrapper.contextMenu = false;

    const functionConnection = wrapper.getInput('FUNCTION')?.connection;
    if (!functionConnection || !previewBlock.outputConnection) {
        wrapper.dispose(false);
        previewRootBlock = previewBlock;
        return;
    }
    functionConnection.connect(previewBlock.outputConnection);

    if (previewReturnType !== null) {
        wrapper.outputConnection?.setCheck(checksForReturnType(previewReturnType));
    }

    previewWrapperBlock = wrapper;
    previewRootBlock = wrapper;
};

const applyPreviewConfig = () => {
    if (!previewWorkspace || !previewBlock) return;

    Blockly.WidgetDiv.hide();
    previewBlock.deselectInput();
    disposePreviewWrapper();
    if (previewBlock.outputConnection?.isConnected()) {
        previewBlock.outputConnection.disconnect();
    }

    previewBlock.isValue = previewIsValue;
    previewBlock.updateShape();
    configureSignatureConnections();
    configurePreviewWrapper();
    disablePreviewContextMenu();

    Blockly.common.svgResize(previewWorkspace);
    centerPreviewRoot(previewWorkspace);
    schedulePreviewLayout(previewWorkspace, previewSession, previewBlock);
};

const setupWorkspace = (workspace: Blockly.WorkspaceSvg) => {
    const session = ++previewSession;
    previewWorkspace = workspace;
    workspace.configureContextMenu = options => {
        options.length = 0;
    };

    previewBlock = Blockly.serialization.blocks.append(
        {
            id: previewBlockId,
            type: OPCODES.FUNCTION_VALUE,
            extraState: { params: previewFunctionData, isValue: true },
        },
        previewWorkspace,
    ) as IFunctionValueBlock;
    previewBlock.setMovable(false);
    previewBlock.previewData = previewFunctionData;
    previewBlock.colors = previewBlockColor;
    previewBlock.editMode = true;
    previewBlock.setDeletable(false);
    previewBlock.updateShape();
    applyPreviewConfig();
    disablePreviewContextMenu();
    const block = previewBlock;
    setupFrame = requestAnimationFrame(() => {
        setupFrame = null;
        if (!isCurrentPreview(session, workspace, block)) return;
        centerPreviewRoot(workspace);
        addFieldForFunctionPreview({
            type: 'text',
            text: t('blocks:function.defaultTitle'),
        });
    });
};

/** 关掉预览工作区里所有积木（含影子积木）的右键菜单。 */
const disablePreviewContextMenu = () => {
    if (!previewWorkspace) return;
    for (const block of previewWorkspace.getAllBlocks(false)) {
        block.contextMenu = false;
    }
};

const disposePreviewWorkspace = () => {
    previewSession++;
    if (setupFrame !== null) cancelAnimationFrame(setupFrame);
    if (focusFrame !== null) cancelAnimationFrame(focusFrame);
    if (layoutFrame !== null) cancelAnimationFrame(layoutFrame);
    if (focusTimer !== null) clearTimeout(focusTimer);
    setupFrame = null;
    focusFrame = null;
    layoutFrame = null;
    focusTimer = null;

    const workspace = previewWorkspace;
    Blockly.WidgetDiv.hide();
    disposePreviewWrapper();
    previewBlock?.controlBar?.remove();
    previewWorkspace = null;
    previewBlock = null;
    previewRootBlock = null;
    previewFunctionData = [];
    previewIsValue = true;
    previewReturnType = null;
    workspace?.dispose();
};

const resizePreviewWorkspace = () => {
    requestAnimationFrame(() => {
        if (!previewWorkspace) return;
        Blockly.common.svgResize(previewWorkspace);
        centerPreviewRoot(previewWorkspace);
    });
};

const addFieldForFunctionPreview = (data: TPreviewFunctionData) => {
    const workspace = previewWorkspace;
    const block = previewBlock;
    const session = previewSession;
    if (!workspace || !block) return;

    const index = previewFunctionData.length;
    previewFunctionData.push(data);
    block.updateShape();
    disablePreviewContextMenu();
    schedulePreviewLayout(workspace, session, block);

    if (focusTimer !== null) clearTimeout(focusTimer);
    if (focusFrame !== null) cancelAnimationFrame(focusFrame);
    focusTimer = window.setTimeout(() => {
        focusTimer = null;
        if (!isCurrentPreview(session, workspace, block)) return;

        Blockly.common.svgResize(workspace);
        centerPreviewRoot(workspace);

        focusFrame = requestAnimationFrame(() => {
            focusFrame = null;
            if (!isCurrentPreview(session, workspace, block)) return;

            const field =
                data.type === 'text'
                    ? block.getField(`TEXT_${String(index)}`)
                    : block
                          .getInput(`ARG${String(index)}`)
                          ?.connection?.targetBlock()
                          ?.getField('ID');

            field?.showEditor();
            // 自动编辑不应只依赖字段覆写来同步 controlbar；这里显式确认选中状态。
            block.selectInput(index);
        });
    }, 200);
};

const setPreviewBlockColor = (color: IBlockColor) => {
    previewBlockColor = color;
    if (!previewBlock) return;
    previewBlock.colors = previewBlockColor;
    previewBlock.updateShape();
};

const setPreviewConfig = (config: { isValue: boolean; returnType: TFunctionReturnType }) => {
    previewIsValue = config.isValue;
    previewReturnType = config.returnType;
    applyPreviewConfig();
};

const previewFunctionBlocksColorScheme = [
    ...Object.values(BlocksColor).filter(color => typeof color === 'object'),
];

export {
    addFieldForFunctionPreview,
    disposePreviewWorkspace,
    resizePreviewWorkspace,
    setupWorkspace,
    setPreviewBlockColor,
    setPreviewConfig,
    previewWorkspace,
    previewFunctionData,
    previewFunctionBlocksColorScheme,
    previewBlock,
    previewBlockColor,
};
