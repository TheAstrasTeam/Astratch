import * as Blockly from 'blockly';
import { ashMultiSelectorManager, WorkspaceMultiSelectorManager } from './multiSelector';

/**
 * @author AI
 * @checked
 */
export class AshMultiBlockDragStrategy extends Blockly.dragging.BlockDragStrategy {
    private others: { block: Blockly.BlockSvg; start: Blockly.utils.Coordinate }[] = [];
    private lastLoc: Blockly.utils.Coordinate | null = null;
    private readonly roots: Blockly.BlockSvg[];
    private readonly originalStrategy: Blockly.IDragStrategy;

    constructor(
        primary: Blockly.BlockSvg,
        roots: Blockly.BlockSvg[],
        originalStrategy: Blockly.IDragStrategy,
    ) {
        super(primary);
        this.roots = roots;
        this.originalStrategy = originalStrategy
    }

    override startDrag(e?: PointerEvent | KeyboardEvent): Blockly.IDraggable {
        const result = super.startDrag(e);
        const layerManager = this.block.workspace.getLayerManager();
        for (const block of this.roots) {
            if (block === this.block) continue;
            const start = block.getRelativeToSurfaceXY();
            block.setDragging(true);
            block.moveDuringDrag(start);
            layerManager?.moveToDragLayer(block, false);
            this.others.push({ block, start });
        }
        return result;
    }

    override drag(newLoc: Blockly.utils.Coordinate, e?: PointerEvent | KeyboardEvent): void {
        super.drag(newLoc, e);
        this.lastLoc = newLoc;
        const delta = Blockly.utils.Coordinate.difference(newLoc, this.startLoc!);
        for (const { block, start } of this.others) {
            block.moveDuringDrag(Blockly.utils.Coordinate.sum(start, delta));
        }
    }

    override endDrag(
        e: PointerEvent | KeyboardEvent | undefined,
        disposition: Blockly.DragDisposition,
    ): void {
        try {
            super.endDrag(e, disposition);
            this.finishOthers(disposition);
        } finally {
            this.block.setDragStrategy(this.originalStrategy);
        }
    }

    override revertDrag(): void {
        try {
            super.revertDrag();
            this.finishOthers(Blockly.DragDisposition.REVERT);
        } finally {
            this.block.setDragStrategy(this.originalStrategy);
        }
    }

    private finishOthers(disposition: Blockly.DragDisposition): void {
        const layerManager = this.block.workspace.getLayerManager();
        const delta =
            this.lastLoc && this.startLoc
                ? Blockly.utils.Coordinate.difference(this.lastLoc, this.startLoc)
                : new Blockly.utils.Coordinate(0, 0);

        for (const { block, start } of this.others) {
            if (block.isDeadOrDying()) continue;

            if (disposition === Blockly.DragDisposition.DELETE) {
                const event = new Blockly.Events.BlockMove(block);
                event.setReason(['drag']);
                event.oldCoordinate = start;
                event.recordNew();
                Blockly.Events.fire(event);
                Blockly.blockAnimations.disposeUiEffect(block);
                block.dispose();
                continue;
            }

            block.moveDuringDrag(start);
            if (disposition === Blockly.DragDisposition.COMMIT) {
                block.moveTo(Blockly.utils.Coordinate.sum(start, delta), ['drag']);
            }
            block.setDragging(false);
            layerManager?.moveOffDragLayer(block, Blockly.layers.BLOCK, false);
        }
        this.others = [];
    }
}

/**
 * @author AI
 * @checked
 */
export class ashWorkspaceMultiDragger implements Blockly.IDragger {
    private draggingBlock: Blockly.BlockSvg;
    /** 被按住的块的Dragger */
    private draggingBlockDragger: Blockly.IDragger | null = null;
    /**
     * 其余的块
     * > 它们是跟随主块的dragger，因为一起创建会有性能问题
     */
    private othersBlock: { block: Blockly.BlockSvg; start: Blockly.utils.Coordinate }[] = [];
    private group: string | null = null;
    private workspaceMSM: WorkspaceMultiSelectorManager | undefined;

    constructor(draggable: Blockly.IDraggable) {
        this.draggingBlock = draggable as Blockly.BlockSvg;
        this.workspaceMSM = ashMultiSelectorManager.getWorkspace(this.draggingBlock.workspace.id);
    }

