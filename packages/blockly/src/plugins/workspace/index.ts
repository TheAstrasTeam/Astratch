import * as Blockly from 'blockly';
import { revertDrag } from '../../blockly';
import { ashWorkspaceSelector, AshMultiBlockDragStrategy } from './dragger';
import { ashMultiSelectorManager } from './multiSelector';

// @ts-expect-error 扩展基类是有必要的
// （话说这玩意编译能过嘛）
interface IPatchGesture extends Blockly.Gesture {
    updateIsDraggingWorkspace(): void;
    handleWsStart(e: PointerEvent, ws: Blockly.WorkspaceSvg): void;
    flyout: Blockly.IFlyout | null;
    startWorkspace_: Blockly.WorkspaceSvg | null;
    dragging: boolean;
    workspaceDragger: ashWorkspaceSelector | Blockly.WorkspaceDragger | null;
    mouseDownXY: Blockly.utils.Coordinate;
    gestureHasStarted: boolean;
    setStartWorkspace(ws: Blockly.WorkspaceSvg): void;
    mostRecentEvent: PointerEvent;
    targetBlock: Blockly.BlockSvg | null;
    startBubble: Blockly.IBubble | null;
    startComment: Blockly.comments.RenderedWorkspaceComment | null;
    startIcon: Blockly.IIcon | null;
    setTargetBlock(block: Blockly.BlockSvg): void;
    createDragger(draggable: Blockly.IDraggable): Blockly.IDragger;
    startBlock: Blockly.BlockSvg | null;
}

/**
 * 我们需要替换生成的 new WorkspaceDragger(this.startWorkspace_);
 * 最简单的方式是我们 patch 它
 */
