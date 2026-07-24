/**
 * @license
 * Copyright 2020 Google LLC
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview 修改可折叠工具箱
 */

import * as Blockly from 'blockly/core';

const { aria, dom } = Blockly.utils;

export class CollapsibleContinuousCategory extends Blockly.CollapsibleToolboxCategory {
    static override borderWidth = 2;
    defaultBackgroundColour = '#ffffff50';

    /**
     * Creates the parent of the contents container. All clicks will happen on
     * this div.
     *
     * @returns The div that holds the contents container.
     */
    protected override createRowContainer_(): HTMLDivElement {
        const rowDiv = document.createElement('div');
        const className = this.cssConfig_['row'];
        if (className) {
            dom.addClass(rowDiv, className);
        }
        const nestedPadding = `${Blockly.ToolboxCategory.nestedPadding * this.getLevel()}px`;
        if (this.workspace_.RTL) {
            rowDiv.style.marginRight = nestedPadding;
        } else {
            rowDiv.style.marginLeft = nestedPadding;
        }
        return rowDiv;
    }

    /**
     * Sets the current category as selected.
     *
     * @param isSelected True if this category is selected, false otherwise.
     */
    override setSelected(isSelected: boolean) {
        if (!this.rowDiv_) {
            return;
        }
        const className = this.cssConfig_['selected'];
        if (isSelected) {
            const defaultColour = this.defaultBackgroundColour;
            if (!this.colour_) this.colour_ = defaultColour;
            else if (this.colour_.length === 7) this.colour_ = `${this.colour_}50`;
            this.rowDiv_.style.backgroundColor = this.colour_;
            if (className) {
                dom.addClass(this.rowDiv_, className);
            }
        } else {
            this.rowDiv_.style.backgroundColor = '';
            if (className) {
                dom.removeClass(this.rowDiv_, className);
            }
        }
        aria.setState(this.htmlDiv_ as Element, aria.State.SELECTED, isSelected);
    }

    /**
     * Create the DOM for all subcategories.
     *
     * @param subcategories The subcategories.
     * @returns The div holding all the subcategories.
     */
    protected createSubCategoriesDom_(subcategories: Blockly.IToolboxItem[]): HTMLDivElement {
        const contentsContainer = document.createElement('div');
        contentsContainer.style.display = 'none';
        const className = this.cssConfig_['contents'];
        if (className) {
            dom.addClass(contentsContainer, className);
        }
        dom.addClass(contentsContainer, 'continuousToolboxIndentGuide');

        contentsContainer.style.setProperty(
            '--continuous-toolbox-guide-offset',
            `${Blockly.ToolboxCategory.nestedPadding * this.getLevel()}px`,
        );

        for (let i = 0; i < subcategories.length; i++) {
            const newCategory = subcategories[i];
            newCategory.init();
            const newCategoryDiv = newCategory.getDiv();
            contentsContainer.appendChild(newCategoryDiv!);
            if (newCategory.getClickTarget) {
                newCategory.getClickTarget()?.setAttribute('id', newCategory.getId());
            }
        }
        return contentsContainer;
    }
}
