/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

const ARRAY_SHAPE_TYPE = 6;
const OBJECT_SHAPE_TYPE = 7;
const MATCH_NOTCH_TYPE = 8;
const FUNCTION_SHAPE_TYPE = 9;
const STRING_SHAPE_TYPE = 10;
const MATCH_BRANCH_CHECK = 'MatchBranch';

class AstratchConstantProvider extends Blockly.zelos.ConstantProvider {
    arrayShape: Blockly.blockRendering.DynamicShape | null = null;
    objectShape: Blockly.blockRendering.DynamicShape | null = null;
    functionShape: Blockly.blockRendering.DynamicShape | null = null;
    stringShape: Blockly.blockRendering.DynamicShape | null = null;
    matchNotch: Blockly.blockRendering.Notch | null = null;

    constructor() {
        super();

        const valueShapeTypes = [
            this.SHAPES.HEXAGONAL,
            this.SHAPES.ROUND,
            this.SHAPES.SQUARE,
            ARRAY_SHAPE_TYPE,
            OBJECT_SHAPE_TYPE,
            FUNCTION_SHAPE_TYPE,
            STRING_SHAPE_TYPE,
        ];
        const customValueShapeTypes = [
            ARRAY_SHAPE_TYPE,
            OBJECT_SHAPE_TYPE,
            FUNCTION_SHAPE_TYPE,
            STRING_SHAPE_TYPE,
        ];
        const padding = 2 * this.GRID_UNIT;

        for (const row of Object.values(this.SHAPE_IN_SHAPE_PADDING)) {
            for (const customShape of customValueShapeTypes) {
                row[customShape] = padding;
            }
        }
        for (const outerShape of customValueShapeTypes) {
            this.SHAPE_IN_SHAPE_PADDING[outerShape] = { 0: padding };
            for (const innerShape of valueShapeTypes) {
                this.SHAPE_IN_SHAPE_PADDING[outerShape][innerShape] = padding;
            }
        }
    }

    override init() {
        super.init();
        this.arrayShape = this.makeArrayShape();
        this.objectShape = this.makeObjectShape();
        this.functionShape = this.makeFunctionShape();
        this.stringShape = this.makeStringShape();
        this.matchNotch = this.makeMatchNotch();
    }

    private makeArrayShape(): Blockly.blockRendering.DynamicShape {
        const width = 3 * this.GRID_UNIT;

        const makePath = (height: number, up: boolean, right: boolean) => {
            const forward = up ? -1 : 1;
            const direction = right ? -1 : 1;
            const shoulder = Math.min(2 * this.GRID_UNIT, height / 4);
            return Blockly.utils.svgPaths.line([
                Blockly.utils.svgPaths.point(-direction * width, forward * shoulder),
                Blockly.utils.svgPaths.point(0, forward * (height - shoulder * 2)),
                Blockly.utils.svgPaths.point(direction * width, forward * shoulder),
            ]);
        };

        return {
            type: ARRAY_SHAPE_TYPE,
            isDynamic: true,
            width: () => width,
            height: height => height,
            connectionOffsetY: height => height / 2,
            connectionOffsetX: connectionWidth => -connectionWidth,
            pathDown: height => makePath(height, false, false),
            pathUp: height => makePath(height, true, false),
            pathRightDown: height => makePath(height, false, true),
            pathRightUp: height => makePath(height, true, true),
        };
    }

    private makeObjectShape(): Blockly.blockRendering.DynamicShape {
        const width = this.GRID_UNIT;

        const makePath = (height: number, up: boolean, right: boolean) => {
            const forward = up ? -1 : 1;
            const direction = right ? -1 : 1;
            const outerX = -direction * width;
            const shoulderHeight = Math.min(this.GRID_UNIT, height / 5);
            const toothHeight = Math.min(this.GRID_UNIT, height / 5);
            const verticalHeight = height / 2 - shoulderHeight - toothHeight;

            return Blockly.utils.svgPaths.line([
                Blockly.utils.svgPaths.point(outerX, forward * shoulderHeight),
                Blockly.utils.svgPaths.point(0, forward * verticalHeight),
                Blockly.utils.svgPaths.point(outerX, forward * toothHeight),
                Blockly.utils.svgPaths.point(-outerX, forward * toothHeight),
                Blockly.utils.svgPaths.point(0, forward * verticalHeight),
                Blockly.utils.svgPaths.point(-outerX, forward * shoulderHeight),
            ]);
        };

        return {
            type: OBJECT_SHAPE_TYPE,
            isDynamic: true,
            width: () => width,
            height: height => height,
            connectionOffsetY: height => height / 2,
            connectionOffsetX: connectionWidth => -connectionWidth,
            pathDown: height => makePath(height, false, false),
            pathUp: height => makePath(height, true, false),
            pathRightDown: height => makePath(height, false, true),
            pathRightUp: height => makePath(height, true, true),
        };
    }

