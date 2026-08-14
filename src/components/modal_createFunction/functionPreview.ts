/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly';
import { OPCODES, type IFunctionValueBlock, type TPreviewFunctionData } from '../../types/blocks';
import { t } from 'i18next';

const previewBlockId = 'preview-function';
let previewFunctionData: TPreviewFunctionData[] = [];
let previewBlock: IFunctionValueBlock | null = null;
let previewWorkspace: Blockly.WorkspaceSvg | null = null;

const setupWorkspace = (workspace: Blockly.WorkspaceSvg) => {
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
    previewBlock.editMode = true;
    previewBlock.setDeletable(false);
    previewBlock.updateShape();
    disablePreviewContextMenu();
    requestAnimationFrame(() => {
        previewWorkspace?.centerOnBlock(previewBlockId);
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
    if (previewWorkspace) {
        previewWorkspace.dispose();
        previewWorkspace = null;
        previewBlock = null;
        previewFunctionData = [];
    }
};

const resizePreviewWorkspace = () => {
    requestAnimationFrame(() => {
        if (!previewWorkspace) return;
        Blockly.common.svgResize(previewWorkspace);
        previewWorkspace.centerOnBlock(previewBlockId);
    });
};

const addFieldForFunctionPreview = (data: TPreviewFunctionData) => {
    if (!previewBlock) return;
    const index = previewFunctionData.length;
    previewFunctionData.push(data);
    previewBlock.updateShape();
    disablePreviewContextMenu();
    setTimeout(() => {
        const workspace = previewWorkspace;
        const block = previewBlock;
        if (!workspace || !block) return;

        Blockly.common.svgResize(workspace);
        workspace.centerOnBlock(previewBlockId);

        const field =
            data.type === 'text'
                ? block.getField(`TEXT_${String(index)}`)
                : block
                      .getInput(`ARG${String(index)}`)
                      ?.connection?.targetBlock()
                      ?.getField('ID');

        field?.showEditor();
    }, 200);
};

export {
    addFieldForFunctionPreview,
    disposePreviewWorkspace,
    resizePreviewWorkspace,
    setupWorkspace,
    previewWorkspace,
    previewFunctionData,
    previewBlock,
};
