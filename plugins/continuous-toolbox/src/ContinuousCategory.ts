/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * 由 AstrasTeam 修改于 2026/7/3:
 * - 增加一个降低HEX亮度的方法
 * - 修改边框颜色为`this.colour_`降低20%亮度的颜色
 */

/**
 * @fileoverview Toolbox category with styling for continuous toolbox.
 */

import * as Blockly from 'blockly/core';

/** Toolbox category for continuous toolbox. */
export class ContinuousCategory extends Blockly.ToolboxCategory {
    /**
     * 降低HEX颜色亮度
     * @param hex - 十六进制颜色值（支持3位或6位，可带#）
     * @param percent - 降低亮度的百分比（0-100）
     * @returns 降低亮度后的HEX颜色值
     */
    darkenHexColor(hex: string, percent: number) {
        let cleanHex = hex.replace('#', '');

        if (cleanHex.length === 3) {
            cleanHex = cleanHex
                .split('')
                .map(c => c + c)
                .join('');
        }

        let r = parseInt(cleanHex.substring(0, 2), 16);
        let g = parseInt(cleanHex.substring(2, 4), 16);
        let b = parseInt(cleanHex.substring(4, 6), 16);

        const factor = 1 - percent / 100;
        r = Math.max(0, Math.floor(r * factor));
        g = Math.max(0, Math.floor(g * factor));
        b = Math.max(0, Math.floor(b * factor));

        return `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`;
    }

    /**
     * Creates a DOM element to display the category's label.
     *
     * @param name The name of this category.
     * @returns The newly created category label DOM element.
     */

    override createLabelDom_(name: string): Element {
        const label = document.createElement('div');
        label.setAttribute('id', this.getId() + '.label');
        label.textContent = name;
        label.classList.add(this.cssConfig_['label'] ?? '');
        return label;
    }

    /**
     * Creates a DOM element to display the category's icon. This category uses
     * color swatches instead of graphical icons.
     *
     * @returns The newly created category icon DOM element.
     */

    override createIconDom_(): Element {
        const icon = document.createElement('div');
        icon.classList.add('categoryBubble');
        icon.style.backgroundColor = this.colour_;
        icon.style.borderColor = this.darkenHexColor(this.colour_, 20);
        return icon;
    }

    /**
     * Adds a color indicator to the toolbox category. Intentionally a no-op.
     */

    override addColourBorder_() {
        // No-op
    }

    /**
     * Sets whether or not this category is selected in the toolbox.
     *
     * @param isSelected True if this category is selected, otherwise false.
     */
    override setSelected(isSelected: boolean) {
        if (!this.rowDiv_ || !this.htmlDiv_) return;
        if (isSelected) {
            this.rowDiv_.style.backgroundColor = 'gray';
            Blockly.utils.dom.addClass(this.rowDiv_, this.cssConfig_['selected'] ?? '');
        } else {
            this.rowDiv_.style.backgroundColor = '';
            Blockly.utils.dom.removeClass(this.rowDiv_, this.cssConfig_['selected'] ?? '');
        }
        Blockly.utils.aria.setState(this.htmlDiv_, Blockly.utils.aria.State.SELECTED, isSelected);
    }
}
