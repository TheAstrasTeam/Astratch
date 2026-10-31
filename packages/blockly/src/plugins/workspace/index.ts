import * as Blockly from 'blockly';
import { revertDrag } from '../../blockly';
import { ashWorkspaceSelector } from './dragger';
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