    private makeStringShape(): Blockly.blockRendering.DynamicShape {
        // 此函数由AI生成
        // 圆角矩形：固定浅弧，与 Number 的圆形、Function 的括号形区分。
        const maxRadius = 1.5 * this.GRID_UNIT;

        const radiusFor = (height: number): number => Math.min(maxRadius, height / 2);

        const makePath = (height: number, up: boolean, right: boolean) => {
            const radius = radiusFor(height);
            const straightHeight = height - radius * 2;
            const sweep = right === up ? '0' : '1';
            return (
                Blockly.utils.svgPaths.arc(
                    'a',
                    `0 0,${sweep}`,
                    radius,
                    Blockly.utils.svgPaths.point((right ? 1 : -1) * radius, (up ? -1 : 1) * radius),
                ) +
                Blockly.utils.svgPaths.lineOnAxis('v', (up ? -1 : 1) * straightHeight) +
                Blockly.utils.svgPaths.arc(
                    'a',
                    `0 0,${sweep}`,
                    radius,
                    Blockly.utils.svgPaths.point((right ? -1 : 1) * radius, (up ? -1 : 1) * radius),
                )
            );
        };

        return {
            type: STRING_SHAPE_TYPE,
            isDynamic: true,
            width: height => radiusFor(height),
            height: height => height,
            connectionOffsetY: height => height / 2,
            connectionOffsetX: connectionWidth => -connectionWidth,
            pathDown: height => makePath(height, false, false),
            pathUp: height => makePath(height, true, false),
            pathRightDown: height => makePath(height, false, true),
            pathRightUp: height => makePath(height, true, true),
        };
    }

    private makeFunctionShape(): Blockly.blockRendering.DynamicShape {
        const maxRadius = 6 * this.GRID_UNIT;

        // 括号形：两端为接近半圆的明显圆弧，中间保留一段硬直切，
        // 与胶囊（圆弧直接相接）和圆角矩形（浅弧）区分开。
        const radiusFor = (height: number): number =>
            Math.max(this.GRID_UNIT, Math.min(height / 2 - this.GRID_UNIT, maxRadius));

        const makePath = (height: number, up: boolean, right: boolean) => {
            const radius = radiusFor(height);
            const straightHeight = height - radius * 2;
            const sweep = right === up ? '0' : '1';
            return (
                Blockly.utils.svgPaths.arc(
                    'a',
                    `0 0,${sweep}`,
                    radius,
                    Blockly.utils.svgPaths.point((right ? 1 : -1) * radius, (up ? -1 : 1) * radius),
                ) +
                Blockly.utils.svgPaths.lineOnAxis('v', (up ? -1 : 1) * straightHeight) +
                Blockly.utils.svgPaths.arc(
                    'a',
                    `0 0,${sweep}`,
                    radius,
                    Blockly.utils.svgPaths.point((right ? -1 : 1) * radius, (up ? -1 : 1) * radius),
                )
            );
        };

        return {
            type: FUNCTION_SHAPE_TYPE,
            isDynamic: true,
            width: height => radiusFor(height),
            height: height => height,
            connectionOffsetY: height => height / 2,
            connectionOffsetX: connectionWidth => -connectionWidth,
            pathDown: height => makePath(height, false, false),
            pathUp: height => makePath(height, true, false),
            pathRightDown: height => makePath(height, false, true),
            pathRightUp: height => makePath(height, true, true),
        };
    }

