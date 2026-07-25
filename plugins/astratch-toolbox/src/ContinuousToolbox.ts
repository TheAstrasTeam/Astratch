/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * 由 AstrasTeam 修改于 2026/6/26:
 * - 修改 getInitialFlyoutContents 函数来保证作用域
 * - 修改 convertToolboxItemToFlyoutItems 对于动态积木栏的处理
 *
 * 由 AstrasTeam 修改于 2026/7/24:
 * - 覆盖了 createToolboxItem 方法来让DOM拥有id
 *
 * 由 AstrasTeam 修改于 2026/7/25:
 * - 将 getCategoryByName 改为 getCategoryById
 * - 将 selectCategoryByName 改为 selectCategoryById
 * - 将 flyout 上的 label 加入 id
 * - 让滚动时可以自动展开toolbox
 * - 加入滚动时的动画
 * - 将工具箱操作按钮拆分到 ContinuousToolboxControls
 * - 增加收起选中路径以外分类的操作
 * - 支持由宿主注入按钮的国际化文本
 */

/**
 * @fileoverview Toolbox that uses a continuous scrolling flyout.
 */

import * as Blockly from 'blockly/core';
import { ContinuousFlyout } from './ContinuousFlyout';
import { createContinuousToolboxControls } from './ContinuousToolboxControls';

/**
 * Class for continuous toolbox.
 */
// @ts-expect-error 扩展基类这是有必要的
export class ContinuousToolbox extends Blockly.Toolbox {
    /**
     * Timeout ID used to prevent refreshing the flyout during extensive block
     * changes.
     */
    private refreshDebouncer?: ReturnType<typeof setTimeout>;
    private static readonly TOOLBOX_WIDTH = 120;
    private preserveSelectionDuringPointerDown = false;

    protected override createDom_(workspace: Blockly.WorkspaceSvg): HTMLDivElement {
        const container = super.createDom_(workspace);
        container.prepend(
            createContinuousToolboxControls({
                collapseOtherCategories: () => this.collapseOtherCategories(),
            }),
        );
        return container;
    }

    protected override onClick_(e: PointerEvent) {
        this.preserveSelectionDuringPointerDown = this.getSelectedItem() !== null;

        try {
            super.onClick_(e);
        } finally {
            this.preserveSelectionDuringPointerDown = false;
        }
    }

    override clearSelection() {
        if (this.preserveSelectionDuringPointerDown && this.getSelectedItem()) {
            return;
        }

        super.clearSelection();
    }

    override position() {
        if (this.HtmlDiv && !this.isHorizontal()) {
            this.HtmlDiv.style.width = `${ContinuousToolbox.TOOLBOX_WIDTH}px`;

            // 在 super.position() 调用 getMetrics() 前更新。
            this.width_ = this.HtmlDiv.offsetWidth;
        }

        super.position();
    }

    /**
     * Initializes the continuous toolbox.
     */
    override init() {
        super.init();

        // Populate the flyout with all blocks and show it immediately.
        const flyout = this.getFlyout();
        flyout.show(this.getInitialFlyoutContents());

        this.getWorkspace().addChangeListener((e: Blockly.Events.Abstract) => {
            if (
                e.type === Blockly.Events.BLOCK_CREATE ||
                e.type === Blockly.Events.BLOCK_DELETE ||
                e.type === Blockly.Events.BLOCK_CHANGE
            ) {
                this.refreshSelection();
            }
        });
    }

    /**
     * Returns the continuous toolbox's flyout.
     *
     * @returns The toolbox's flyout.
     */
    override getFlyout(): ContinuousFlyout {
        return super.getFlyout() as ContinuousFlyout;
    }

    /**
     * Gets the contents that should be shown in the flyout immediately.
     * This includes all blocks and labels for each category of block.
     *
     * @returns Flyout contents.
     */
    private getInitialFlyoutContents(): Blockly.utils.toolbox.FlyoutItemInfoArray {
        return this.getToolboxItems().flatMap(item => this.convertToolboxItemToFlyoutItems(item));
    }

