/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由 Ai 生成

/**
 * C 型积木的包围行为。
 *
 * 原生 Blockly 里，把一个 C 型积木（如 `重复执行`）拖到已有积木上方时，
 * 只会插到它前面；ASH 希望它把下方的积木「吃进嘴里」。
 *
 * 这里只管包围，不管「什么能连什么」——那是 connectionRules.ts 的事。
 */

import * as Blockly from 'blockly/core';

/** 防止重复安装 */
let installed = false;

/**
 * 取积木第一个 statement input（俗称「嘴」）。
 *
 * 注意排除 `block.nextConnection`：它同样是 NEXT_STATEMENT 类型，
 * 但那是积木下方的接口，不是嘴。
 */
export const getFirstStatementInput = (block: Blockly.BlockSvg): Blockly.Connection | null => {
    for (const input of block.inputList) {
        const conn = input.connection;
        if (conn?.type === Blockly.ConnectionType.NEXT_STATEMENT && conn !== block.nextConnection) {
            return conn;
        }
    }
    return null;
};

/**
 * 判断一次被 super 否决的拖拽是否属于「terminal C 块包围」，可以放行。
 *
 * terminal C 块指没有 nextConnection 但有嘴的积木（如 `永远重复`）。
 * 这种积木无法接在别人下面，原生逻辑会直接拒绝它挤入已占用的 NEXT_STATEMENT，
 * 于是用户没法用它包住现有代码。
 *
 * 由 {@link AshConnectionChecker.doDragChecks} 在 super 否决后调用。
 */
export const allowCBlockWrapDrag = (
    a: Blockly.RenderedConnection,
    b: Blockly.RenderedConnection,
    distance: number,
): boolean => {
    if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        b.type !== Blockly.ConnectionType.NEXT_STATEMENT ||
        b.getSourceBlock().isInsertionMarker()
    ) {
        return false;
    }

    const aBlock = a.getSourceBlock();
    if (aBlock.nextConnection || !getFirstStatementInput(aBlock)) return false;

    // 仍要求被挤走的块可移动（否则无法愈合），shadow 视为可移动
    const target = b.targetBlock();
    if (!target || !(target.isMovable() || target.isShadow())) return false;

    // 距离检查仍需满足（super 可能因距离否决，此处不应放行）
    return a.distanceFrom(b) <= distance;
};

/**
 * 安装包围行为所需的两处 Blockly 补丁。
 *
 * 之所以只能靠 monkey patch：这两个都是 Blockly 的静态方法／原型方法，
 * 没有提供注册表或 hook 供外部替换。
 */
export const installCBlockWrap = (BlocklyNS: typeof Blockly): void => {
    if (installed) return;
    installed = true;

    const Connection = BlocklyNS.Connection;
    const InsertionMarkerPreviewer = BlocklyNS.InsertionMarkerPreviewer;

    // 补丁一：C 块插入后，原地的积木成了「孤儿」，决定它去哪。
    const originalGetConnection = Connection.getConnectionForOrphanedConnection.bind(Connection);
    Connection.getConnectionForOrphanedConnection = (
        startBlock: Blockly.Block,
        orphanConnection: Blockly.Connection,
    ): Blockly.Connection | null => {
        // 仅处理栈式孤儿（PREVIOUS_STATEMENT）；OUTPUT 维持原逻辑
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (orphanConnection.type === Blockly.ConnectionType.PREVIOUS_STATEMENT) {
            const mouth = getFirstStatementInput(startBlock as Blockly.BlockSvg);
            // 嘴空闲且类型兼容 → 把孤儿放进嘴里（包围）
            if (mouth) {
                const checker = orphanConnection.getConnectionChecker();
                if (checker.canConnect(orphanConnection, mouth, false)) {
                    return mouth;
                }
            }
        }
        return originalGetConnection(startBlock, orphanConnection);
    };

    // 补丁二：撤下拖拽预览的虚影时，把被虚影吃进嘴里的积木还回原位。
    const proto = InsertionMarkerPreviewer.prototype as unknown as {
        hideInsertionMarker: (markerConn: Blockly.RenderedConnection) => void;
    };
    const originalHide = proto.hideInsertionMarker;
    proto.hideInsertionMarker = (markerConn: Blockly.RenderedConnection): void => {
        const marker = markerConn.getSourceBlock();
        const mouth = getFirstStatementInput(marker);
        const markerPrev = marker.previousConnection;

        if (mouth && mouth.isConnected() && markerPrev?.targetConnection) {
            const mouthChild = mouth.targetBlock();
            if (mouthChild && !mouthChild.isInsertionMarker()) {
                const bPrev = mouthChild.previousConnection;
                const aNext = markerPrev.targetConnection;
                mouth.disconnect();
                markerPrev.disconnect();
                if (bPrev) {
                    bPrev.connect(aNext);
                }
                marker.dispose();
                return;
            }
        }
        // 非包围情形：走默认实现
        originalHide(markerConn);
    };
};
