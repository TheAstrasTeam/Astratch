import * as Blockly from 'blockly';
import { ashMultiSelectorManager, WorkspaceMultiSelectorManager } from './multiSelector';

/**
 * @author AI
 * @checked
 */
export class ashWorkspaceMultiDragger implements Blockly.IDragger {
    private draggingBlock: Blockly.BlockSvg;
    /** 每个参与拖拽的“根块”各配一个 Blockly 内置 Dragger */
    private draggers: Blockly.IDragger[] = [];
    /** Blockly 事件组 */
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

        // 不会额外移动子块
        const selectedSet = new Set(blocks);
        const roots = blocks.filter(block => {
            const parent = block.getParent() as Blockly.BlockSvg | null;
            return !parent || !selectedSet.has(parent);
        });

        if (isMulti) this.workspaceMSM?.setIgnoreUnselect(true);

        this.draggers = roots.map(block => new Blockly.dragging.Dragger(block));
        for (const dragger of this.draggers) dragger.onDragStart(e);
        this.group = Blockly.Events.getGroup() || null; // 第一个 Dragger 会创建事件组
        return this.draggingBlock;
    }

    onDrag(
        e: PointerEvent | KeyboardEvent | undefined,
        totalDelta: Blockly.utils.Coordinate,
    ): void {
        for (const dragger of this.draggers) dragger.onDrag(e, totalDelta);
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
        for (const dragger of this.draggers) {
            if (this.group) Blockly.Events.setGroup(this.group);
            if (revert) dragger.onDragRevert(e, totalDelta);
            else dragger.onDragEnd(e, totalDelta);
        }
        Blockly.Events.setGroup(false);
        this.draggers = [];
        this.group = null;
        this.workspaceMSM?.setIgnoreUnselect(false);

        // 清理被删除的块
        this.workspaceMSM
            ?.getSelectedBlocks()
            .filter(selection => selection.blockSvg.isDeadOrDying())
            .forEach(selection => this.workspaceMSM!.unselectBlock(selection.blockSvg));
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
        const lastBlock = this.workspaceMSM?.getSelectedBlocks().at(-1)?.blockSvg;
        if (lastBlock) Blockly.getFocusManager().focusNode(lastBlock);
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
            if (!selectingRect.intersects(block.getBoundingRectangleWithoutChildren())) {
                if (this.workspaceMSM!.isSelected(block)) this.workspaceMSM!.unselectBlock(block);
                return;
            }
            if (block.isDeadOrDying() || block.isShadow()) return;
            this.workspaceMSM!.selectBlock(block, false);
        });
    }
}
