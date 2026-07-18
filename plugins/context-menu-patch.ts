/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由 Ai 生成

/**
 * Blockly 右键菜单 patch：替换原生 HTML 菜单为自定义菜单
 * 同时覆盖鼠标右键（Gesture）和键盘快捷键（Ctrl+Enter / Shift+F10 / Menu键）
 *
 * 位置算法完全还原 Blockly 原生实现。
 */

import * as Blockly from 'blockly/core';

/** 防止重复安装 */
let installed = false;

/** 自定义菜单回调：options=菜单选项, event=触发事件, location=屏幕坐标 */
export type ContextMenuCallback = (
    options: Blockly.ContextMenuRegistry.ContextMenuOption[],
    event: Event,
    location: { x: number; y: number },
) => void;

let onShowContextMenu: ContextMenuCallback | null = null;

/**
 * 设置自定义菜单回调（在 install 之前或之后调用均可）
 */
export const setContextMenuHandler = (callback: ContextMenuCallback): void => {
    onShowContextMenu = callback;
};

const showCustom = (
    options: Blockly.ContextMenuRegistry.ContextMenuOption[],
    e: Event,
    location: { x: number; y: number },
): void => {
    onShowContextMenu?.(options, e, location);
};

/**
 * 安装 context menu patch
 */
export const installContextMenuPatch = (BlocklyNS: typeof Blockly): void => {
    if (installed) return;
    installed = true;

    patchGesture(BlocklyNS);
    patchBlockSvg(BlocklyNS);
    patchWorkspaceSvg(BlocklyNS);
    patchRenderedWorkspaceComment(BlocklyNS);
    patchRenderedConnection(BlocklyNS);
};

/**
 * Gesture patch：阻止原生 handleRightClick 走 ContextMenu.show，
 * 改走被 patch 的 showContextMenu。Gesture 只做自身特有的清理工作。
 */
const patchGesture = (BlocklyNS: typeof Blockly): void => {
    const proto = BlocklyNS.Gesture.prototype;
    proto.handleRightClick = function (e: PointerEvent) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const self = this as any;
        const focusedNode = BlocklyNS.getFocusManager().getFocusedNode();
        const menuTarget = focusedNode as unknown as Blockly.IContextMenu | null;
        if (menuTarget && typeof menuTarget.showContextMenu === 'function') {
            self.startWorkspace_?.hideChaff(!!self.flyout);
            menuTarget.showContextMenu(e);
        }
        e.preventDefault();
        e.stopPropagation();
        BlocklyNS.keyboardNavigationController.setIsActive(false);
        this.dispose();
    };
};

/**
 * BlockSvg.showContextMenu：原生位置算法（第一个可见 field 下方）
 */
const patchBlockSvg = (BlocklyNS: typeof Blockly): void => {
    const proto = BlocklyNS.BlockSvg.prototype as Blockly.BlockSvg & {
        generateContextMenu(
            e: Event,
        ):
            | (
                  | Blockly.ContextMenuRegistry.ContextMenuOption
                  | Blockly.ContextMenuRegistry.LegacyContextMenuOption
              )[]
            | null;
        calculateContextMenuLocation(e: Event): Blockly.utils.Coordinate;
    };
    proto.showContextMenu = function (e: Event) {
        const menuOptions = this.generateContextMenu(e);
        if (!menuOptions?.length) return;
        const location = this.calculateContextMenuLocation(e);
        BlocklyNS.ContextMenu.setCurrentBlock(this);
        showCustom(menuOptions as Blockly.ContextMenuRegistry.ContextMenuOption[], e, {
            x: location.x,
            y: location.y,
        });
    };
};

/**
 * WorkspaceSvg.showContextMenu：原生位置算法（pointer 用坐标，keyboard 用左上角）
 */
const patchWorkspaceSvg = (BlocklyNS: typeof Blockly): void => {
    const proto = BlocklyNS.WorkspaceSvg.prototype;
    proto.showContextMenu = function (e: Event) {
        if (this.isReadOnly() || this.isFlyout) return;
        const menuOptions = BlocklyNS.ContextMenuRegistry.registry.getContextMenuOptions(
            { workspace: this, focusedNode: this },
            e,
        );
        if (this.configureContextMenu) {
            this.configureContextMenu(menuOptions, e);
        }
        if (!menuOptions.length) return;

        let location: { x: number; y: number };
        if (e instanceof PointerEvent) {
            location = { x: e.clientX, y: e.clientY };
        } else {
            const x = this.RTL ? this.getWidth() - 5 : 5;
            const coord = BlocklyNS.utils.svgMath.wsToScreenCoordinates(
                this,
                new BlocklyNS.utils.Coordinate(x, 5),
            );
            location = { x: coord.x, y: coord.y };
        }
        showCustom(menuOptions, e, location);
    };
};

/**
 * RenderedWorkspaceComment.showContextMenu：原生位置算法（pointer 用坐标，keyboard 平移 10,10）
 */
const patchRenderedWorkspaceComment = (BlocklyNS: typeof Blockly): void => {
    const proto = BlocklyNS.comments.RenderedWorkspaceComment.prototype;
    proto.showContextMenu = function (e: Event) {
        const menuOptions = BlocklyNS.ContextMenuRegistry.registry.getContextMenuOptions(
            { comment: this, focusedNode: this },
            e,
        );
        if (!menuOptions.length) return;

        let location: { x: number; y: number };
        if (e instanceof PointerEvent) {
            location = { x: e.clientX, y: e.clientY };
        } else {
            const xy = BlocklyNS.utils.svgMath.wsToScreenCoordinates(
                this.workspace,
                this.getRelativeToSurfaceXY(),
            );
            location = { x: xy.x + 10, y: xy.y + 10 };
        }
        showCustom(menuOptions, e, location);
    };
};

/**
 * RenderedConnection.showContextMenu：原生位置算法（pointer 用坐标，keyboard 用 connection 坐标平移）
 */
const patchRenderedConnection = (BlocklyNS: typeof Blockly): void => {
    const proto = BlocklyNS.RenderedConnection.prototype;
    proto.showContextMenu = function (e: Event) {
        const menuOptions = BlocklyNS.ContextMenuRegistry.registry.getContextMenuOptions(
            { focusedNode: this },
            e,
        );
        if (!menuOptions.length) return;

        const block = this.getSourceBlock();
        let location: { x: number; y: number };
        if (e instanceof PointerEvent) {
            location = { x: e.clientX, y: e.clientY };
        } else {
            const coord = BlocklyNS.utils.svgMath.wsToScreenCoordinates(
                block.workspace,
                new BlocklyNS.utils.Coordinate(this.x, this.y),
            );
            location = { x: coord.x + (block.RTL ? -5 : 5), y: coord.y + 5 };
        }
        showCustom(menuOptions, e, location);
    };
};
