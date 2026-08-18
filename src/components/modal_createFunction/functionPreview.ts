/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly';
import { BlocksColor, OPCODES, type IBlockColor } from '../../types/blocks';
import { t } from 'i18next';

export type TFunctionReturnField =
    'text' | 'dropdown' | 'boolean' | 'array' | 'object' | 'string' | 'number' | 'function' | null;

export type TFunctionInputField = 'boolean' | 'array' | 'object' | 'string' | 'number' | 'function';

export type TFunctionFieldType = TFunctionReturnField | TFunctionInputField[];

export interface TPreviewFunctionData {
    type: TFunctionFieldType;
    text?: string;
}
export interface IFunctionValueBlock extends Blockly.Block {
    previewData: TPreviewFunctionData[];
    colors: IBlockColor;
    editMode: boolean;
    /** 当前激活（上次点击）的输入下标；-1 表示没有。 */
    activeInputIndex?: number;
    /** 控制栏 foreignObject（挂在积木根组下，随工作区平移缩放）。 */
    controlBar?: SVGForeignObjectElement | null;
    updateShape(): void;
    moveField(index: number, delta: number): void;
    /** 从预览数据里移除一个输入并重建形状（编辑模式下）。 */
    removeField(index: number): void;
    /** 选中（其编辑器被打开）指定输入框并显示控制栏。 */
    selectInput(index: number): void;
    /** 取消选中当前输入框（销毁控制栏）。 */
    deselectInput(): void;
    /** 重建并定位控制栏到激活输入框上方。 */
    updateControlBar(): void;
}

const previewBlockId = 'preview-function';
let previewFunctionData: TPreviewFunctionData[] = [];
let previewBlockColor: IBlockColor = BlocksColor.function;
let previewBlock: IFunctionValueBlock | null = null;
let previewWorkspace: Blockly.WorkspaceSvg | null = null;
let previewSession = 0;
let setupFrame: number | null = null;
let focusFrame: number | null = null;
let focusTimer: number | null = null;

const isCurrentPreview = (
    session: number,
    workspace: Blockly.WorkspaceSvg,
    block: IFunctionValueBlock,
) =>
    session === previewSession &&
    workspace === previewWorkspace &&
    block === previewBlock &&
    !block.isDeadOrDying();

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
            extraState: { params: previewFunctionData },
        },
        previewWorkspace,
    ) as IFunctionValueBlock;
    previewBlock.setMovable(false);
    previewBlock.previewData = previewFunctionData;
    previewBlock.colors = previewBlockColor;
    previewBlock.editMode = true;
    previewBlock.setDeletable(false);
    previewBlock.updateShape();
    disablePreviewContextMenu();
    const block = previewBlock;
    setupFrame = requestAnimationFrame(() => {
        setupFrame = null;
        if (!isCurrentPreview(session, workspace, block)) return;
        workspace.centerOnBlock(previewBlockId);
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
    if (focusTimer !== null) clearTimeout(focusTimer);
    setupFrame = null;
    focusFrame = null;
    focusTimer = null;

    const workspace = previewWorkspace;
    previewBlock?.controlBar?.remove();
    previewWorkspace = null;
    previewBlock = null;
    previewFunctionData = [];
    workspace?.dispose();
};

const resizePreviewWorkspace = () => {
    requestAnimationFrame(() => {
        if (!previewWorkspace) return;
        Blockly.common.svgResize(previewWorkspace);
        previewWorkspace.centerOnBlock(previewBlockId);
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

    if (focusTimer !== null) clearTimeout(focusTimer);
    if (focusFrame !== null) cancelAnimationFrame(focusFrame);
    focusTimer = window.setTimeout(() => {
        focusTimer = null;
        if (!isCurrentPreview(session, workspace, block)) return;

        Blockly.common.svgResize(workspace);
        workspace.centerOnBlock(previewBlockId);

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
    if (!previewBlock) return;
    previewBlockColor = color;
    previewBlock.colors = previewBlockColor;
    previewBlock.updateShape();
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
    previewWorkspace,
    previewFunctionData,
    previewFunctionBlocksColorScheme,
    previewBlock,
    previewBlockColor,
};
