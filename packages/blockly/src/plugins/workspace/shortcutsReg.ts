/**
 * @author AI
 * @checked
 * 让Ai加了下复制和剪切的支持
 * 不过它顺手给优化了一下代码...
 * 看起来不错，不做更改
 */
import * as Blockly from 'blockly';
import { ashMultiSelectorManager } from './multiSelector';
import { t } from 'astratch-i18n';

const MULTI_PASTER_TYPE = 'ashMultiBlock';

interface MultiBlockCopyData extends Blockly.ICopyData {
    paster: typeof MULTI_PASTER_TYPE;
    blockStates: Blockly.serialization.blocks.State[];
    origin: Blockly.utils.Coordinate;
    typeCounts: { [key: string]: number };
}

class multiClipboardTools {
    static getBlocksForClipboard(workspace: Blockly.WorkspaceSvg): Blockly.BlockSvg[] {
        const selected = (
            ashMultiSelectorManager.getWorkspace(workspace.id)?.getSelectedBlocks() ?? []
        )
            .map(selection => selection.blockSvg)
            .filter(block => !block.isDeadOrDying() && block.isMovable() && block.isDeletable());
        if (selected.length) return selected;

        const focused = Blockly.getFocusManager().getFocusedNode();
        return focused instanceof Blockly.BlockSvg &&
            !focused.isDeadOrDying() &&
            focused.isMovable() &&
            focused.isDeletable()
            ? [focused]
            : [];
    }
    static buildMultiCopyData(roots: Blockly.BlockSvg[]): MultiBlockCopyData {
        const blockStates = roots.map(
            block =>
                Blockly.serialization.blocks.save(block, {
                    addCoordinates: true,
                    saveIds: false,
                }) as Blockly.serialization.blocks.State,
        );

        const positions = roots.map(block => block.getRelativeToSurfaceXY());
        // 左上角积木的坐标
        const origin = new Blockly.utils.Coordinate(
            Math.min(...positions.map(position => position.x)),
            Math.min(...positions.map(position => position.y)),
        );

        const typeCounts: { [key: string]: number } = {};
        for (const block of roots) {
            const counts = Blockly.common.getBlockTypeCounts(block);
            for (const [type, count] of Object.entries(counts)) {
                typeCounts[type] = (typeCounts[type] ?? 0) + count;
            }
        }

        return { paster: MULTI_PASTER_TYPE, blockStates, origin, typeCounts };
    }

    static copySelection(workspace: Blockly.WorkspaceSvg): boolean {
        const blocks = multiClipboardTools.getBlocksForClipboard(workspace);
        if (!blocks.length) return false;

        // 父块也被选中的子块会随父块一起序列化，只保留根块
        const selectedSet = new Set(blocks);
        const roots = blocks.filter(block => {
            const parent = block.getParent();
            return !parent || !selectedSet.has(parent);
        });

        const data = multiClipboardTools.buildMultiCopyData(roots);
        Blockly.clipboard.setLastCopiedData(data);
        Blockly.clipboard.setLastCopiedWorkspace(workspace);
        Blockly.clipboard.setLastCopiedLocation(data.origin);
        return true;
    }
}

class MultiBlockPaster implements Blockly.IPaster<
    Blockly.ICopyData,
    Blockly.ICopyable<Blockly.ICopyData>