    onDragStart(e?: PointerEvent | KeyboardEvent): Blockly.IDraggable {
        const selected = (this.workspaceMSM?.getSelectedBlocks() ?? [])
            .map(selection => selection.blockSvg)
            .filter(block => !block.isDeadOrDying() && block.isMovable());

        const isMulti = selected.includes(this.draggingBlock);
        const blocks = isMulti ? selected : [this.draggingBlock];

        const selectedSet = new Set(blocks);
        const roots = new Set(
            blocks.filter(block => {
                const parent = block.getParent() as Blockly.BlockSvg | null;
                return !parent || !selectedSet.has(parent);
            }),
        );

        // 被按住的块可能因为“祖先也被选中”而被过滤掉，往上找到它所属的根块
        let primaryRoot = this.draggingBlock;
        while (!roots.has(primaryRoot) && primaryRoot.getParent()) {
            primaryRoot = primaryRoot.getParent() as Blockly.BlockSvg;
        }

        if (isMulti) this.workspaceMSM?.setIgnoreUnselect(true);

        // 主块走Dragger
        this.draggingBlockDragger = new Blockly.dragging.Dragger(primaryRoot);
        this.draggingBlockDragger.onDragStart(e);

        // 其它块手动开拖动
        // Blockly的拖动会focus，多个直接性能爆炸
        // 我无疑是悲伤的
        const workspace = this.draggingBlock.workspace;
        const layerManager = workspace.getLayerManager();
        for (const block of roots) {
            if (block === primaryRoot) continue;
            const start = block.getRelativeToSurfaceXY();
            block.setDragging(true);
            block.moveDuringDrag(start);
            layerManager?.moveToDragLayer(block, false);
            this.othersBlock.push({ block, start });
        }

        this.group = Blockly.Events.getGroup() || null;
        return this.draggingBlock;
    }

    onDrag(
        e: PointerEvent | KeyboardEvent | undefined,
        totalDelta: Blockly.utils.Coordinate,
    ): void {
        this.draggingBlockDragger?.onDrag(e, totalDelta);
        const delta = this.toWorkspaceDelta(totalDelta);
        for (const { block, start } of this.othersBlock) {
            block.moveDuringDrag(Blockly.utils.Coordinate.sum(start, delta));
        }
    }

    onDragEnd(
        e: PointerEvent | KeyboardEvent | undefined,
        totalDelta: Blockly.utils.Coordinate,
    ): void {
        this.endAll(e, totalDelta, false);
    }

    onDragRevert(
        e: PointerEvent | KeyboardEvent | undefined,
        totalDelta: Blockly.utils.Coordinate,
    ): void {
        this.endAll(e, totalDelta, true);
    }

    private endAll(
        e: PointerEvent | KeyboardEvent | undefined,
        totalDelta: Blockly.utils.Coordinate,
        revert: boolean,
    ): void {
        if (this.group) Blockly.Events.setGroup(this.group);
        if (revert) this.draggingBlockDragger?.onDragRevert(e, totalDelta);
        else this.draggingBlockDragger?.onDragEnd(e, totalDelta);
        // Dragger.onDragEnd 内部会把 group 清掉，补回来
        if (this.group) Blockly.Events.setGroup(this.group);

        const delta = this.toWorkspaceDelta(totalDelta);
        const layerManager = this.draggingBlock.workspace.getLayerManager();
        const isDeleted = !!this.draggingBlock?.isDeadOrDying();
        for (const { block, start } of this.othersBlock) {
            if (block.isDeadOrDying()) continue;
            if (isDeleted) {
                const moveEvent = new Blockly.Events.BlockMove(block);
                moveEvent.setReason(['drag']);
                moveEvent.oldCoordinate = start;
                moveEvent.recordNew();
                Blockly.Events.fire(moveEvent);
                Blockly.blockAnimations.disposeUiEffect(block);
                block.dispose();
                continue;
            }
            if (!block.getParent()) {
                // 让事件的旧位置是对的
                // 我去这太牛逼了我怎么没想到
                block.moveDuringDrag(start);
                if (!revert) {
                    block.moveTo(Blockly.utils.Coordinate.sum(start, delta), ['drag']);
                }
            }
            block.setDragging(false);
            layerManager?.moveOffDragLayer(block, Blockly.layers.BLOCK, false); // ← focus = false
        }

        Blockly.Events.setGroup(false);
        this.draggingBlockDragger = null;
        this.othersBlock = [];
        this.workspaceMSM?.setIgnoreUnselect(false);

        this.workspaceMSM
            ?.getSelectedBlocks()
            .filter(selection => selection.blockSvg.isDeadOrDying())
            .forEach(selection => this.workspaceMSM!.unselectBlock(selection.blockSvg));
    }