function patchGesture(Gesture: Blockly.Gesture) {
    const patchedGesture = Gesture as unknown as IPatchGesture;

    patchedGesture.updateIsDraggingWorkspace = () => {
        if (!patchedGesture.startWorkspace_) {
            throw new Error(
                'Cannot update dragging the workspace because the ' +
                    'start workspace is undefined',
            );
        }

        const wsMovable = patchedGesture.flyout
            ? patchedGesture.flyout.isScrollable()
            : patchedGesture.startWorkspace_ && patchedGesture.startWorkspace_.isDraggable();
        if (!wsMovable) return;

        const isSubWorkspace =
            !!patchedGesture.flyout || !!patchedGesture.startWorkspace_?.isFlyout;

        patchedGesture.dragging = true;
        patchedGesture.workspaceDragger = isSubWorkspace
            ? new Blockly.WorkspaceDragger(patchedGesture.startWorkspace_)
            : new ashWorkspaceSelector(patchedGesture.startWorkspace_, patchedGesture.mouseDownXY);

        patchedGesture.workspaceDragger.startDrag();
    };

    patchedGesture.handleWsStart = (e: PointerEvent, ws: Blockly.WorkspaceSvg) => {
        if (patchedGesture.gestureHasStarted) {
            throw Error(
                'Tried to call gesture.handleWsStart, ' +
                    'but the gesture had already been started.',
            );
        }
        patchedGesture.setStartWorkspace(ws);
        patchedGesture.mostRecentEvent = e;

        if (
            !patchedGesture.targetBlock &&
            !patchedGesture.startBubble &&
            !patchedGesture.startComment &&
            !patchedGesture.startIcon
        ) {
            if (!(!!patchedGesture.flyout || !!patchedGesture.startWorkspace_?.isFlyout))
                ashMultiSelectorManager
                    .getWorkspace(patchedGesture.startWorkspace_?.id ?? '')
                    ?.unselectAll();
            Blockly.getFocusManager().focusNode(ws);
        }

        patchedGesture.doStart(e);
    };

    patchedGesture.setTargetBlock = (block: Blockly.BlockSvg) => {
        if (block.isShadow()) {
            patchedGesture.setTargetBlock(block.getParent()!);
        } else {
            patchedGesture.targetBlock = block;
            patchedGesture.targetBlock.bringToFront();
            Blockly.getFocusManager().focusNode(patchedGesture.targetBlock);
            ashMultiSelectorManager
                .getWorkspace(patchedGesture.startWorkspace_?.id ?? '')
                ?.unselectAll();
        }
    };

    const originalHandleBlockStart = patchedGesture.handleBlockStart.bind(patchedGesture);
    patchedGesture.handleBlockStart = (e: PointerEvent, block: Blockly.BlockSvg) => {
        // 没有代表点击的正是选中的块
        if (patchedGesture.startBlock) return;
        const workspace = ashMultiSelectorManager.getWorkspace(block.workspace.id ?? '');
        if (!workspace) return;
        originalHandleBlockStart(e, block);
        function onCtrl() {
            if (!workspace) return;
            if (workspace.isSelected(block)) {
                workspace.unselectBlock(block);
                if (workspace.getSelectedBlocks().length) {
                    workspace.focusLastBlock();
                } else {
                    Blockly.getFocusManager().focusNode(block.workspace);
                }
            } else {
                workspace.selectBlock(block, false);
            }
        }

        if (e.ctrlKey) {
            onCtrl();
            return;
        } else if (e.shiftKey) {
            /**
             * @author AI
             * @checked
             * AI制作的BFS算法，因为可以检查嵌套关系故用
             */
            interface BfsNode {
                block: Blockly.BlockSvg;
                prev: BfsNode | null;
                step: number;
            }

            const start: BfsNode = { block, prev: null, step: 0 };
            const queue: BfsNode[] = [start];
            const seen = new Set<string>([block.id]);

            let found: BfsNode | null = null;

            while (queue.length && !found) {
                const node = queue.shift()!;
                if (node.block !== block && workspace.isSelected(node.block)) {
                    found = node;
                    break;
                }
                for (const neighbor of [node.block.getParent(), ...node.block.getChildren(false)]) {
                    if (!neighbor || seen.has(neighbor.id)) continue;
                    seen.add(neighbor.id);
                    queue.push({ block: neighbor, prev: node, step: node.step + 1 });
                }
            }

            if (!found) {
                onCtrl();
                return;
            }

            // 还原路径
            const path: Blockly.BlockSvg[] = [];
            for (let node: BfsNode | null = found; node; node = node.prev) {
                path.push(node.block);
            }

            // 选中路径上的所有块
            for (const block of path) {
                workspace.selectBlock(block, false);
            }
            Blockly.getFocusManager().focusNode(block);
        } else {
            if (!workspace.isSelected(block)) workspace.unselectAll();
            workspace.selectBlock(block, false);
        }
    };

    /**
     * @author AI
     * @checked
     */
    const originalCreateDragger = patchedGesture.createDragger.bind(patchedGesture);
    patchedGesture.createDragger = (draggable: Blockly.IDraggable): Blockly.IDragger => {
        // 不是说好flyout会用workspace的手势吗，为什么这里不是
        if (draggable.workspace.isFlyout) return originalCreateDragger(draggable);
        const manager = ashMultiSelectorManager.getWorkspace(draggable.workspace.id)!;

        const selected = manager
            .getSelectedBlocks()
            .map(selection => selection.blockSvg)
            .filter(b => !b.isDeadOrDying() && b.isMovable());

        const block = selected.find(b => b === draggable);
        if (block && selected.length > 1) {
            // 只保留根块
            const selectedSet = new Set(selected);
            const roots = selected.filter(b => {
                const parent = b.getParent();
                return !parent || !selectedSet.has(parent);
            });

            // 被按住的块可能不是根（祖先也被选中），往上找它所属的根
            const rootSet = new Set(roots);
            let primaryRoot = block;
            while (!rootSet.has(primaryRoot) && primaryRoot.getParent()) {
                primaryRoot = primaryRoot.getParent() as Blockly.BlockSvg;
            }

            primaryRoot.setDragStrategy(
                new AshMultiBlockDragStrategy(primaryRoot, roots, primaryRoot.getDragStrategy()),
            );
            return new Blockly.dragging.Dragger(primaryRoot);
        }

        return originalCreateDragger(draggable);
    };
}

export class ashWorkspaceSvg extends Blockly.WorkspaceSvg {
    constructor(options: Blockly.Options & {}) {
        options.zoomOptions.wheel = true;
        options.moveOptions.wheel = false;
        super(options);
    }

    override getGesture(e?: PointerEvent): Blockly.Gesture | null {
        // 来自源代码
        if (Blockly.KeyboardMover.mover.isMoving()) {
            e?.preventDefault();
            e?.stopPropagation();
            return null;
        }

        const isStart = e?.type === 'pointerdown';
        if (isStart && this.currentGesture_?.hasStarted()) {
            console.warn('Tried to start the same gesture twice.');
            this.currentGesture_.cancel();
            return null;
        }
        if (
            // 左触发
            ((e?.button === 0 && !revertDrag) ||
                // 中触发
                (e?.button === 1 && revertDrag)) &&
            !this.currentGesture_ &&
            isStart
        ) {
            this.currentGesture_ = new Blockly.Gesture(e, this);
            patchGesture(this.currentGesture_);
            return this.currentGesture_;
        } else return super.getGesture(e);
    }
}
