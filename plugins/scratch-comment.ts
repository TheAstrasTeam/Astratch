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

/** Scratch 风格连接线粗细，对标 scratch_bubble.js 的 LINE_THICKNESS。 */
const SCRATCH_LINE_THICKNESS = 1;

/**
 * CommentView 的 topbar 高度（CSS .blocklyCommentTopbarBackground { height: 24px }）。
 */
const COMMENT_TOPBAR_HEIGHT = 24;

/**
 * 重写的注释类
 */
export class ScratchCommentBubble implements Blockly.IBubble {
    /** ISelectable.id（focus 系统需要）。 */
    readonly id: string;

    /** 注释视图（workspace comment 的完整视图，复用）。 */
    private readonly commentView: Blockly.comments.CommentView;

    /** Scratch 风格直线（从 anchor 到 bubble 顶边中点）。 */
    private readonly arrowLine: SVGLineElement;

    /** 外层 svgRoot：包含 arrowLine + commentView.svgRoot。挂到 bubbleCanvas。 */
    private readonly rootGroup: SVGGElement;

    /** 锚点（block 上图标位置，工作区坐标）。 */
    private anchor: Blockly.utils.Coordinate;

    /** bubble 相对 anchor 的偏移（工作区坐标），保持相对位置用。 */
    private relativeLeft = 0;
    private relativeTop = 0;

    /** 尺寸变化监听器（兼容 CommentIcon.onSizeChange）。 */
    private sizeChangeListeners: Array<() => void> = [];

    /** 位置变化监听器（兼容 CommentIcon.onBubbleLocationChange）。 */
    private locationChangeListeners: Array<() => void> = [];

    /** 文本变化监听器（兼容 CommentIcon.onTextChange）。 */
    private textChangeListeners: Array<() => void> = [];

    /** ARIA label provider（对标原生 Bubble.ariaLabelProvider）。 */
    private ariaLabelProvider: (() => string) | null = null;

    /** workspace 引用（ISelectable.workspace / getFocusableTree 需要）。 */
    readonly workspace: Blockly.WorkspaceSvg;

    /** 拥有此 bubble 的 icon（用于删除时回写 block.setCommentText(null)）。 */
    private readonly owner?: Blockly.IHasBubble & Blockly.IFocusableNode;

    /** 是否已 dispose。 */
    private disposed = false;

