/**
 * C 型积木在blockly中会直接插入最上面，而不能根据鼠标位置动态推断
 */

import * as Blockly from 'blockly/core';

/** 防止重复安装 */
let installed = false;

/**
 * 自定义连接检查器：放宽 terminal C 块（无 nextConnection，如 forever）的拖拽限制
 */
export class AshConnectionChecker extends Blockly.ConnectionChecker {
    override doDragChecks(
        a: Blockly.RenderedConnection,
        b: Blockly.RenderedConnection,
        distance: number,
    ): boolean {
        const superResult = super.doDragChecks(a, b, distance);
        if (superResult) return true;

        // super 否决后，针对 terminal C 块挤入已占用 NEXT_STATEMENT 的情形放行。
        if (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            b.type === Blockly.ConnectionType.NEXT_STATEMENT &&
            !b.getSourceBlock().isInsertionMarker()
        ) {
            const aBlock = a.getSourceBlock();
            // terminal C 块：无 nextConnection 但有 statement input（嘴）
            if (!aBlock.nextConnection && getFirstStatementInput(aBlock)) {
                const target = b.targetBlock();
                // 仍要求被挤走的块可移动（否则无法愈合），shadow 视为可移动
                if (target && (target.isMovable() || target.isShadow())) {
                    // 距离检查仍需满足（super 可能因距离否决，此处不应放行）
                    if (a.distanceFrom(b) <= distance) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

/**
 * 取积木第一个 statement input
 */
const getFirstStatementInput = (block: Blockly.BlockSvg): Blockly.Connection | null => {
    for (const input of block.inputList) {
        const conn = input.connection;
        if (conn?.type === Blockly.ConnectionType.NEXT_STATEMENT && conn !== block.nextConnection) {
            return conn;
        }
    }
    return null;
}

export const installCBlockWrap = (BlocklyNS: typeof Blockly): void => {
    if (installed) return;
    installed = true;

    const Connection = BlocklyNS.Connection;
    const InsertionMarkerPreviewer = BlocklyNS.InsertionMarkerPreviewer;

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
}
