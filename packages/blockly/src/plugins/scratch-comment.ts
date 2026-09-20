/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

const CommentIcon = Blockly.icons.CommentIcon;
const IconType = Blockly.icons.IconType;
const Size = Blockly.utils.Size;
const Svg = Blockly.utils.Svg;
const dom = Blockly.utils.dom;
const Msg = Blockly.Msg;

/** Scratch 风格连线粗细。 */
const SCRATCH_LINE_THICKNESS = 1;

/** CommentView topbar 高度（CSS .blocklyCommentTopbarBackground 的 height）。 */
const COMMENT_TOPBAR_HEIGHT = 24;

/**
 * Scratch 风格积木注释气泡，复用 CommentView 实现。
 */
export class ScratchCommentBubble implements Blockly.IBubble {
    /** ISelectable.id（focus 系统需要）。 */
    readonly id: string;

    /** 复用 Blockly 的 CommentView。 */
    private readonly commentView: Blockly.comments.CommentView;

    /** Scratch 风格连线（anchor → bubble topbar 中点）。 */
    private readonly arrowLine: SVGLineElement;

    /** 外层组：arrowLine + commentView.svgRoot，挂在 bubbleCanvas。 */
    private readonly rootGroup: SVGGElement;

    /** 锚点（积木上图标位置，工作区坐标）。 */
    private anchor: Blockly.utils.Coordinate;

    /** bubble 相对 anchor 的偏移（工作区坐标），拖动积木时保持不变。 */
    private relativeLeft = 0;
    private relativeTop = 0;

    /** 尺寸/位置/文本变化监听器，转发给 CommentIcon。 */
    private sizeChangeListeners: Array<() => void> = [];
    private locationChangeListeners: Array<() => void> = [];
    private textChangeListeners: Array<() => void> = [];

    /** ARIA label provider。 */
    private ariaLabelProvider: (() => string) | null = null;

    /** workspace 引用（ISelectable.workspace 需要）。 */
    readonly workspace: Blockly.WorkspaceSvg;

    /** 拥有此 bubble 的 icon（删除时回写 block.setCommentText(null)）。 */
    private readonly owner?: Blockly.icons.Icon & Blockly.IHasBubble;

    /** 是否已 dispose。 */
    private disposed = false;

    constructor(
        workspace: Blockly.WorkspaceSvg,
        anchor: Blockly.utils.Coordinate,
        owner?: Blockly.icons.Icon & Blockly.IHasBubble,
    ) {
        this.id = Blockly.utils.idGenerator.getNextUniqueId();
        this.workspace = workspace;
        this.anchor = anchor;
        this.owner = owner;

        // 外层组挂到 bubbleCanvas。id 设在 commentView.svgRoot 上，
        // 避免 active focus 白线加在 rootGroup 上覆盖 arrowLine。
        this.rootGroup = dom.createSvgElement(
            Svg.G,
            { class: 'blocklyScratchCommentBubble' },
            workspace.getBubbleCanvas(),
        );

        // 注册为 topBoundedElement，参与工作区最大尺寸计算
        workspace.addTopBoundedElement(this);

        // 连线放 rootGroup 最前（渲染在 commentView 之下）
        this.arrowLine = dom.createSvgElement(
            Svg.LINE,
            {
                class: 'blocklyScratchCommentArrow',
                'stroke-linecap': 'round',
                'stroke-width': `${SCRATCH_LINE_THICKNESS}`,
            },
            this.rootGroup,
        );

        // 复用 CommentView（构造时会挂到 layers.BLOCK，这里改挂到 rootGroup）；
        // 用底部子类，让 highlightRect 渲染在最前
        this.commentView = new CommentView(workspace, this.id);
        this.commentView.getSvgRoot().parentElement?.removeChild(this.commentView.getSvgRoot());
        this.rootGroup.appendChild(this.commentView.getSvgRoot());
        this.commentView.getSvgRoot().setAttribute('id', this.id);

        // 绑定拖动：CommentView 自身不绑整体拖动，走 handleBubbleStart
        // 让 gesture 用 BubbleDragStrategy
        Blockly.browserEvents.conditionalBind(
            this.commentView.getSvgRoot(),
            'pointerdown',
            this,
            this.onPointerDown,
        );

        // 转发文本/尺寸变化给 CommentIcon 的监听器
        this.commentView.addTextChangeListener((_oldText, newText) => {
            for (const l of this.textChangeListeners) l();
            // 文本变化时重算 aria-label
            this.recomputeAriaContext();
            void newText;
        });
        this.commentView.addSizeChangeListener((_oldSize, _newSize) => {
            for (const l of this.sizeChangeListeners) l();
            this.updateArrow();
        });

        // 点删除按钮 → commentView.dispose() → 回写 setCommentText(null)。
        // commentView.dispose 幂等，无重入风险。
        this.commentView.addDisposeListener(() => this.handleViewDisposed());

        this.commentView.setSize(new Size(120, 100));

        // 初始位置：anchor 右方 40px，垂直居中（relativeTop = -topbar 高/2，连线水平）
        this.relativeLeft = 40;
        this.relativeTop = -(COMMENT_TOPBAR_HEIGHT / 2);
        this.applyRelativePosition();
        this.updateArrow();

        // 覆盖 CommentView 默认的 role=BUTTON 为 GROUP（bubble 语义）
        this.recomputeAriaContext();
    }