    constructor(
        workspace: Blockly.WorkspaceSvg,
        anchor: Blockly.utils.Coordinate,
        owner?: Blockly.IHasBubble & Blockly.IFocusableNode,
    ) {
        this.id = Blockly.utils.idGenerator.getNextUniqueId();
        this.workspace = workspace;
        this.anchor = anchor;
        this.owner = owner;

        // 1. 外层 rootGroup 挂到 bubbleCanvas（与原生 Bubble 一致）
        //    rootGroup 不设 id：focus 系统用 getFocusableElement() 返回的 commentView.svgRoot，
        //    id 设在 commentView.svgRoot 上，避免 active focus class 加在 rootGroup
        //    导致白线高亮覆盖 arrowLine。
        this.rootGroup = dom.createSvgElement(
            Svg.G,
            { class: 'blocklyScratchCommentBubble' },
            workspace.getBubbleCanvas(),
        );

        // 注册为 topBoundedElement，让注释参与工作区最大尺寸计算
        // （原生 Bubble 不注册，但积木注释需参与 metrics 计算）
        workspace.addTopBoundedElement(this);

        // 2. Scratch 风格直线，放在 rootGroup 最前（渲染在 commentView 之下）
        this.arrowLine = dom.createSvgElement(
            Svg.LINE,
            {
                class: 'blocklyScratchCommentArrow',
                'stroke-linecap': 'round',
                'stroke-width': `${SCRATCH_LINE_THICKNESS}`,
            },
            this.rootGroup,
        );

        // 3. 复用 CommentView（workspace comment 的完整视图）
        //    CommentView 构造会 append 到 layers.BLOCK，我们改挂到 rootGroup
        this.commentView = new Blockly.comments.CommentView(workspace, this.id);
        // 把 commentView 的 svgRoot 移到我们的 rootGroup 下
        this.commentView.getSvgRoot().parentElement?.removeChild(this.commentView.getSvgRoot());
        this.rootGroup.appendChild(this.commentView.getSvgRoot());
        // focus 系统用 id 识别节点：把 id 设在 commentView.svgRoot 上，
        // 这样 blocklyActiveFocus class 加在 commentView 上，白线高亮只覆盖注释框。
        this.commentView.getSvgRoot().setAttribute('id', this.id);

        // 3.1 绑定 pointerdown 到 commentView 的 svgRoot，调 handleBubbleStart
        //     （CommentView 自身不绑整体拖动，拖动由 RenderedWorkspaceComment 绑；
        //     这里我们是 IBubble，走 handleBubbleStart 让 gesture 用 BubbleDragStrategy）
        Blockly.browserEvents.conditionalBind(
            this.commentView.getSvgRoot(),
            'pointerdown',
            this,
            this.onPointerDown,
        );
        // 3.2 绑定 contextmenu 到 commentView 的 svgRoot，触发 showContextMenu
        Blockly.browserEvents.conditionalBind(
            this.commentView.getSvgRoot(),
            'contextmenu',
            this,
            (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.showContextMenu(e);
            },
        );

        // 4. 监听 commentView 的文本/尺寸变化，转发给 CommentIcon 的监听器
        this.commentView.addTextChangeListener((_oldText, newText) => {
            for (const l of this.textChangeListeners) l();
            // 文本变化时更新 aria-label（对标原生 TextInputBubble 的 textChangeListener → recomputeAriaContext）
            this.recomputeAriaContext();
            void newText;
        });
        this.commentView.addSizeChangeListener((_oldSize, _newSize) => {
            for (const l of this.sizeChangeListeners) l();
            this.updateArrow();
        });

        // 4.1 监听 commentView 的 dispose（删除按钮触发），对标 scratch-blocks
        //     ScratchBubble.registerDeleteEvent(this.dispose.bind(this))：
        //     用户点 top bar 删除按钮 → commentView.dispose() → 这里回写
        //     block.setCommentText(null) → removeIcon → icon.dispose() → bubble.dispose()。
        //     commentView.dispose 幂等（第二次调时 disposeListeners 已清空），无重入风险。
        this.commentView.addDisposeListener(() => this.handleViewDisposed());

        // 5. 默认尺寸（与 CommentView.defaultCommentSize 一致）
        this.commentView.setSize(new Size(120, 100));

        // 6. 初始位置：anchor 正右方，relativeTop = -TOPBAR_HEIGHT 使线段水平
        //    （端点 Y = bubbleY + TOPBAR_HEIGHT = anchorY + relativeTop + TOPBAR_HEIGHT = anchorY）
        this.relativeLeft = 40;
        this.relativeTop = -COMMENT_TOPBAR_HEIGHT;
        this.applyRelativePosition();
        this.updateArrow();

        // 7. 覆盖 CommentView 默认的 role=BUTTON 为 role=GROUP（bubble 语义），
        //    setAriaLabelProvider 被 icon 调用后会再次重算。
        this.recomputeAriaContext();
    }

    getRelativeToSurfaceXY(): Blockly.utils.Coordinate {
        // CommentView 的 location 即 bubble 工作区坐标
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
        // CommentView 自带 blocklyDraggable class，拖动样式可选
    }

    setDeleteStyle(_enable: boolean): void {
        // 暂不实现删除样式
    }