    private toWorkspaceDelta(totalDelta: Blockly.utils.Coordinate): Blockly.utils.Coordinate {
        const scale = this.draggingBlock.workspace.scale || 1;
        return new Blockly.utils.Coordinate(totalDelta.x / scale, totalDelta.y / scale);
    }
}
export class ashWorkspaceSelector extends Blockly.WorkspaceDragger {
    areaSvg: SVGRectElement | null = null;
    private workspaceSvg: Blockly.WorkspaceSvg;
    private startSvgXY: Blockly.utils.Coordinate;
    private endXY: Blockly.utils.Coordinate;
    private startXY: Blockly.utils.Coordinate;
    private checkTimer: number | null = null;

    protected workspaceMSM: WorkspaceMultiSelectorManager | undefined;

    constructor(workspace: Blockly.WorkspaceSvg, mouseDownXY: Blockly.utils.Coordinate) {
        super(workspace);
        this.workspaceSvg = workspace;
        this.startXY = mouseDownXY;
        const ctm = this.workspaceSvg.getParentSvg().getScreenCTM();
        const p = ctm
            ? new DOMPoint(this.startXY.x, this.startXY.y).matrixTransform(ctm.inverse())
            : this.startXY;
        this.startSvgXY = new Blockly.utils.Coordinate(p.x, p.y);
        this.endXY = this.startSvgXY;
        this.workspaceMSM = ashMultiSelectorManager.getWorkspace(this.workspaceSvg.id);
    }

    override startDrag(): void {
        if (!this.workspaceMSM) throw new Error(`Can't find workspace.`);
        this.workspaceMSM.setIgnoreUnselect(true);
        this.workspaceMSM.unselectAll();
        this.areaSvg = Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.RECT,
            {
                class: 'ashBlocklySelectArea',
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                rx: '5',
                ry: '5',
            },
            this.workspaceSvg.getSvgGroup(),
        );
    }

    override drag(currentDragDeltaXY: Blockly.utils.Coordinate): void {
        if (!this.areaSvg) return;
        this.endXY = Blockly.utils.Coordinate.sum(this.startXY, currentDragDeltaXY);

        const { x: x0, y: y0 } = this.startSvgXY;
        const x1 = x0 + currentDragDeltaXY.x;
        const y1 = y0 + currentDragDeltaXY.y;
        this.areaSvg.setAttribute('x', String(Math.min(x0, x1)));
        this.areaSvg.setAttribute('y', String(Math.min(y0, y1)));
        this.areaSvg.setAttribute('width', String(Math.abs(x1 - x0)));
        this.areaSvg.setAttribute('height', String(Math.abs(y1 - y0)));
        if (this.checkTimer) clearTimeout(this.checkTimer);
        this.checkTimer = setTimeout(() => {
            this.checkTouchingBlocks();
        }, 2);
    }

    override endDrag(currentDragDeltaXY: Blockly.utils.Coordinate): void {
        super.endDrag(currentDragDeltaXY);
        this.workspaceMSM?.setIgnoreUnselect(false);
        // 每次都选择会导致冲突然后爆掉focus...
        // 简单来说，偶尔无法删除
        this.workspaceMSM?.focusLastBlock();
        const anim = this.areaSvg?.animate([{ opacity: '1' }, { opacity: '0' }], {
            duration: 100,
        });
        if (anim)
            anim.onfinish = () => {
                this.areaSvg!.remove();
            };
    }

    checkTouchingBlocks() {
        const startPoint = Blockly.utils.svgMath.screenToWsCoordinates(
            this.workspaceSvg,
            this.startXY,
        );
        const endPoint = Blockly.utils.svgMath.screenToWsCoordinates(this.workspaceSvg, this.endXY);
        const selectingRect = new Blockly.utils.Rect(
            Math.min(startPoint.y, endPoint.y),
            Math.max(startPoint.y, endPoint.y),
            Math.min(startPoint.x, endPoint.x),
            Math.max(startPoint.x, endPoint.x),
        );
        if (!this.workspaceMSM) throw new Error(`Can't find workspace.`);
        this.workspaceSvg.getAllBlocks().filter(block => {
            if (block.isDeadOrDying() || block.isShadow()) return;
            if (!selectingRect.intersects(block.getBoundingRectangleWithoutChildren())) {
                if (this.workspaceMSM!.isSelected(block)) this.workspaceMSM!.unselectBlock(block);
                return;
            }
            this.workspaceMSM!.selectBlock(block, false);
        });
    }
}