    getRelativeToSurfaceXY(): Blockly.utils.Coordinate {
        return this.commentView.getRelativeToSurfaceXY();
    }

    getSvgRoot(): SVGElement {
        return this.rootGroup;
    }

    getBoundingRectangle(): Blockly.utils.Rect {
        const loc = this.getRelativeToSurfaceXY();
        const size = this.getSize();
        return new Blockly.utils.Rect(loc.y, loc.y + size.height, loc.x, loc.x + size.width);
    }

    moveBy(dx: number, dy: number, _reason?: string[]): void {
        const loc = this.getRelativeToSurfaceXY();
        this.moveTo(loc.x + dx, loc.y + dy);
    }

    moveTo(x: number, y: number): void {
        this.commentView.moveTo(new Blockly.utils.Coordinate(x, y));
        this.relativeLeft = x - this.anchor.x;
        this.relativeTop = y - this.anchor.y;
        this.updateArrow();
        for (const l of this.locationChangeListeners) l();
    }

    moveDuringDrag(newLoc: Blockly.utils.Coordinate): void {
        this.commentView.moveTo(newLoc);
        this.relativeLeft = newLoc.x - this.anchor.x;
        this.relativeTop = newLoc.y - this.anchor.y;
        this.updateArrow();
        for (const l of this.locationChangeListeners) l();
    }

    setDragging(_dragging: boolean): void {
        // CommentView 自带 blocklyDraggable class
    }

    setDeleteStyle(_enable: boolean): void {
        // 暂不实现
    }

    /** pointerdown：交给 gesture 拖动 + 获得焦点。 */
    private onPointerDown(e: PointerEvent): void {
        this.workspace.getGesture(e)?.handleBubbleStart(e, this);
        Blockly.getFocusManager().focusNode(this);
    }

    isMovable(): boolean {
        return true;
    }

    startDrag(_e?: PointerEvent | KeyboardEvent): Blockly.IDraggable {
        return this;
    }

    drag(newLoc: Blockly.utils.Coordinate, _e?: PointerEvent | KeyboardEvent): void {
        this.moveDuringDrag(newLoc);
    }

    endDrag(
        _e: PointerEvent | KeyboardEvent | undefined,
        _disposition: Blockly.DragDisposition,
    ): void {
        // 无需额外处理
    }

    revertDrag(): void {
        // 暂不实现
    }

    select(): void {
        dom.addClass(this.commentView.getSvgRoot(), 'blocklySelected');
        Blockly.common.fireSelectedEvent(this);
    }

    unselect(): void {
        dom.removeClass(this.commentView.getSvgRoot(), 'blocklySelected');
        Blockly.common.fireSelectedEvent(null);
    }

    /**
     * 返回 commentView.svgRoot：active focus 白线只覆盖注释框，
     * 不覆盖 arrowLine。
     */
    getFocusableElement(): HTMLElement | SVGElement {
        return this.commentView.getSvgRoot();
    }

    getFocusableTree(): Blockly.IFocusableTree {
        return this.workspace;
    }