> {
    /**
     * 获取积木到不重叠的偏移量
     * 修改自 `packages/blockly/core/clipboard/block_paster.ts`-`moveBlockToNotConflict`
     */
    private getBlockDistanceToNotConflict(
        block: Blockly.BlockSvg,
        originalPosition: Blockly.utils.Coordinate,
    ) {
        const pos = new Blockly.utils.Coordinate(
            block.workspace.RTL
                ? block.workspace.getWidth() - originalPosition.x
                : originalPosition.x,
            originalPosition.y,
        );
        const workspace = block.workspace;
        const snapRadius = 5;
        const bumpOffset = Blockly.utils.Coordinate.difference(pos, block.getRelativeToSurfaceXY());
        const offset = new Blockly.utils.Coordinate(0, 0);
        // getRelativeToSurfaceXY is really expensive, so we want to cache this.
        const otherCoords = workspace
            .getAllBlocks(false)
            .filter(otherBlock => otherBlock.id != block.id)
            .map(b => b.getRelativeToSurfaceXY());

        while (
            otherCoords.some(
                otherCoords =>
                    Math.abs(otherCoords.x - Blockly.utils.Coordinate.sum(pos, offset).x) <= 1 &&
                    Math.abs(otherCoords.y - Blockly.utils.Coordinate.sum(pos, offset).y) <= 1,
            ) ||
            block
                .getConnections_(false)
                .some(
                    connection =>
                        !!connection.closest(
                            snapRadius,
                            Blockly.utils.Coordinate.sum(bumpOffset, offset),
                        ).connection,
                )
        ) {
            if (workspace.RTL) {
                offset.translate(-snapRadius, snapRadius * 2);
            } else {
                offset.translate(snapRadius, snapRadius * 2);
            }
        }

        return offset;
    }
    paste(
        copyData: Blockly.ICopyData,
        workspace: Blockly.WorkspaceSvg,
        coordinate?: Blockly.utils.Coordinate,
    ): Blockly.BlockSvg | null {
        const data = copyData as MultiBlockCopyData;
        if (!workspace.isCapacityAvailable(data.typeCounts)) return null;

        const target = coordinate ?? data.origin;
        const groupShift = new Blockly.utils.Coordinate(
            target.x - data.origin.x,
            target.y - data.origin.y,
        );
        const group = Blockly.Events.getGroup();
        Blockly.Events.setGroup(true);
        const pasted: Blockly.BlockSvg[] = [];
        let offset: Blockly.utils.Coordinate | undefined;
        try {
            for (const state of data.blockStates) {
                const base = new Blockly.utils.Coordinate(
                    (state.x ?? 0) + groupShift.x,
                    (state.y ?? 0) + groupShift.y,
                );
                const shifted: Blockly.serialization.blocks.State = {
                    ...state,
                    x: base.x ?? 0,
                    y: base.y ?? 0,
                };
                const block = Blockly.serialization.blocks.append(shifted, workspace, {
                    recordUndo: true,
                }) as Blockly.BlockSvg;
                if (!offset) offset = this.getBlockDistanceToNotConflict(block, base);

                block.moveTo(Blockly.utils.Coordinate.sum(base, offset));
                pasted.push(block);

                pasted.push(block);
            }
        } finally {
            Blockly.Events.setGroup(group);
        }

        if (!pasted.length) return null;

        const manager = ashMultiSelectorManager.getWorkspace(workspace.id);
        if (manager) {
            manager.unselectAll();
            for (const block of pasted) manager.selectBlock(block, false);
            manager.focusLastBlock();
        }

        return pasted[pasted.length - 1];
    }
}

Blockly.clipboard.registry.register(MULTI_PASTER_TYPE, new MultiBlockPaster());

/** 删除选择的块 */
function deleteSelection(workspace: Blockly.WorkspaceSvg): void {
    const focused = Blockly.getFocusManager().getFocusedNode();
    const manager = ashMultiSelectorManager.getWorkspace(workspace.id);

    const toDelete = new Set<Blockly.BlockSvg>();
    if (focused instanceof Blockly.BlockSvg) toDelete.add(focused);
    for (const selection of manager?.getSelectedBlocks() ?? []) {
        toDelete.add(selection.blockSvg);
    }

    Blockly.Events.setGroup(true);
    try {
        workspace.hideChaff();
        for (const block of toDelete) {
            if (block.isDeadOrDying() || block.isInFlyout) continue;
            if (!block.isDeletable()) continue;
            if (block.outputConnection) block.dispose(false, true);
            else block.dispose(true, true);
        }
    } finally {
        Blockly.Events.setGroup(false);
    }

    manager?.unselectAll();
}