    private makeMatchNotch(): Blockly.blockRendering.Notch {
        const toothWidth = 2 * this.GRID_UNIT;
        const toothHeight = 2 * this.GRID_UNIT;
        const edgeWidth = 2 * this.GRID_UNIT;
        const width = edgeWidth * 2 + toothWidth * 4;

        const makePath = (direction: number) =>
            Blockly.utils.svgPaths.line([
                Blockly.utils.svgPaths.point(direction * edgeWidth, 0),
                Blockly.utils.svgPaths.point(direction * toothWidth, toothHeight),
                Blockly.utils.svgPaths.point(direction * toothWidth, -toothHeight),
                Blockly.utils.svgPaths.point(direction * toothWidth, toothHeight),
                Blockly.utils.svgPaths.point(direction * toothWidth, -toothHeight),
                Blockly.utils.svgPaths.point(direction * edgeWidth, 0),
            ]);

        return {
            type: MATCH_NOTCH_TYPE,
            width,
            height: toothHeight,
            pathLeft: makePath(1),
            pathRight: makePath(-1),
        };
    }

    override shapeFor(connection: Blockly.RenderedConnection) {
        let checks = connection.getCheck();
        if (!checks && connection.targetConnection) {
            checks = connection.targetConnection.getCheck();
        }

        // 是的可恶的Blockly使用的东西让ASH有一百个报错，无奈忽略
        if (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            connection.type === Blockly.ConnectionType.INPUT_VALUE ||
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            connection.type === Blockly.ConnectionType.OUTPUT_VALUE
        ) {
            if (checks?.includes('Array'))
                return this.arrayShape as unknown as Blockly.blockRendering.DynamicShape;
            if (checks?.includes('Object'))
                return this.objectShape as unknown as Blockly.blockRendering.DynamicShape;
            if (checks?.includes('Function'))
                return this.functionShape as unknown as Blockly.blockRendering.DynamicShape;
            if (checks?.includes('String'))
                return this.stringShape as unknown as Blockly.blockRendering.DynamicShape;
        }

        if (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            (connection.type === Blockly.ConnectionType.PREVIOUS_STATEMENT ||
                // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                connection.type === Blockly.ConnectionType.NEXT_STATEMENT) &&
            checks?.includes(MATCH_BRANCH_CHECK)
        ) {
            return this.matchNotch as unknown as Blockly.blockRendering.DynamicShape;
        }

        return super.shapeFor(connection);
    }
}

class AstratchRenderer extends Blockly.zelos.Renderer {
    protected override makeConstants_() {
        return new AstratchConstantProvider();
    }

    protected override makeDrawer_(block: Blockly.BlockSvg, info: Blockly.zelos.RenderInfo) {
        return new AstratchDrawer(block, info);
    }
}

/** 为所有空 Function 插槽绘制不依赖字体的 SVG 函数提示。 */
class AstratchDrawer extends Blockly.zelos.Drawer {
    override draw() {
        for (const child of Array.from(this.block_.getSvgRoot().children)) {
            if (child.hasAttribute('data-ash-function-hint')) child.remove();
        }
        super.draw();
    }

    override drawInlineInput_(input: Blockly.blockRendering.InlineInput) {
        super.drawInlineInput_(input);

        if (input.connectedBlock || this.info_.isInsertionMarker) return;
        if (!input.input.connection?.getCheck()?.includes('Function')) return;

        const innerWidth = input.width - input.connectionWidth * 2;
        const iconScale = Math.max(0.62, Math.min(0.82, input.height / 34));
        const iconWidth = 17 * iconScale;
        const iconHeight = 24 * iconScale;
        const x = input.xPos + input.connectionWidth + (innerWidth - iconWidth) / 2;
        const y = input.centerline - iconHeight / 2;
        const hint = Blockly.utils.dom.createSvgElement(
            'path',
            {
                'data-ash-function-hint': input.input.name,
                class: 'ashFunctionSlotHint',
                d: 'M15.5 3.2C13.2 1.4 10.2 2.2 9.2 5.2C7.9 9.1 7.8 14.8 6.3 19.1C5.5 21.3 4.2 22.5 2.2 22.2M4.8 10.4H13.2',
                transform: `translate(${String(x)} ${String(y)}) scale(${String(iconScale)})`,
                'pointer-events': 'none',
                'aria-hidden': 'true',
            },
            this.block_.getSvgRoot(),
        );
        hint.setAttribute('focusable', 'false');
    }
}

export function registerAstratchRenderer() {
    if (Blockly.registry.hasItem(Blockly.registry.Type.RENDERER, 'astratch')) return;
    Blockly.blockRendering.register('astratch', AstratchRenderer);
}