    /** focus 副作用：选中 + 置顶 + 滚动入视。 */
    onNodeFocus(): void {
        this.select();
        this.bringToFront();
        const xy = this.getRelativeToSurfaceXY();
        const size = this.getSize();
        const bounds = new Blockly.utils.Rect(xy.y, xy.y + size.height, xy.x, xy.x + size.width);
        this.workspace.scrollBoundsIntoView(bounds);
    }

    onNodeBlur(): void {
        this.unselect();
    }

    canBeFocused(): boolean {
        return true;
    }

    performAction(): void {
        Blockly.getFocusManager().focusNode(this.getEditor());
    }

    /** 把 rootGroup 移到 bubbleCanvas 末尾，确保渲染在最上层。 */
    private bringToFront(): void {
        const parent = this.rootGroup.parentElement;
        if (parent && parent.lastChild !== this.rootGroup) {
            parent.appendChild(this.rootGroup);
        }
    }

    /** 右键菜单：只提供"删除注释"。 */
    getContextMenuOptions(): Blockly.ContextMenuRegistry.ContextMenuOption[] {
        const block = this.owner?.getSourceBlock() as Blockly.BlockSvg | undefined;
        if (!block) return [];
        return [
            {
                id: 'scratchCommentDelete',
                text: Blockly.Msg['REMOVE_COMMENT'] ?? 'Delete Comment',
                enabled: true,
                scope: { block, focusedNode: this },
                weight: 0,
                callback: () => {
                    Blockly.Events.setGroup(true);
                    block.setCommentText(null);
                    Blockly.Events.setGroup(false);
                    void this.workspace.getAudioManager().play('delete');
                },
            },
        ];
    }

    showContextMenu(e: Event): void {
        const menuOptions = this.getContextMenuOptions();
        if (!menuOptions.length) return;
        const rtl = this.workspace.RTL;
        let location: Blockly.utils.Coordinate;
        if (e instanceof PointerEvent) {
            location = new Blockly.utils.Coordinate(e.clientX, e.clientY);
        } else {
            const xy = Blockly.utils.svgMath.wsToScreenCoordinates(
                this.workspace,
                this.getRelativeToSurfaceXY(),
            );
            location = xy.translate(10, 10);
        }
        Blockly.ContextMenu.show(e, menuOptions, rtl, this.workspace, location);
    }

    /** commentView 被删除按钮 dispose 时，回写 block.setCommentText(null)。 */
    private handleViewDisposed(): void {
        if (this.disposed) return;
        this.owner?.getSourceBlock().setCommentText(null);
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.workspace.removeTopBoundedElement(this);
        this.commentView.dispose();
        dom.removeNode(this.rootGroup);
    }

    /** 设置锚点（拖动积木时调用），保持相对偏移不变 → bubble 跟随。 */
    setAnchorLocation(anchor: Blockly.utils.Coordinate): void {
        this.anchor = anchor;
        this.applyRelativePosition();
        this.updateArrow();
    }

    /** 连线与注释框边框色（积木边框色）。 */
    setArrowColour(colour: string): void {
        this.arrowLine.style.stroke = colour;
        const comment = this.rootGroup.querySelector('.blocklyCommentHighlight') as SVGRectElement;
        const commentTopbar = this.rootGroup.querySelector(
            '.blocklyCommentTopbar',
        ) as SVGRectElement;
        if (comment) {
            comment.style.stroke = colour;
            comment.style.strokeWidth = '1px';
        }
        if (commentTopbar) {
            commentTopbar.style.stroke = colour;
            commentTopbar.style.strokeWidth = '1px';
        }
    }

    /** 颜色统一由 setArrowColour 控制，忽略积木填充色。 */
    setColour(_colour: string): void {
        // 空操作
    }

    setText(text: string): void {
        this.commentView.setText(text);
    }

    getText(): string {
        return this.commentView.getText() ?? '';
    }

    setSize(size: Blockly.utils.Size, _relayout = false): void {
        this.commentView.setSize(size);
    }

    getSize(): Blockly.utils.Size {
        return this.commentView.getSize();
    }

    getEditor(): Blockly.comments.CommentEditor {
        return this.commentView.getEditorFocusableNode();
    }

    setEditable(editable: boolean): void {
        this.commentView.setEditable(editable);
    }

    addTextChangeListener(listener: () => void): void {
        this.textChangeListeners.push(listener);
    }