    /**
     * pointerdown 处理：交给 workspace gesture + focus 本 bubble。
     */
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
        // 拖动结束无需额外处理
    }

    revertDrag(): void {
        // 暂不实现回退（依赖外部 dragStrategy）
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
     * 返回 commentView.svgRoot（而非 rootGroup）作为 focusable element。
     * 这样 focus_manager 把 blocklyActiveFocus class 加在 commentView 上，
     * 白线高亮（CSS .blocklyActiveFocus 规则）只覆盖注释框，不覆盖 arrowLine。
     * 对标原生 Bubble 的 focusableElement（默认 svgRoot，只含 bubble 本身）。
     */
    getFocusableElement(): HTMLElement | SVGElement {
        return this.commentView.getSvgRoot();
    }

    getFocusableTree(): Blockly.IFocusableTree {
        return this.workspace;
    }

    /**
     * 对标原生 Bubble.onNodeFocus（bubbles/bubble.ts:751-759）：
     * select + 置顶 + 滚动入视。focus 已由 focusNode 触发，这里只做副作用。
     */
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

    /**
     * 右键菜单：只提供"删除注释"（与 top bar 删除按钮、积木右键"删除注释"一致）。
     * 对标 RenderedWorkspaceComment.showContextMenu（rendered_workspace_comment.ts:289-314），
     * 但我们是 block 的 bubble，不是独立 workspace comment，
     * 故不走 ContextMenuRegistry（scope.comment 需为 RenderedWorkspaceComment），
     * 直接构造一个删除选项。
     */
    showContextMenu(e: Event): void {
        const block = (this.owner as any)?.sourceBlock as Blockly.Block | undefined;
        if (!block) return;
        const rtl = this.workspace.RTL;
        // 用 LegacyContextMenuOption（只需 text/enabled/callback，无需 id），
        // ContextMenu.show 接受 ContextMenuOption | LegacyContextMenuOption。
        const menuOptions: Blockly.ContextMenuRegistry.LegacyContextMenuOption[] = [
            {
                text: Blockly.Msg['REMOVE_COMMENT'] ?? 'Delete Comment',
                enabled: true,
                callback: () => {
                    Blockly.Events.setGroup(true);
                    block.setCommentText(null);
                    Blockly.Events.setGroup(false);
                    this.workspace.getAudioManager().play('delete');
                },
            },
        ];
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

    /**
     * commentView 被外部 dispose 时（删除按钮）触发：
     */
    private handleViewDisposed(): void {
        if (this.disposed) return;
        const block = (this.owner as any)?.sourceBlock as Blockly.Block | undefined;
        block?.setCommentText(null);
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.workspace.removeTopBoundedElement(this);
        this.commentView.dispose();
        dom.removeNode(this.rootGroup);
    }

    /** 设置锚点（拖动积木时调用），保持 relativeLeft/relativeTop 不变 → bubble 跟随。 */
    setAnchorLocation(anchor: Blockly.utils.Coordinate): void {
        this.anchor = anchor;
        this.applyRelativePosition();
        this.updateArrow();
    }

    /** 设置直线 + 注释框边框颜色（积木边框色，用于指示来自哪个积木）。 */
    setArrowColour(colour: string): void {
        this.arrowLine.style.stroke = colour;
        const comment = this.rootGroup.querySelector('.blocklyCommentHighlight') as SVGRectElement;
        if (comment) {
            comment.style.stroke = colour;
            comment.style.strokeWidth = '2px';
        }
    }

    /** 空实现：兼容 CommentIcon.applyColour 调用 textInputBubble.setColour。 */
    setColour(_colour: string): void {
        // Scratch 风格注释框颜色由 setArrowColour 统一控制，忽略积木填充色
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

    /**
     * 设置 ARIA label provider + 重算 aria context。
     * 对标原生 Bubble.setAriaLabelProvider（bubbles/bubble.ts:815-818）。
     * CommentIcon.createBubble 调此方法传入 () => Msg['BUBBLE_LABEL_COMMENT'].replace('%1', text)。
     */
    setAriaLabelProvider(provider: () => string): void {
        this.ariaLabelProvider = provider;
        this.recomputeAriaContext();
    }

    /**
     * 重算 aria context：设 role=GROUP + aria-label。
     * 对标原生 Bubble.recomputeAriaContext（bubbles/bubble.ts:787-800）。
     * 覆盖 CommentView 默认的 role=BUTTON（独立 workspace comment 才用 BUTTON，
     * 作为 block 的 bubble 应为 GROUP，让内部 editor 可被屏幕阅读器到达）。
     */
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

    /** 按 relativeLeft/relativeTop + anchor 计算 bubble 位置并应用。 */
    private applyRelativePosition(): void {
        const x = this.anchor.x + this.relativeLeft;
        const y = this.anchor.y + this.relativeTop;
        this.commentView.moveTo(new Blockly.utils.Coordinate(x, y));
        for (const l of this.locationChangeListeners) l();
    }

    /**
     * 重绘 Scratch 风格直线：从 anchor 到 bubble topbar 底边中点（内容交界）。
     * 线在 rootGroup 本地坐标系内（rootGroup 未 translate，子元素 commentView 自己 translate），
     * 故两端都用工作区坐标。
     * 对标 scratch_bubble.js renderArrow_：relBubbleY = TOP_BAR_HEIGHT / 2（topbar 中点），
     * 这里按用户要求改为 topbar 底边（TOP_BAR_HEIGHT）。
     */
    private updateArrow(): void {
        const size = this.getSize();
        const bubbleXY = this.getRelativeToSurfaceXY();
        // bubble topbar 底边中点（工作区坐标）= topbar 与内容交界
        const endX = bubbleXY.x + size.width / 2;
        const endY = bubbleXY.y + COMMENT_TOPBAR_HEIGHT;
        this.arrowLine.setAttribute('x1', `${this.anchor.x}`);
        this.arrowLine.setAttribute('y1', `${this.anchor.y}`);
        this.arrowLine.setAttribute('x2', `${endX}`);
        this.arrowLine.setAttribute('y2', `${endY}`);
    }
}

/**
 * Scratch 风格积木注释图标：
 * - 不在积木上绘制 ? 按钮（initView 只创建隐藏 svgRoot 供 dispose 安全）
 * - 有文本时常驻显示一个连在积木上的可编辑 bubble（ScratchCommentBubble）
 * - 新建注释（setText('')）时自动显示 bubble（Scratch 风格，无需点击按钮）
 * - 拖动积木时 bubble 保持相对位置（覆盖 onLocationChange 调 setAnchorLocation）
 */
export class ScratchCommentIcon extends CommentIcon {
    /** 类型字符串与原生一致，保证 setCommentText / 右键菜单 / 序列化都能识别。 */
    static override readonly TYPE = IconType.COMMENT;

    constructor(sourceBlock: Blockly.Block) {
        super(sourceBlock);
    }

    override getType() {
        return ScratchCommentIcon.TYPE;
    }

    /**
     * 不调 super.initView()（避免创建 ? 按钮和绑定 pointerdown），
     */
    override initView(_pointerdownListener: (e: PointerEvent) => void): void {
        if (this.svgRoot) return; // 已初始化
        const svgBlock = this.getSourceBlock() as Blockly.BlockSvg;
        this.svgRoot = dom.createSvgElement(Svg.G, {
            class: 'blocklyScratchCommentIcon',
        });
        this.svgRoot.style.display = 'none';
        svgBlock.getSvgRoot().appendChild(this.svgRoot);
    }

    /** 占用 0x0 空间，积木不为本图标预留位置。 */
    override getSize(): Blockly.utils.Size {
        return new Size(0, 0);
    }

    /** 不响应点击（没有按钮可点）。显隐由 setText / loadState 驱动。 */
    override onClick(): void {
        // 空操作
    }

    /** Scratch 风格图标无按钮，不需要被 focus（避免 focus 系统尝试访问隐藏 svgRoot）。 */
    override canBeFocused(): boolean {
        return false;
    }

    /**
     * 用 ScratchCommentBubble 替代原生 TextInputBubble。
     * 复制父类 createBubble 主体（blockly core/icons/comment_icon.ts:366-387），
     * 仅替换 bubble 类型。getAnchorLocation / getBubbleOwnerRect / textInputBubble
     * 为父类 private，用 (this as any) 反射访问。
     *
     * 直线起点用积木末端（block 右边缘中点，替代原生图标位置），
     * 直线和注释框边框颜色用积木边框色（getColourTertiary）。
     */
    protected override createBubble(): void {
        const ws = this.getSourceBlock().workspace as Blockly.WorkspaceSvg;
        const anchor = this.getBlockEndAnchor();
        const bubble = new ScratchCommentBubble(ws, anchor, this);
        // 注入到父类 private textInputBubble 字段
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
        // 直线 + 注释框边框颜色用积木边框色（tertiary，与 applyColour 一致）
        const borderColour = (this.getSourceBlock() as Blockly.BlockSvg).getColourTertiary();
        bubble.setArrowColour(borderColour);
    }

    /**
     * 计算积木末端锚点：block 右边缘（LTR）或左边缘（RTL）× 第一行中点 Y。
     * 用于直线起点（替代原生图标位置 workspaceLocation + SIZE/2）。
     *
     * X：用 childlessWidth 的右边缘（不含子块）。
     * Y：用 workspaceLocation.y（由 renderer 设置 offsetInBlock 后更新，
     *    offsetInBlock.y = 第一行 centerline，因 icon height=0）。
     *    对标 scratch 的 iconXY_ = blockXY + (rightEdge, firstRowHeight/2)
     *    （block_render_svg_vertical.js:670-674）。
     *    对 C 型积木，第一行是头部行（腔口之前），中点不会被腔口空白拉偏。
     */
    private getBlockEndAnchor(): Blockly.utils.Coordinate {
        const block = this.getSourceBlock() as Blockly.BlockSvg;
        const bounds = block.getBoundingRectangleWithoutChildren();
        const rtl = block.workspace.RTL;
        const x = rtl ? bounds.left : bounds.right;
        // workspaceLocation = blockOrigin + offsetInBlock，offsetInBlock.y 由 renderer
        // 设置为第一行 centerline（drawer.ts:283 yPos = centerline - height/2，height=0）。
        const y = (this as any).workspaceLocation.y as number;
        return new Blockly.utils.Coordinate(x, y);
    }

    /**
     * 拖动积木 / 积木 translate 时更新 workspaceLocation、bubbleLocation 字段，
     * 并调 setAnchorLocation 保持相对位置。
     *
     * 对标原生 CommentIcon.onLocationChange（comment_icon.ts:150-160）：
     *   super.onLocationChange(blockOrigin);  // 更新 workspaceLocation
     *   if (bubbleLocation) bubbleLocation += delta;
     *   textInputBubble.setAnchorLocation(getAnchorLocation());
     *
     * 对标 scratch-blocks ScratchBubble.setAnchorLocation（scratch_bubble.js:536-544）：
     *   anchorXY_ = xy; positionBubble_();  // 只用 anchor + 旧 relativeLeft/Top 重定位
     *   不改 relativeLeft/Top（保持相对位置）
     *
     * 关键：不调 setBubbleLocation（会触发 moveDuringDrag → moveTo → 重算 relativeLeft/Top）。
     * 否则双重移动：moveDuringDrag 用旧 anchor 重算 relativeLeft/Top，setAnchorLocation 又
     * 用新 anchor + (已被破坏的) relativeLeft/Top 重定位，位置错乱。
     *
     * anchor 用 getBlockEndAnchor()（积木右边缘中点），对标 scratch 的 iconXY_
     * （block_render_svg_vertical.js:670-674: iconX = rightEdge, topMargin = firstRowHeight/2，
     *  SIZE=0 → iconXY_ = blockXY + (rightEdge, firstRowHeight/2) = 积木右边缘 × 第一行中点）。
     */
    override onLocationChange(blockOrigin: Blockly.utils.Coordinate): void {
        const oldLocation = (this as any).workspaceLocation as Blockly.utils.Coordinate;
        // 更新 workspaceLocation（与 Icon 基类 onLocationChange 一致）
        (this as any).workspaceLocation = Blockly.utils.Coordinate.sum(
            blockOrigin,
            (this as any).offsetInBlock,
        );
        const newLocation = (this as any).workspaceLocation as Blockly.utils.Coordinate;

        // 更新 bubbleLocation 字段（仅跟踪坐标，不移动 bubble —— 与原生 CommentIcon 一致）
        const bubbleLocation = this.getBubbleLocation();
        if (bubbleLocation && oldLocation) {
            const delta = Blockly.utils.Coordinate.difference(newLocation, oldLocation);
            (this as any).bubbleLocation = Blockly.utils.Coordinate.sum(bubbleLocation, delta);
        }

        // setAnchorLocation → applyRelativePosition（用旧 relativeLeft/relativeTop + 新 anchor 重定位）
        const bubble = (this as any).textInputBubble as ScratchCommentBubble | null;
        if (bubble) {
            bubble.setAnchorLocation(this.getBlockEndAnchor());
        }
    }

    /**
     * 重写 setText（父类 Icon 无此方法，CommentIcon.setText 是新增，故不用 override）：
     * - 调 super.setText 设文本 + fire 事件
     * - Scratch 风格：有文本即显示；新建空注释（''）也展开供用户输入
     *
     * 删除注释走 block.setCommentText(null) → removeIcon，不走 setText，故不会误触发。
     */
    setText(text: string): void {
        super.setText(text);
        if (!this.bubbleIsVisible()) {
            void this.setBubbleVisible(true);
        }
    }

    /**
     * override 原生 CommentIcon.saveState（comment_icon.ts:216-235）：
     * 原生用 `if (this.text)` 判断，空字符串 '' 是 falsy → 返回 null → 空注释不保存。
     * Scratch 风格：注释框存在即应保存（含位置/尺寸），即使文本为空，
     * 否则用户建的空注释刷新后丢失。逻辑与原生一致，仅去掉 text 非空判断。
     */
    override saveState(): Blockly.icons.CommentState | null {
        const state: Blockly.icons.CommentState = {
            'text': this.getText(),
            'pinned': this.bubbleIsVisible(),
            'height': this.getBubbleSize().height,
            'width': this.getBubbleSize().width,
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

    /** Scratch 风格：有 state 即显示（含空注释），不依赖 text 非空。 */
    override loadState(state: Blockly.icons.CommentState): void {
        super.loadState(state);
        void this.setBubbleVisible(true);
    }

    /** applyColour：直线 + 注释框边框颜色随积木边框色变化。 */
    override applyColour(): void {
        super.applyColour();
        const bubble = (this as any).textInputBubble as ScratchCommentBubble | null;
        if (bubble) {
            const borderColour = (this.getSourceBlock() as Blockly.BlockSvg).getColourTertiary();
            bubble.setArrowColour(borderColour);
        }
    }

    /**
     * 不调 super.dispose：Icon.dispose 会 tooltip.unbindMouseEvents(svgRoot)，
     * 但本类 initView 未调 super.initView（未 bind tooltip），unbind 会读取
     * undefined.length 崩溃。自行清理 bubble + svgRoot。
     */
    override dispose(): void {
        (this as any).textInputBubble?.dispose();
        (this as any).textInputBubble = null;
        if (this.svgRoot) {
            dom.removeNode(this.svgRoot);
        }
    }
}

/**
 * 替换 Blockly 原生 CommentIcon。
 */
export function registerScratchComment(blockly: typeof Blockly): void {
    try {
        blockly.icons.registry.unregister('comment');
    } catch {
        // 忽略
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
  `);

    patchZerosWidthIconPadding(blockly);


    patchLookUpFocusableNode(blockly);
}

/**
 * 包装 WorkspaceSvg.prototype.lookUpFocusableNode，在原始查找返回 null 时，
 * 额外搜索 ScratchCommentBubble 的 editor（CommentEditor）。
 */
function patchLookUpFocusableNode(blockly: typeof Blockly): void {
    const proto = blockly.WorkspaceSvg.prototype as any;
    if (proto.__scratchCommentLookUpPatched) return; // 防止重复 patch
    proto.__scratchCommentLookUpPatched = true;

    const original = proto.lookUpFocusableNode;
    proto.lookUpFocusableNode = function (id: string) {
        const result = original.call(this, id);
        if (result) return result;
        // 原始查找未命中，搜索 ScratchCommentBubble 的 editor
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
 * Patch zelos RenderInfo.prototype.getInRowSpacing_，让 0 宽图标不产生 padding。
 */
function patchZerosWidthIconPadding(blockly: typeof Blockly): void {
    // zelos renderer 在 blockly.getZelosRenderer().getRenderInfo() 或 blockly.zelos.RenderInfo
    const zelos = (blockly as any).zelos;
    if (!zelos || !zelos.RenderInfo) return;
    const proto = zelos.RenderInfo.prototype;
    const original = proto.getInRowSpacing_;
    if (!original || (original as any).__scratchCommentPatched) return;
    const patched = function (this: any, prev: any, next: any): number {
        // 0 宽图标：与 0 宽 field 一致，不加 padding（Types.ICON = 1 << 2 = 4）
        if (prev && prev.type & 4 /* Types.ICON */ && prev.width === 0) {
            return this.constants_.NO_PADDING;
        }
        return original.call(this, prev, next);
    };
    (patched as any).__scratchCommentPatched = true;
    proto.getInRowSpacing_ = patched;
}
