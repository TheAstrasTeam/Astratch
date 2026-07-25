/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * 由 AstrasTeam 修改于 2026/7/3:
 * - 增加一个降低HEX亮度的方法
 * - 修改边框颜色为`this.colour_`降低20%亮度的颜色
 * 
 * 由 AstrasTeam 修改于 2026/7/25:
 * - 删除修改的圆形，使用 Blockly 原生的样式
 * - 将类的 padding 改为 margin
 * - 修改选中时的颜色
 */

/**
 * @fileoverview Toolbox category with styling for continuous toolbox.
 */

import * as Blockly from 'blockly/core';

const { aria, dom } = Blockly.utils;

/** Toolbox category for continuous toolbox. */
export class ContinuousCategory extends Blockly.ToolboxCategory {
    static override borderWidth = 2;
    defaultBackgroundColour = '#55555540';

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
            if (!this.colour_) this.colour_ = this.defaultBackgroundColour;
            else if (this.colour_.length === 7) this.colour_ += '50';
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
}
