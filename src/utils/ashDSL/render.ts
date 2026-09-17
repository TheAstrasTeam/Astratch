/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 序列化状态 → 积木 SVG
 */

import * as Blockly from 'blockly';
import type { TState } from './types';

/** 收集需要内联到导出 SVG 里的样式（Blockly 公共样式 / 渲染器样式 / 主题变量） */
const _getBlockStyle = (): string =>
    Array.from(document.head.querySelectorAll('style'))
        .filter(
            el =>
                el.className === 'blockly-renderer-style' ||
                el.id === 'blockly-common-style' ||
                el.className === 'ash-style',
        )
        .map(el => el.textContent)
        .join('\n');

/**
 * 由积木 AST 生成积木 SVG
 * @param ast 序列化状态
 * @param needStyle 是否内联样式（用于导出）
 */
export const spawnBlocksSvg = async (ast: TState, needStyle = false): Promise<string> => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-99999px;top:0;';
    document.body.appendChild(host);

    const ws = Blockly.inject(host, {
        renderer: 'astratch',
        theme: 'astratch',
        plugins: {},
        trashcan: false,
        toolbox: undefined,
    });

    const block = Blockly.serialization.blocks.append(ast, ws) as Blockly.BlockSvg;
    // 部分积木在 loadExtraState 里排了延后更新（如布尔块连上父块后继承父色），
    // 等一个微任务让它们跑完再渲染，否则导出会拿到错误的颜色
    await Promise.resolve();
    ws.getRenderer().render(block);
    // 运行时用 setShadowState 建的 shadow（如函数实参提示）可能晚于首次渲染，
    // 逐个补一次，避免导出拿到空字段
    for (const child of ws.getAllBlocks(false)) {
        child.render();
    }

    const bBox = ws.getBlocksBoundingBox();
    const canvas = ws.getCanvas().cloneNode(true) as SVGGElement;
    canvas.removeAttribute('transform');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('class', 'blocklySvg astratch-renderer astratch-theme');
    svg.setAttribute(
        'viewBox',
        `${String(bBox.left)} ${String(bBox.top)} ${String(bBox.getWidth())} ${String(bBox.getHeight())}`,
    );
    svg.setAttribute('width', String(bBox.getWidth()));
    svg.setAttribute('height', String(bBox.getHeight()));
    svg.appendChild(canvas);

    // 清掉只对交互有意义、但会污染导出的属性
    canvas.querySelectorAll('*').forEach(el => {
        el.removeAttribute('aria-label');
        el.removeAttribute('aria-roledescription');
        el.removeAttribute('role');
        el.removeAttribute('data-id');
        el.removeAttribute('id');
        el.removeAttribute('focusable');
    });

    const style = document.createElement('style');
    if (needStyle) style.textContent = _getBlockStyle();
    svg.insertBefore(style, svg.firstChild);
    svg.querySelectorAll('*').forEach(el => {
        if (!(el instanceof SVGElement)) return;
        el.style.cursor = 'unset';
    });

    const svgString = new XMLSerializer().serializeToString(svg);
    ws.dispose();
    host.remove();
    return svgString;
};
