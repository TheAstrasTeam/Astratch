/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * 由 AstrasTeam 修改于 2026/6/27:
 * - 覆盖 getFlyoutScale 为返回固定值
 * - 增加 FLYOUT_SCALE 常量
 *
 * 由 AstrasTeam 修改于 2026/7/25:
 * - 修改 name 定位为 id 定位
 * - 修改滚动的代码，让它更精确
 * - 将 if (this.scrollTarget) 改为 if (this.scrollTarget !== undefined)
 * - 在 flyout 顶部增加积木搜索框（by AI）
 * - 更新 Astratch Toolbox 注册入口的错误提示
 */

/**
 * @fileoverview Flyout that supports always-open continuous scrolling.
 */

import * as Blockly from 'blockly/core';
import { ContinuousToolbox } from './ContinuousToolbox';
import { ContinuousFlyoutMetrics } from './ContinuousFlyoutMetrics';
import { RecyclableBlockFlyoutInflater } from './RecyclableBlockFlyoutInflater';
import { translate } from './ContinuousToolboxControls';

export interface LabelFlyoutItem extends Blockly.FlyoutItem {
    // Blockly.FlyoutButton represents both buttons and labels; a label is just
    // a borderless, non-clickable button.
    getElement(): Blockly.FlyoutButton;
}

interface SearchEntry {
    definition: Blockly.utils.toolbox.BlockInfo;
    label?: Blockly.utils.toolbox.LabelInfo;
    text: string;
}

/**
 * Class for continuous flyout.
 */
export class ContinuousFlyout extends Blockly.VerticalFlyout {
    private static readonly SEARCH_BAR_HEIGHT = 40;
    private static readonly SEARCH_DEBOUNCE_DELAY = 0;

    /**
     * Flyout的缩放
     */
    FLYOUT_SCALE = 0.7;

    /**
     * Target scroll position, used to smoothly scroll to a given category
     * location when selected.
     */
    private scrollTarget?: number;

    /**
     * Map from category id to its position in the flyout.
     */
    private scrollPositions = new Map<string, number>();

    /** 搜索框所在的 SVG foreignObject。 */
    private searchForeignObject?: SVGForeignObjectElement;

    /** 用于输入积木搜索内容的 HTML 输入框。 */
    private searchInput?: HTMLInputElement;

    /** 当前完整 flyout 内容，用于退出搜索时恢复。 */
    private sourceContents: Blockly.utils.toolbox.FlyoutItemInfoArray = [];

    /** 从完整 flyout 渲染结果中建立的积木搜索索引。 */
    private searchEntries: SearchEntry[] = [];

    /** 当前已经应用到结果列表的搜索内容。 */
    private searchQuery = '';

    /** 正常模式下的 flyout 宽度，防止搜索结果导致宽度跳动。 */
    private normalFlyoutWidth = 0;

    /**
     * The percentage of the distance to the scrollTarget that should be
     * scrolled at a time. Lower values will produce a smoother, slower scroll.
     */
    protected scrollAnimationFraction = 0.3;

    /**
     * Prevents the flyout from closing automatically when a block is dragged out.
     */
    override autoClose = false;

    /**
     * Creates a new ContinuousFlyout.
     *
     * @param workspaceOptions The injection options for the flyout's workspace.
     */
    constructor(workspaceOptions: Blockly.Options) {
        super(workspaceOptions);

        this.getWorkspace().setMetricsManager(
            new ContinuousFlyoutMetrics(this.getWorkspace(), this),
        );

        this.getWorkspace().addChangeListener((e: Blockly.Events.Abstract) => {
            if (e.type === Blockly.Events.VIEWPORT_CHANGE) {
                this.selectCategoryByScrollPosition(-this.getWorkspace().scrollY);
            }
        });

        this.setRecyclingEnabled(true);
    }

    override createDom(
        tagName: string | Blockly.utils.Svg<SVGSVGElement> | Blockly.utils.Svg<SVGGElement>,
    ): SVGElement {
        const svgGroup = super.createDom(tagName);
        this.searchForeignObject = Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.FOREIGNOBJECT,
            {
                class: 'continuousFlyoutSearch',
                x: 0,
                y: 0,
                width: 0,
                height: ContinuousFlyout.SEARCH_BAR_HEIGHT,
            },
            svgGroup,
        );