    addSizeChangeListener(listener: () => void): void {
        this.sizeChangeListeners.push(listener);
    }

    addLocationChangeListener(listener: () => void): void {
        this.locationChangeListeners.push(listener);
    }

    /** 设置 aria-label provider 并重算。 */
    setAriaLabelProvider(provider: () => string): void {
        this.ariaLabelProvider = provider;
        this.recomputeAriaContext();
    }

    /** 重算 aria context：role=GROUP + aria-label（覆盖 CommentView 默认的 BUTTON）。 */
    private recomputeAriaContext(): void {
        const element = this.getFocusableElement();
        if (!element) return;
        Blockly.utils.aria.setRole(element, Blockly.utils.aria.Role.GROUP);
        const label = this.ariaLabelProvider?.()?.trim();
        Blockly.utils.aria.setState(
            element,
            Blockly.utils.aria.State.LABEL,
            label ? label : (Blockly.Msg['BUBBLE_LABEL_DEFAULT'] ?? 'Bubble'),
        );
    }

    /** 按 relativeLeft/relativeTop + anchor 计算并应用位置。 */
    private applyRelativePosition(): void {
        const x = this.anchor.x + this.relativeLeft;
        const y = this.anchor.y + this.relativeTop;
        this.commentView.moveTo(new Blockly.utils.Coordinate(x, y));
        for (const l of this.locationChangeListeners) l();
    }

    /**
     * 重绘连线：anchor → bubble topbar 中点。
     * rootGroup 未 translate（commentView 自己 translate），两端都用工作区坐标。
     */
    private updateArrow(): void {
        const size = this.getSize();
        const bubbleXY = this.getRelativeToSurfaceXY();
        const endX = bubbleXY.x + size.width / 2;
        const endY = bubbleXY.y + COMMENT_TOPBAR_HEIGHT / 2;
        this.arrowLine.setAttribute('x1', `${this.anchor.x}`);
        this.arrowLine.setAttribute('y1', `${this.anchor.y}`);
        this.arrowLine.setAttribute('x2', `${endX}`);
        this.arrowLine.setAttribute('y2', `${endY}`);
    }
}

/**
 * Scratch 风格积木注释图标：
 * - 不绘制 ? 按钮（initView 只建隐藏 svgRoot）
 * - 有文本即显示气泡（空注释 '' 也展开供输入）
 * - 拖动积木时气泡保持相对位置
 */
export class ScratchCommentIcon extends CommentIcon {
    /** 类型与原生一致，保证 setCommentText / 右键菜单 / 序列化可识别。 */
    static override readonly TYPE = IconType.COMMENT;

    constructor(sourceBlock: Blockly.Block) {
        super(sourceBlock);
    }

    override getType() {
        return ScratchCommentIcon.TYPE;
    }

    /** 不调 super.initView（不创建 ? 按钮、不绑 pointerdown），只建隐藏 svgRoot。 */
    override initView(_pointerdownListener: (e: PointerEvent) => void): void {
        if (this.svgRoot) return; // 已初始化
        const svgBlock = this.getSourceBlock() as Blockly.BlockSvg;
        this.svgRoot = dom.createSvgElement(Svg.G, {
            class: 'blocklyScratchCommentIcon',
        });
        this.svgRoot.style.display = 'none';
        svgBlock.getSvgRoot().appendChild(this.svgRoot);
    }

    /** 0x0 空间，积木不为图标预留位置。 */
    override getSize(): Blockly.utils.Size {
        return new Size(0, 0);
    }

    /** 无按钮可点，显隐由 setText / loadState 驱动。 */
    override onClick(): void {
        // 空操作
    }

    /** 无按钮，不需要被 focus（避免 focus 系统访问隐藏 svgRoot）。 */
    override canBeFocused(): boolean {
        return false;
    }