/** 为多选工作区替换快捷键 */
export const registerMultiSelectShortcuts = () => {
    const registry = Blockly.ShortcutRegistry.registry;
    const names = Blockly.ShortcutItems.names;

    registry.unregister(names.DELETE);
    registry.register(
        {
            name: names.DELETE,
            preconditionFn(workspace, scope) {
                const focused = scope.focusedNode;
                const manager = ashMultiSelectorManager.getWorkspace(workspace.id);
                const selected = manager?.getSelectedBlocks() ?? [];
                const result =
                    !workspace.isReadOnly() &&
                    ((Blockly.isDeletable(focused) && focused.isDeletable()) ||
                        selected.some(selection => selection.blockSvg.isDeletable())) &&
                    !workspace.isDragging() &&
                    !Blockly.getFocusManager().ephemeralFocusTaken();
                if (!result) workspace.getAudioManager().playErrorBeep();
                return result;
            },
            callback(workspace, e) {
                e.preventDefault();
                deleteSelection(workspace);
                return true;
            },
            keyCodes: [Blockly.utils.KeyCodes.DELETE, Blockly.utils.KeyCodes.BACKSPACE],
            displayText: () => Blockly.Msg['SHORTCUTS_DELETE'],
        },
        true,
    );

    registry.unregister(names.COPY);
    registry.register(
        {
            name: names.COPY,
            preconditionFn(workspace) {
                const result =
                    !workspace.isDragging() &&
                    !Blockly.getFocusManager().ephemeralFocusTaken() &&
                    multiClipboardTools.getBlocksForClipboard(workspace).length > 0;
                if (!result) workspace.getAudioManager().playErrorBeep();
                return result;
            },
            callback(workspace, e) {
                e.preventDefault();
                return multiClipboardTools.copySelection(workspace);
            },
            keyCodes: [
                registry.createSerializedKey(Blockly.utils.KeyCodes.C, [
                    Blockly.utils.KeyCodes.CTRL_CMD,
                ]),
            ],
            displayText: () => Blockly.Msg['COPY_SHORTCUT'],
        },
        true,
    );

    registry.unregister(names.CUT);
    registry.register(
        {
            name: names.CUT,
            preconditionFn(workspace) {
                const result =
                    !workspace.isReadOnly() &&
                    !workspace.isDragging() &&
                    !Blockly.getFocusManager().ephemeralFocusTaken() &&
                    multiClipboardTools.getBlocksForClipboard(workspace).length > 0;
                if (!result) workspace.getAudioManager().playErrorBeep();
                return result;
            },
            callback(workspace, e) {
                e.preventDefault();
                if (!multiClipboardTools.copySelection(workspace)) return false;
                deleteSelection(workspace);
                return true;
            },
            keyCodes: [
                registry.createSerializedKey(Blockly.utils.KeyCodes.X, [
                    Blockly.utils.KeyCodes.CTRL_CMD,
                ]),
            ],
            displayText: () => Blockly.Msg['CUT_SHORTCUT'],
        },
        true,
    );

    registry.register(
        {
            name: 'selectAll',
            callback(workspace, e) {
                e.preventDefault();
                const manager = ashMultiSelectorManager.getWorkspace(workspace.id);
                workspace.getAllBlocks().forEach(block => {
                    if (block && block.isMovable() && !block.isDeadOrDying())
                        manager?.selectBlock(block, false);
                });
                manager?.focusLastBlock();
                return true;
            },
            keyCodes: [
                registry.createSerializedKey(Blockly.utils.KeyCodes.A, [
                    Blockly.utils.KeyCodes.CTRL_CMD,
                ]),
            ],
            displayText: () => t('gui:selectAll'),
        },
        true,
    );
};