        const container = document.createElement('div');
        container.classList.add('continuousFlyoutSearchContainer');

        this.searchInput = document.createElement('input');
        this.searchInput.type = 'search';
        this.searchInput.autocomplete = 'off';
        this.searchInput.spellcheck = false;
        this.searchInput.classList.add('continuousFlyoutSearchInput');

        const searchLabel = translate('blocks:uilts.searchBlocks');
        this.searchInput.placeholder = searchLabel;
        this.searchInput.setAttribute('aria-label', searchLabel);
        this.searchInput.addEventListener('input', () => {
            this.queueSearch(this.searchInput?.value ?? '');
        });
        this.searchInput.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !this.isSearchMode()) return;

            event.preventDefault();
            event.stopPropagation();
            this.applySearch('');
        });

        container.appendChild(this.searchInput);
        this.searchForeignObject.appendChild(container);
        return svgGroup;
    }

    override dispose() {
        super.dispose();
    }

    /** 在所有 flyout 内容上方预留固定搜索框的空间。 */
    protected override layout_(contents: Blockly.FlyoutItem[]) {
        super.layout_(contents);
        const offset = ContinuousFlyout.SEARCH_BAR_HEIGHT / this.getFlyoutScale();
        for (const item of contents) {
            item.getElement().moveBy(0, offset);
        }
    }

    /** 搜索结果变化时保持 flyout 原有宽度。 */
    protected override reflowInternal_() {
        super.reflowInternal_();

        if (!this.isSearchMode()) {
            this.normalFlyoutWidth = this.width_;
            return;
        }

        if (this.normalFlyoutWidth > this.width_) {
            this.width_ = this.normalFlyoutWidth;
            this.position();
            this.targetWorkspace.resizeContents();
            this.targetWorkspace.recordDragTargets();
        }
    }

    override position() {
        super.position();

        const verticalScrollbar = this.getWorkspace().scrollbar?.vScroll;
        if (verticalScrollbar) {
            verticalScrollbar.setPosition(
                verticalScrollbar.position.x,
                this.SCROLLBAR_MARGIN + ContinuousFlyout.SEARCH_BAR_HEIGHT,
            );
        }

        if (!this.searchForeignObject) return;

        this.searchForeignObject.setAttribute('width', String(this.getWidth()));
        this.searchForeignObject.setAttribute('height', String(ContinuousFlyout.SEARCH_BAR_HEIGHT));
    }

    /**
     * Gets parent toolbox.
     * Since we registered the ContinuousToolbox, we know that's its type.
     *
     * @returns Toolbox that owns this flyout.
     */
    private getParentToolbox(): ContinuousToolbox | null {
        const toolbox = this.targetWorkspace.getToolbox();
        if (!toolbox || toolbox instanceof ContinuousToolbox) return toolbox;

        console.warn(
            'Expected a `ContinuousToolbox` instance but did not find one. ' +
                '请确认已经调用 `registerAstratchToolbox()`，并正确注入 Astratch Toolbox。',
        );

        return null;
    }

    /**
     * Records scroll position for each category in the toolbox.
     * The scroll position is determined by the coordinates of each category's
     * label after the entire flyout has been rendered.
     */
    private recordScrollPositions() {
        this.scrollPositions.clear();
        const searchOffset = ContinuousFlyout.SEARCH_BAR_HEIGHT / this.getFlyoutScale();
        this.getContents()
            .filter(this.toolboxItemIsLabel.bind(this))
            .map(item => item.getElement())
            .forEach(label => {
                this.scrollPositions.set(
                    (label.info as Blockly.utils.toolbox.LabelInfo).id ?? '',
                    Math.max(0, label.getPosition().y - this.GAP_Y / 2 - searchOffset),
                );
            });
    }

    /**
     * Validates and typechecks that the given toolbox item represents a label.
     *
     * @param item The toolbox item to check.
     * @returns True if the item represents a label in the flyout, and is a
     *     Blockly.FlyoutButton.
     */
    protected toolboxItemIsLabel(item: Blockly.FlyoutItem): item is LabelFlyoutItem {
        const element = item.getElement();
        return !!(
            item.getType() === 'label' &&
            // Note that `FlyoutButton` represents both buttons and labels.
            element instanceof Blockly.FlyoutButton &&
            element.isLabel()
        );
    }

    /**
     * Returns the scroll position for the given category name.
     *
     * @param name Category name.
     * @returns Scroll position for given category in workspace units, or null if
     *     not found.
     */
    getCategoryScrollPosition(name: string): number | null {
        const position = this.scrollPositions.get(name);
        if (position === undefined) {
            console.warn(`Scroll position not recorded for category ${name}`);
        }
        return position ?? null;
    }

    /**
     * Selects an item in the toolbox based on the scroll position of the flyout.
     *
     * @param position Current scroll position of the workspace.
     */
    private selectCategoryByScrollPosition(position: number) {
        if (this.isSearchMode()) return;

        // If we are currently auto-scrolling, due to selecting a category by
        // clicking on it, do not update the category selection.
        if (this.scrollTarget !== undefined) return;

        const scaledPosition = position / this.getWorkspace().scale;
        const positionTolerance = 1;

        // Traverse the array of scroll positions in reverse, so we can select the
        // furthest category that the scroll position is beyond.
        for (const [id, categoryPosition] of [...this.scrollPositions.entries()].reverse()) {
            if (scaledPosition + positionTolerance >= categoryPosition) {
                this.getParentToolbox()?.selectCategoryById(id);
                return;
            }
        }
    }

    /**
     * Scrolls the flyout to given position.
     *
     * @param position The Y coordinate to scroll to.
     */
    scrollTo(position: number) {
        // Set the scroll target to either the scaled position or the lowest
        // possible scroll point, whichever is smaller.
        const metrics = this.getWorkspace().getMetrics();
        this.scrollTarget = Math.min(
            position * this.getWorkspace().scale,
            metrics.scrollHeight - metrics.viewHeight,
        );

        this.stepScrollAnimation();
    }

    /**
     * Scrolls the flyout to display the given category at the top.
     *
     * @param category The toolbox category to scroll to in the flyout.
     */
    scrollToCategory(category: Blockly.ISelectableToolboxItem) {
        if (this.isSearchMode() || this.searchInput?.value.trim()) {
            this.clearSearch();
        }

        const position = this.scrollPositions.get(category.getId());
        if (position === undefined) {
            console.warn(`Scroll position not recorded for category ${category.getId()}`);
            return;
        }
        this.scrollTo(position);
    }

    /**
     * Step the scrolling animation by scrolling a fraction of the way to
     * a scroll target, and request the next frame if necessary.
     */
    private stepScrollAnimation() {
        if (this.scrollTarget === undefined) return;
        const currentScrollPos = -this.getWorkspace().scrollY;
        const diff = this.scrollTarget - currentScrollPos;
        if (Math.abs(diff) < 1) {
            this.getWorkspace().scrollbar?.setY(this.scrollTarget);
            this.scrollTarget = undefined;
            return;
        }
        this.getWorkspace().scrollbar?.setY(currentScrollPos + diff * this.scrollAnimationFraction);

        requestAnimationFrame(this.stepScrollAnimation.bind(this));
    }

    /**
     * Handles mouse wheel events.
     *
     * @param e The mouse wheel event to handle.
     */

    protected override wheel_(e: WheelEvent) {
        // Don't scroll in response to mouse wheel events if we're currently
        // animating scrolling to a category.
        if (this.scrollTarget !== undefined) return;

        super.wheel_(e);
    }

    /**
     * Calculates the additional padding needed at the bottom of the flyout in
     * order to make it possible to scroll to the top of the last category.
     *
     * @param contentMetrics Content metrics for the flyout.
     * @param viewMetrics View metrics for the flyout.
     * @returns The additional bottom padding needed.
     */
    calculateBottomPadding(
        contentMetrics: Blockly.MetricsManager.ContainerRegion,
        viewMetrics: Blockly.MetricsManager.ContainerRegion,
        getWorkspaceCoordinates = false,
    ): number {
        if (this.scrollPositions.size === 0) return 0;

        const lastPosition = [...this.scrollPositions.values()].pop() ?? 0;
        const convertedLastPosition = getWorkspaceCoordinates
            ? lastPosition
            : lastPosition * this.getWorkspace().scale;
        const lastCategoryHeight = contentMetrics.height - convertedLastPosition;
        if (lastCategoryHeight < viewMetrics.height) {
            return viewMetrics.height - lastCategoryHeight;
        }

        return 0;
    }

    /** 返回搜索栏在像素坐标或 flyout 工作区坐标中的高度。 */
    getSearchBarHeight(getWorkspaceCoordinates = false): number {
        return getWorkspaceCoordinates
            ? ContinuousFlyout.SEARCH_BAR_HEIGHT / this.getWorkspace().scale
            : ContinuousFlyout.SEARCH_BAR_HEIGHT;
    }

    /**
     * Returns the X coordinate for the flyout's position.
     */
    override getX(): number {
        if (
            this.isVisible() &&
            // Make sure that this flyout is associated with a toolbox and not e.g.
            // a simple flyout or the trashcan flyout.
            this.targetWorkspace.toolboxPosition === this.toolboxPosition_ &&
            this.targetWorkspace.getToolbox() &&
            this.toolboxPosition_ !== Blockly.utils.toolbox.Position.LEFT
        ) {
            // This makes it so blocks cannot go under the flyout in RTL mode.
            return this.targetWorkspace.getMetricsManager().getViewMetrics().width;
        }

        return super.getX();
    }

    /**
     * Displays the given contents in the flyout.
     *
     * @param flyoutDef A string or JSON object specifying the contents of the
     *     flyout.
     */
    override show(flyoutDef: Blockly.utils.toolbox.FlyoutDefinition | string) {
        if (typeof flyoutDef === 'string') {
            this.searchQuery = '';
            this.sourceContents = [];
            this.searchEntries = [];
            if (this.searchInput) this.searchInput.value = '';
            this.renderFlyout(flyoutDef, false);
            this.finishRender(false);
            return;
        }

        this.sourceContents = [...Blockly.utils.toolbox.convertFlyoutDefToJsonArray(flyoutDef)];
        this.renderFlyout(this.sourceContents, this.isSearchMode());
        this.buildSearchIndex();

        if (this.isSearchMode()) {
            this.renderSearchResults();
        } else {
            this.finishRender(false);
        }
    }

    /** 创建用于搜索的积木文字与定义索引。 */
    private buildSearchIndex() {
        const renderedBlocks = this.getContents().filter(item => item.getType() === 'block');
        let renderedBlockIndex = 0;
        let currentLabel: Blockly.utils.toolbox.LabelInfo | undefined;

        this.searchEntries = [];
        for (const definition of this.sourceContents) {
            const kind = definition.kind.toLowerCase();
            if (kind === 'label') {
                currentLabel = definition as Blockly.utils.toolbox.LabelInfo;
                continue;
            }
            if (kind !== 'block') continue;

            const item = renderedBlocks[renderedBlockIndex++];
            const block = item?.getElement();
            if (!(block instanceof Blockly.BlockSvg)) continue;

            this.searchEntries.push({
                definition: definition as Blockly.utils.toolbox.BlockInfo,
                label: currentLabel,
                text: this.normalizeSearchText(
                    `${currentLabel?.text ?? ''} ${block.toString()} ${block.type}`,
                ),
            });
        }
    }

    /** 根据当前搜索内容重新生成 flyout 结果。 */
    private renderSearchResults() {
        const tokens = this.normalizeSearchText(this.searchQuery).split(/\s+/).filter(Boolean);
        const matches = this.searchEntries.filter(entry =>
            tokens.every(token => entry.text.includes(token)),
        );
        const results: Blockly.utils.toolbox.FlyoutItemInfoArray = [];
        let previousLabel: Blockly.utils.toolbox.LabelInfo | undefined;

        for (const entry of matches) {
            if (entry.label && entry.label !== previousLabel) {
                results.push({ ...entry.label });
                previousLabel = entry.label;
            }
            results.push(entry.definition);
        }

        if (!results.length) {
            results.push({
                kind: 'LABEL',
                text: translate('blocks:uilts.noSearchResults'),
                id: 'continuousFlyoutSearchNoResults',
            });
        }

        this.renderFlyout(results, true);
        this.finishRender(true);
    }

    /** 延迟应用输入内容，避免连续输入时频繁重建 flyout。 */
    private queueSearch(query: string) {

        if (!query.trim()) {
            this.applySearch('');
            return;
        }

        this.applySearch(query);
    }

    /** 应用搜索内容，并在清空时返回当前选中分类。 */
    private applySearch(query: string) {
        const nextQuery = query.trim();
        if (nextQuery === this.searchQuery) return;

        const wasSearching = this.isSearchMode();
        this.searchQuery = nextQuery;

        if (this.searchInput && !nextQuery) {
            this.searchInput.value = '';
        }

        if (nextQuery) {
            this.renderSearchResults();
            return;
        }

        if (!wasSearching) return;
        this.renderFlyout(this.sourceContents, true);
        this.finishRender(false);

        const selected = this.getParentToolbox()?.getSelectedItem();
        if (selected) this.scrollToCategory(selected);
    }

    /** 取消搜索和未执行的防抖任务，但不主动改变分类。 */
    private clearSearch() {
        if (this.searchInput) this.searchInput.value = '';

        if (!this.isSearchMode()) return;
        this.searchQuery = '';
        this.renderFlyout(this.sourceContents, true);
        this.finishRender(false);
    }

    /** 调用 Blockly 渲染，并在搜索切换期间关闭不安全的积木复用。 */
    private renderFlyout(
        flyoutDef: Blockly.utils.toolbox.FlyoutDefinition | string,
        disableRecycling: boolean,
    ) {
        const inputWasFocused = document.activeElement === this.searchInput;
        const selectionStart = this.searchInput?.selectionStart;
        const selectionEnd = this.searchInput?.selectionEnd;
        const inflater = this.getRecyclableInflater();
        const recyclingEnabled = inflater.recyclingEnabled;

        if (disableRecycling) inflater.recyclingEnabled = false;
        try {
            super.show(flyoutDef);
        } finally {
            inflater.recyclingEnabled = recyclingEnabled;
        }

        if (inputWasFocused && this.searchInput) {
            this.searchInput.focus({ preventScroll: true });
            if (selectionStart != null && selectionEnd != null) {
                this.searchInput.setSelectionRange(selectionStart, selectionEnd);
            }
        }
    }

    /** 完成搜索或正常模式渲染后的滚动与度量更新。 */
    private finishRender(searchMode: boolean) {
        this.scrollTarget = undefined;
        if (searchMode) {
            this.scrollPositions.clear();
            this.getWorkspace().scrollbar?.setY(0);
        } else {
            this.recordScrollPositions();
        }

        this.getWorkspace().resizeContents();
        if (!searchMode && !this.getParentToolbox()?.getSelectedItem()) {
            this.selectCategoryByScrollPosition(0);
        }
        this.getRecyclableInflater().emptyRecycledBlocks();
    }

    private isSearchMode(): boolean {
        return this.searchQuery.length > 0;
    }

    private normalizeSearchText(text: string): string {
        return text.normalize('NFKC').toLocaleLowerCase();
    }

    /**
     * Sets the function used to determine whether a block is recyclable.
     *
     * @param func The function used to determine if a block is recyclable.
     */
    setBlockIsRecyclable(func: (block: Blockly.Block) => boolean) {
        this.getRecyclableInflater().recycleEligibilityChecker = func;
    }

    /**
     * Set whether the flyout can recycle blocks.
     *
     * @param isEnabled True to allow blocks to be recycled, false otherwise.
     */
    setRecyclingEnabled(isEnabled: boolean) {
        this.getRecyclableInflater().recyclingEnabled = isEnabled;
    }

    /**
     * Returns the recyclable block flyout inflater.
     *
     * @returns The recyclable inflater.
     */
    protected getRecyclableInflater(): RecyclableBlockFlyoutInflater {
        const inflater = this.getInflaterForType('block');
        if (!(inflater instanceof RecyclableBlockFlyoutInflater)) {
            throw new Error('The RecyclableBlockFlyoutInflater is not registered.');
        }

        return inflater;
    }

    /**
     * 获取Flyout的缩放
     * 类似 Scratch，Flyout需要固定缩放
     * 所以覆盖了此方法，返回固定值
     * @returns 返回的缩放比，1
     */
    public override getFlyoutScale(): number {
        return this.FLYOUT_SCALE;
    }
}