    /**
     * 用 ScratchCommentBubble 替代原生 TextInputBubble。
     * 父类 private 字段（getAnchorLocation / textInputBubble 等）用 (this as any) 访问。
     * 直线起点用积木右边缘（替代原生图标位置），颜色用积木边框色。
     */
    protected override createBubble(): void {
        const ws = this.getSourceBlock().workspace as Blockly.WorkspaceSvg;
        const anchor = this.getBlockEndAnchor();
        const bubble = new ScratchCommentBubble(ws, anchor, this);
        (this as any).textInputBubble = bubble;
        bubble.getEditor().setParent(this.getSourceBlock() as Blockly.BlockSvg);
        bubble.setText(this.getText());
        bubble.setSize(this.getBubbleSize(), true);
        const loc = this.getBubbleLocation();
        if (loc) bubble.moveDuringDrag(loc);
        bubble.addTextChangeListener(() => this.onTextChange());
        bubble.addSizeChangeListener(() => this.onSizeChange());
        bubble.addLocationChangeListener(() => this.onBubbleLocationChange());
        bubble.setAriaLabelProvider(
            () =>
                Msg['BUBBLE_LABEL_COMMENT']?.replace('%1', this.getText()) ??
                `Comment: ${this.getText()}`,
        );
        const borderColour = (this.getSourceBlock() as Blockly.BlockSvg).getColourTertiary();
        bubble.setArrowColour(borderColour);
    }

    /**
     * 锚点：积木右边缘（LTR）/左边缘（RTL）× 第一行中点。
     * Y 用 workspaceLocation.y（renderer 已把 offsetInBlock.y 设为第一行 centerline）。
     */
    private getBlockEndAnchor(): Blockly.utils.Coordinate {
        const block = this.getSourceBlock() as Blockly.BlockSvg;
        const bounds = block.getBoundingRectangleWithoutChildren();
        const rtl = block.workspace.RTL;
        const x = rtl ? bounds.left : bounds.right;
        const y = (this as any).workspaceLocation.y as number;
        return new Blockly.utils.Coordinate(x, y);
    }

    /**
     * 拖动积木时更新 workspaceLocation / bubbleLocation，并调 setAnchorLocation
     * 保持相对位置。
     * 关键：不调 setBubbleLocation——它会触发 moveDuringDrag 重算 relativeLeft/Top，
     * 再经 setAnchorLocation 重定位会导致双重移动、位置错乱。
     */
    override onLocationChange(blockOrigin: Blockly.utils.Coordinate): void {
        const oldLocation = (this as any).workspaceLocation as Blockly.utils.Coordinate;
        (this as any).workspaceLocation = Blockly.utils.Coordinate.sum(
            blockOrigin,
            (this as any).offsetInBlock,
        );
        const newLocation = (this as any).workspaceLocation as Blockly.utils.Coordinate;

        // 仅跟踪坐标，不移动 bubble
        const bubbleLocation = this.getBubbleLocation();
        if (bubbleLocation && oldLocation) {
            const delta = Blockly.utils.Coordinate.difference(newLocation, oldLocation);
            (this as any).bubbleLocation = Blockly.utils.Coordinate.sum(bubbleLocation, delta);
        }

        const bubble = (this as any).textInputBubble as ScratchCommentBubble | null;
        if (bubble) {
            bubble.setAnchorLocation(this.getBlockEndAnchor());
        }
    }

    /**
     * 有文本即显示气泡；新建空注释（''）也展开供用户输入。
     * 删除注释走 setCommentText(null)，不经过这里。
     */
    setText(text: string): void {
        super.setText(text);
        if (!this.bubbleIsVisible()) {
            void this.setBubbleVisible(true);
        }
    }

    /**
     * 原生在文本为空时不保存（'' 是 falsy）；这里只要注释框存在就保存
     * （含位置/尺寸），避免空注释刷新后丢失。
     */
    override saveState(): Blockly.icons.CommentState | null {
        const state: Blockly.icons.CommentState = {
            text: this.getText(),
            pinned: this.bubbleIsVisible(),
            height: this.getBubbleSize().height,
            width: this.getBubbleSize().width,
        };
        const location = this.getBubbleLocation();
        if (location) {
            const ws = this.getSourceBlock().workspace;
            state['x'] = ws.RTL
                ? ws.getWidth() - (location.x + this.getBubbleSize().width)
                : location.x;
            state['y'] = location.y;
        }
        return state;
    }

    /** 有 state 即显示（含空注释）。 */
    override loadState(state: Blockly.icons.CommentState): void {
        super.loadState(state);
        void this.setBubbleVisible(true);
    }

    /** 连线与注释框边框色随积木边框色变化。 */
    override applyColour(): void {
        super.applyColour();
        const bubble = (this as any).textInputBubble as ScratchCommentBubble | null;
        if (bubble) {
            const borderColour = (this.getSourceBlock() as Blockly.BlockSvg).getColourTertiary();
            bubble.setArrowColour(borderColour);
        }
    }

