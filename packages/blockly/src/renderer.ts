/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import { OPCODES } from './toolbox/opcodes';

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

        // 若多类型列表则直接渲染默认的形状
        if (checks && checks.length > 1) {
            return this.ROUNDED as unknown as Blockly.blockRendering.DynamicShape;
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

/**
 * 在 zelos 的排版结果上补齐“纯图标行”的紧凑处理。
 *
 * zelos 只压缩只含一个文本/图片的行。末尾并排两个加号按钮时这一行会高出一圈，
 * 这里对只含多个图片字段、且上下都有连接槽的行套用同样的压缩量。
 *
 * @author AI
 */
class AstratchRenderInfo extends Blockly.zelos.RenderInfo {
    protected override finalizeVerticalAlignment_() {
        super.finalizeVerticalAlignment_();
        if (this.outputConnection) return;
        for (let i = 2; i < this.rows.length - 1; i += 2) {
            const row = this.rows[i];
            const prevSpacer = this.rows[i - 1] as Blockly.blockRendering.SpacerRow;
            const nextSpacer = this.rows[i + 1] as Blockly.blockRendering.SpacerRow;
            const hasPrevNotch =
                i === 2 ? this.topRow.hasPreviousConnection : prevSpacer.followsStatement;
            const hasNextNotch =
                i + 2 >= this.rows.length - 1
                    ? this.bottomRow.hasNextConnection
                    : nextSpacer.precedesStatement;
            const fields = row.elements.filter(
                elem => !Blockly.blockRendering.Types.isSpacer(elem),
            );
            if (
                !hasPrevNotch ||
                !hasNextNotch ||
                fields.length < 2 ||
                !fields.every(
                    elem =>
                        Blockly.blockRendering.Types.isField(elem) &&
                        elem.field instanceof Blockly.FieldImage,
                )
            ) {
                continue;
            }
            prevSpacer.height -= this.constants_.SMALL_PADDING;
            nextSpacer.height -= this.constants_.SMALL_PADDING;
            row.height -= this.constants_.MEDIUM_PADDING;
        }
    }
}

class AstratchRenderer extends Blockly.zelos.Renderer {
    protected override makeConstants_() {
        return new AstratchConstantProvider();
    }

    protected override makeRenderInfo_(block: Blockly.BlockSvg) {
        return new AstratchRenderInfo(this, block);
    }

    protected override makeDrawer_(block: Blockly.BlockSvg, info: Blockly.zelos.RenderInfo) {
        return new AstratchDrawer(block, info);
    }
}

/** 为所有空 Function 插槽绘制不依赖字体的 SVG 函数提示 */
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
    protected override recordSizeOnBlock_(): void {
        super.recordSizeOnBlock_();
        if (this.block_.type !== OPCODES.string) return;
        const root = this.block_.getSvgRoot();

        root.querySelectorAll('.ashStringSlotHint').forEach(e => {
            if (e.getAttribute('data-owner') === this.block_.id) e.remove();
        });

        const base = {
            class: 'ashStringSlotHint',
            'data-owner': this.block_.id,
            'pointer-events': 'none',
            'aria-hidden': 'true',
            focusable: 'false',
        };
        Blockly.utils.dom.createSvgElement(
            'path',
            {
                ...base,
                d: 'M0 1.44922C0 0.975261 0.213009 0.610677 0.213009 0.610677C0.426019 0.246094 0.933615 0 0.933615 0L1.16022 0.419271C0.779523 0.601563 0.616367 0.833985 0.616367 0.833985C0.453211 1.06641 0.453211 1.44922 0.453211 1.44922L1.03332 1.44922L1.03332 2.48828L0 2.48828L0 1.44922ZM1.39589 1.44922C1.39589 0.975261 1.6089 0.610677 1.6089 0.610677C1.82191 0.246094 2.32951 0 2.32951 0L2.56518 0.419271C2.18448 0.601563 2.02132 0.833985 2.02132 0.833985C1.85817 1.06641 1.85817 1.44922 1.85817 1.44922L2.43828 1.44922L2.43828 2.48828L1.39589 2.48828L1.39589 1.44922Z',
                transform: 'translate(5 5) scale(4)',
            },
            root,
        );
        Blockly.utils.dom.createSvgElement(
            'path',
            {
                ...base,
                d: 'M0 2.06901C0.371633 1.88672 0.534789 1.6543 0.534789 1.6543C0.697945 1.42188 0.697945 1.03906 0.697945 1.03906L0.126899 1.03906L0.126899 0L1.16022 0L1.16022 1.03906C1.16022 1.51302 0.947211 1.8776 0.947211 1.8776C0.734202 2.24219 0.226606 2.48828 0.226606 2.48828L0 2.06901ZM1.39589 2.06901C1.77659 1.88672 1.93974 1.6543 1.93974 1.6543C2.1029 1.42188 2.1029 1.03906 2.1029 1.03906L1.52279 1.03906L1.52279 0L2.56518 0L2.56518 1.03906C2.56518 1.51302 2.35217 1.8776 2.35217 1.8776C2.13916 2.24219 1.63156 2.48828 1.63156 2.48828L1.39589 2.06901Z',
                transform: `translate(${String(this.block_.width - 15)} ${String(this.block_.height - 15)}) scale(4)`,
            },
            root,
        );
    }
}

export function registerAstratchRenderer() {
    if (Blockly.registry.hasItem(Blockly.registry.Type.RENDERER, 'astratch')) return;
    Blockly.blockRendering.register('astratch', AstratchRenderer);
}