    /**
     * Converts a given toolbox item to an array of flyout items, generally a
     * label followed by the category's blocks.
     *
     * @param toolboxItem The toolbox item/category to convert.
     * @returns An array of flyout items contained in the given toolbox item.
     */
    protected convertToolboxItemToFlyoutItems(
        toolboxItem: Blockly.IToolboxItem,
    ): Blockly.utils.toolbox.FlyoutItemInfoArray {
        let contents: Blockly.utils.toolbox.FlyoutItemInfoArray = [];
        if (toolboxItem instanceof Blockly.ToolboxCategory) {
            // Create a label node to go at the top of the category
            contents.push({
                kind: 'LABEL',
                text: toolboxItem.getName(),
                id: toolboxItem.getId(),
            });
            let itemContents = toolboxItem.getContents();

            // Handle custom categories (e.g. variables and functions)
            if (typeof itemContents === 'string') {
                const callback = this.getWorkspace().getToolboxCategoryCallback(itemContents);
                itemContents = callback
                    ? Blockly.utils.toolbox.convertFlyoutDefToJsonArray(
                          callback(this.getWorkspace()),
                      )
                    : [];
            }
            contents = contents.concat(itemContents);
        }
        return contents;
    }

    /**
     * Updates the flyout's contents if it is visible.
     */
    override refreshSelection() {
        if (this.getFlyout().isVisible()) {
            if (this.refreshDebouncer) {
                clearTimeout(this.refreshDebouncer);
            }
            this.refreshDebouncer = setTimeout(() => {
                this.getFlyout().show(this.getInitialFlyoutContents());
            }, 100);
        }
    }

    /**
     * Scrolls the flyout to display the newly selected category's contents.
     *
     * @param oldItem The previously selected toolbox category.
     * @param newItem The newly selected toolbox category.
     */

    override updateFlyout_(
        _oldItem: Blockly.ISelectableToolboxItem | null,
        newItem: Blockly.ISelectableToolboxItem | null,
    ) {
        if (newItem) {
            this.getFlyout().scrollToCategory(newItem);
            if (!this.getFlyout().isVisible()) {
                this.getFlyout().show(this.getInitialFlyoutContents());
            }
        } else if (this.getFlyout().autoClose) {
            this.getFlyout().hide();
        }
    }

    /**
     * Returns whether or not the toolbox should deselect the old category.
     *
     * @param oldItem The previously selected toolbox category.
     * @param newItem The newly selected toolbox category.
     */

    override shouldDeselectItem_(
        oldItem: Blockly.ISelectableToolboxItem | null,
        newItem: Blockly.ISelectableToolboxItem | null,
    ): boolean {
        // Should not deselect if the same category is clicked again.
        return !!(oldItem && oldItem !== newItem);
    }

    /**
     * Gets a category by id.
     *
     * @param id Id of category to get.
     * @returns Category, or null if not found.
     * @internal
     */
    getCategoryById(id: string): Blockly.ISelectableToolboxItem | null {
        const category = this.getToolboxItemById(id);
        if (!(category instanceof Blockly.ToolboxCategory)) {
            return null;
        }
        return category;
    }

    /**
     * Selects the category with the given id.
     * Similar to setSelectedItem, but importantly, does not call updateFlyout
     * because this is called while the flyout is being scrolled.
     *
     * @param id Id of category to select.
     * @internal
     */
    selectCategoryById(id: string) {
        const newItem = this.getCategoryById(id);
        if (!newItem) return;

        const ancestors: Blockly.ICollapsibleToolboxItem[] = [];
        let parent = newItem.getParent();

        while (parent) {
            ancestors.push(parent as Blockly.ICollapsibleToolboxItem);
            parent = parent.getParent();
        }

        for (const ancestor of ancestors.reverse()) {
            if (!ancestor.isExpanded()) {
                ancestor.toggleExpanded();
            }
        }

        // hidden 等其他原因仍可能令分类不可选
        if (!newItem.isSelectable()) return;

        const oldItem = this.selectedItem_;

        if (oldItem && this.shouldDeselectItem_(oldItem, newItem)) {
            this.deselectItem_(oldItem);
        }

        if (this.shouldSelectItem_(oldItem, newItem)) {
            this.selectItem_(oldItem, newItem);
            const categoryDiv = newItem.getDiv();

            if (categoryDiv && this.HtmlDiv) {
                const target = Blockly.utils.style.getContainerOffsetToScrollInto(
                    categoryDiv,
                    this.HtmlDiv,
                    false,
                );

                this.HtmlDiv.scrollTo({
                    top: target.y,
                    left: target.x,
                    behavior: 'smooth',
                });
            }
        }
    }