    /**
     * 不能调 super.dispose：本类未调 super.initView（未 bind tooltip），
     * super.dispose 里 tooltip.unbindMouseEvents 会读取 undefined 崩溃。
     */
    override dispose(): void {
        (this as any).textInputBubble?.dispose();
        (this as any).textInputBubble = null;
        if (this.svgRoot) {
            dom.removeNode(this.svgRoot);
        }
    }
}

/** 注册 Scratch 风格 CommentIcon，替换 Blockly 原生实现。 */
export function registerScratchComment(blockly: typeof Blockly): void {
    try {
        blockly.icons.registry.unregister('comment');
    } catch {
        // 未注册过，忽略
    }
    blockly.icons.registry.register(blockly.icons.IconType.COMMENT, ScratchCommentIcon);

    blockly.Css.register(`
    .blocklyScratchCommentArrow {
      stroke: #000;
      fill: none;
    }
    .blocklySelected .blocklyCommentHighlight {
      stroke: #fc3 !important;
      stroke-width: 3px !important;
    }
    .blocklyComment.blocklyCollapsed .blocklyCommentHighlight {
        stroke: none !important
    }
    .blocklyComment:not(.blocklyCollapsed) .blocklyCommentTopbar {
        stroke: none !important
    }
  `);

    patchZerosWidthIconPadding(blockly);

    patchLookUpFocusableNode(blockly);
}

/**
 * 包装 WorkspaceSvg.lookUpFocusableNode：原始查找未命中时，再搜索
 * ScratchCommentBubble 的 editor（CommentEditor 不在 workspace DOM 树中）。
 */
function patchLookUpFocusableNode(blockly: typeof Blockly): void {
    const proto = blockly.WorkspaceSvg.prototype as any;
    if (proto.__scratchCommentLookUpPatched) return; // 防止重复 patch
    proto.__scratchCommentLookUpPatched = true;

    const original = proto.lookUpFocusableNode;
    proto.lookUpFocusableNode = function (id: string) {
        const result = original.call(this, id);
        if (result) return result;
        try {
            for (const block of this.getAllBlocks(false)) {
                for (const icon of block.getIcons()) {
                    if (icon instanceof ScratchCommentIcon && icon.bubbleIsVisible()) {
                        const bubble = icon.getBubble() as unknown as ScratchCommentBubble;
                        if (bubble instanceof ScratchCommentBubble && bubble.canBeFocused()) {
                            const editor = bubble.getEditor();
                            if (editor.canBeFocused() && editor.getFocusableElement().id === id) {
                                return editor;
                            }
                        }
                    }
                }
            }
        } catch {
            // 忽略查找异常
        }
        return null;
    };
}

/**
 * 基类把 highlightRect 创建为 svgRoot 的第一个子元素（渲染在最底），
 * 这里把它移到末尾，让选中高亮框渲染在其余元素之上。
 */
export class CommentView extends Blockly.comments.CommentView {
    constructor(workspace: Blockly.WorkspaceSvg, commentId: string) {
        super(workspace, commentId);

        const root = this.getSvgRoot();
        const highlight = root.querySelector('.blocklyCommentHighlight') as SVGRectElement | null;
        if (highlight) {
            root.appendChild(highlight);
        }
    }
}

/** Patch zelos RenderInfo.getInRowSpacing_：0 宽图标（本插件）不加 padding。 */
function patchZerosWidthIconPadding(blockly: typeof Blockly): void {
    const zelos = (blockly as any).zelos;
    if (!zelos || !zelos.RenderInfo) return;
    const proto = zelos.RenderInfo.prototype;
    const original = proto.getInRowSpacing_;
    if (!original || (original as any).__scratchCommentPatched) return;
    const patched = function (this: any, prev: any, next: any): number {
        // 与 0 宽 field 一致（Types.ICON = 1 << 2 = 4）
        if (prev && prev.type & 4 && prev.width === 0) {
            return this.constants_.NO_PADDING;
        }
        return original.call(this, prev, next);
    };
    (patched as any).__scratchCommentPatched = true;
    proto.getInRowSpacing_ = patched;
}
