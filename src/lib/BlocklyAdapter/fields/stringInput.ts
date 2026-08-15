/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/** 字符串输入框 */
export class StringInputField extends Blockly.FieldTextInput {
    private openQuote: SVGPathElement | null = null;
    private closeQuote: SVGPathElement | null = null;
    private quoteSvg =
        'M6.55 16.5L8 14q-1.65 0-2.825-1.175T4 10t1.175-2.825T8 6t2.825 1.175T12 10q0 .575-.137 1.063T11.45 12l-3.175 5.5q-.125.225-.35.363t-.5.137q-.575 0-.862-.5t-.013-1m9 0L17 14q-1.65 0-2.825-1.175T13 10t1.175-2.825T17 6t2.825 1.175T21 10q0 .575-.137 1.063T20.45 12l-3.175 5.5q-.125.225-.35.363t-.5.137q-.575 0-.862-.5t-.013-1';

    override initView() {
        super.initView();
        const root = this.getSvgRoot();
        if (!root) return;

        const quoteGroup = Blockly.utils.dom.createSvgElement(
            'g',
            {
                class: 'ashStringInputQuotes',
                'pointer-events': 'none',
            },
            root,
        );
        this.openQuote = Blockly.utils.dom.createSvgElement(
            'path',
            {
                class: 'ashStringInputQuote ashStringInputQuoteOpen',
                d: this.quoteSvg,
            },
            quoteGroup,
        );
        this.closeQuote = Blockly.utils.dom.createSvgElement(
            'path',
            {
                class: 'ashStringInputQuote ashStringInputQuoteClose',
                d: this.quoteSvg,
            },
            quoteGroup,
        );
    }

    protected override updateSize_(margin?: number) {
        super.updateSize_(margin ?? 8);
        this.positionQuotes();
    }

    protected override positionBorderRect_() {
        super.positionBorderRect_();
        const radius = this.getBorderRadius();
        this.borderRect_?.setAttribute('rx', String(radius));
        this.borderRect_?.setAttribute('ry', String(radius));
    }

    protected override widgetCreate_(): HTMLInputElement | HTMLTextAreaElement {
        const editor = super.widgetCreate_();
        const workspace = this.getSourceBlock()?.workspace as Blockly.WorkspaceSvg | undefined;
        const scale = workspace?.getAbsoluteScale() ?? 1;
        const radius = `${String(this.getBorderRadius() * scale)}px`;

        editor.style.borderRadius = radius;
        const widget = Blockly.WidgetDiv.getDiv();
        if (widget) widget.style.borderRadius = radius;

        return editor;
    }

    private getBorderRadius(): number {
        return Math.min(6, this.size_.height / 4);
    }

    private positionQuotes() {
        const { width, height } = this.size_;
        const inset = 8;
        const scale = height / 40;
        this.openQuote?.setAttribute(
            'transform',
            `translate(${String(inset)} ${String(inset)}) scale(${String(scale)}) rotate(180)`,
        );
        this.closeQuote?.setAttribute(
            'transform',
            `translate(${String(width - inset)} ${String(height - inset)}) scale(${String(scale)})`,
        );
    }
}