    /**
     * Returns the bounding rectangle of the drag target/deletion area in pixels
     * relative to the viewport.
     *
     * @returns The toolbox's bounding box. Null if drag target area should be
     *     ignored.
     */
    override getClientRect(): Blockly.utils.Rect | null {
        // If the flyout never closes, it should be the deletable area.
        const flyout = this.getFlyout();
        if (flyout && !flyout.autoClose) {
            return flyout.getClientRect();
        }
        return super.getClientRect();
    }

    /**
     * Creates and renders the toolbox item.
     *
     * @param toolboxItemDef Any information that can be used to create an item in
     *     the toolbox.
     * @param fragment The document fragment to add the child toolbox elements to.
     */
    private createToolboxItem(
        toolboxItemDef: Blockly.utils.toolbox.ToolboxItemInfo,
        fragment: DocumentFragment,
    ) {
        let registryName = toolboxItemDef['kind'];

        // Categories that are collapsible are created using a class registered
        // under a different name.
        if (
            registryName.toUpperCase() === 'CATEGORY' &&
            Blockly.utils.toolbox.isCategoryCollapsible(
                toolboxItemDef as Blockly.utils.toolbox.CategoryInfo,
            )
        ) {
            registryName = Blockly.CollapsibleToolboxCategory.registrationName;
        }

        const ToolboxItemClass = Blockly.registry.getClass(
            Blockly.registry.Type.TOOLBOX_ITEM,
            registryName.toLowerCase(),
        );
        if (ToolboxItemClass) {
            const toolboxItem = new ToolboxItemClass(toolboxItemDef, this);
            toolboxItem.init();
            this.addToolboxItem_(toolboxItem);
            const toolboxItemDom = toolboxItem.getDiv();
            if (toolboxItemDom) {
                fragment.appendChild(toolboxItemDom);
            }

            // 加id到dom，这个只针对第一组，子组不影响（子组没用id）
            if ((toolboxItemDef as Blockly.utils.toolbox.CategoryInfo).id) {
                toolboxItem
                    .getClickTarget()
                    ?.classList.add(
                        (toolboxItemDef as Blockly.utils.toolbox.CategoryInfo).id ?? '',
                    );
            }

            // Adds the ID to the HTML element that can receive a click.
            // This is used in onClick_ to find the toolboxItem that was clicked.
            toolboxItem.getClickTarget()?.setAttribute('id', toolboxItem.getId());
        }
    }

    /** 收起当前选中分类及其祖先路径之外的所有可折叠分类。 */
    collapseOtherCategories() {
        const selected = this.getSelectedItem();
        const selectedPath = new Set<Blockly.IToolboxItem>();

        let item: Blockly.IToolboxItem | null = selected;
        while (item) {
            selectedPath.add(item);
            item = item.getParent();
        }

        this.contents.forEach(toolboxItem => {
            if (
                toolboxItem instanceof Blockly.CollapsibleToolboxCategory &&
                !selectedPath.has(toolboxItem)
            ) {
                toolboxItem.setExpanded(false);
            }
        });
    }

    /**
     * Adds all the toolbox items to the toolbox.
     *
     * @param toolboxDef Array holding objects containing information on the
     *     contents of the toolbox.
     */
    protected renderContents_(toolboxDef: Blockly.utils.toolbox.ToolboxItemInfo[]) {
        // This is for performance reasons. By using document fragment we only have
        // to add to the DOM once.
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < toolboxDef.length; i++) {
            const toolboxItemDef = toolboxDef[i];
            this.createToolboxItem(toolboxItemDef, fragment);
        }
        this.contentsDiv_?.appendChild(fragment);
    }
}
