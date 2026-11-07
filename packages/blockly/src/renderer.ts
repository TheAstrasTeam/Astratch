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
            if (
                child.hasAttribute('data-ash-function-hint') ||
                child.hasAttribute('data-ash-getter-hint')
            )
                child.remove();
        }
        super.draw();
    }

    override drawInlineInput_(input: Blockly.blockRendering.InlineInput) {
        super.drawInlineInput_(input);

        if (input.connectedBlock || this.info_.isInsertionMarker) return;

        const checks = input.input.connection?.getCheck();
        if (!checks) return;
        if (checks.includes('Function')) {
            const innerWidth = input.width - input.connectionWidth * 2;
            const iconScale = 0.9;
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
        } else if (checks.includes('Getter')) {
            const innerWidth = input.width - input.connectionWidth * 2;
            const iconScale = 0.15;
            const iconWidth = 200 * iconScale;
            const iconHeight = 90 * iconScale;
            const x = input.xPos + input.connectionWidth + (innerWidth - iconWidth) / 2;
            const y = input.centerline - iconHeight / 2;
            const hint = Blockly.utils.dom.createSvgElement(
                'path',
                {
                    'data-ash-getter-hint': input.input.name,
                    class: 'ashGetterSlotHint',
                    d: 'M144.812 0L60.3123 0C59.6057 0 58.8981 0.0153252 58.1923 0.05C57.4865 0.0846748 56.7855 0.140734 56.0823 0.21C55.3789 0.279266 54.6712 0.36631 53.9723 0.47C53.2732 0.57369 52.5853 0.692135 51.8923 0.83C51.1993 0.967865 50.5078 1.11829 49.8223 1.29C49.1368 1.46171 48.4585 1.65486 47.7823 1.86C47.1061 2.06514 46.4277 2.28193 45.7623 2.52C45.0969 2.75807 44.4452 3.01956 43.7923 3.29C43.1394 3.56044 42.4911 3.84787 41.8523 4.15C41.2135 4.45215 40.5856 4.76687 39.9623 5.1C39.339 5.43311 38.7185 5.77671 38.1123 6.14C37.5062 6.50329 36.9099 6.88739 36.3223 7.28C35.7347 7.67261 35.1599 8.07904 34.5923 8.5C34.0247 8.92096 33.4686 9.35168 32.9223 9.8C32.3761 10.2483 31.8359 10.7154 31.3123 11.19C30.7887 11.6646 30.282 12.1503 29.7823 12.65C29.2826 13.1497 28.7969 13.6564 28.3223 14.18C27.8477 14.7036 27.3806 15.2438 26.9323 15.79C26.484 16.3363 26.0533 16.8924 25.6323 17.46C25.2114 18.0276 24.8049 18.6024 24.4123 19.19C24.0197 19.7776 23.6356 20.3739 23.2723 20.98C22.909 21.5862 22.5654 22.2067 22.2323 22.83C21.8992 23.4533 21.5845 24.0812 21.2823 24.72C20.9802 25.3588 20.6928 26.0071 20.4223 26.66C20.1519 27.3129 19.8904 27.9646 19.6523 28.63C19.4143 29.2954 19.1975 29.9738 18.9923 30.65C18.7872 31.3262 18.594 32.0045 18.4223 32.69C18.2507 33.3752 18.1003 34.0664 17.9625 34.7591L45.4046 34.7591C59.3375 34.7591 70.6323 46.054 70.6323 59.9869L70.6323 86.36L144.812 86.36C145.518 86.36 146.226 86.3448 146.932 86.31C147.638 86.2752 148.34 86.2193 149.042 86.15C149.746 86.0807 150.452 85.9939 151.152 85.89C151.849 85.7864 152.549 85.668 153.242 85.53C153.935 85.392 154.615 85.2416 155.302 85.07C155.986 84.8984 156.676 84.7051 157.352 84.5C158.028 84.2949 158.697 84.0781 159.362 83.84C160.027 83.6019 160.688 83.3405 161.342 83.07C161.994 82.7995 162.633 82.512 163.272 82.21C163.911 81.908 164.548 81.5931 165.172 81.26C165.796 80.9269 166.405 80.5834 167.012 80.22C167.619 79.8566 168.215 79.4727 168.802 79.08C169.391 78.6873 169.964 78.2808 170.532 77.86C171.1 77.439 171.666 77.0084 172.212 76.56C172.758 76.1116 173.287 75.6445 173.812 75.17C174.337 74.6954 174.843 74.2098 175.342 73.71C175.841 73.2104 176.337 72.7036 176.812 72.18C177.287 71.6564 177.745 71.1162 178.192 70.57C178.641 70.0236 179.071 69.4676 179.492 68.9C179.913 68.3324 180.321 67.7575 180.712 67.17C181.105 66.5825 181.487 65.986 181.852 65.38C182.215 64.7738 182.56 64.1533 182.892 63.53C183.227 62.9067 183.55 62.2788 183.852 61.64C184.154 61.0012 184.442 60.3529 184.712 59.7C184.982 59.0471 185.232 58.3954 185.472 57.73C185.709 57.0646 185.927 56.3862 186.132 55.71C186.337 55.0338 186.529 54.3555 186.702 53.67C186.873 52.9845 187.024 52.293 187.162 51.6C187.298 50.907 187.426 50.2191 187.532 49.52C187.636 48.8211 187.713 48.1134 187.782 47.41C187.851 46.7068 187.907 46.0058 187.942 45.3C187.977 44.5942 187.992 43.8866 187.992 43.18C187.992 42.4734 187.977 41.7658 187.942 41.06C187.907 40.3542 187.851 39.6532 187.782 38.95C187.713 38.2466 187.636 37.5389 187.532 36.84C187.426 36.1409 187.298 35.453 187.162 34.76C187.024 34.067 186.873 33.3755 186.702 32.69C186.529 32.0045 186.337 31.3262 186.132 30.65C185.927 29.9738 185.709 29.2954 185.472 28.63C185.232 27.9646 184.982 27.3129 184.712 26.66C184.442 26.0071 184.154 25.3588 183.852 24.72C183.55 24.0812 183.227 23.4533 182.892 22.83C182.56 22.2067 182.215 21.5862 181.852 20.98C181.487 20.3739 181.105 19.7776 180.712 19.19C180.321 18.6024 179.913 18.0276 179.492 17.46C179.071 16.8924 178.641 16.3363 178.192 15.79C177.745 15.2438 177.287 14.7036 176.812 14.18C176.337 13.6564 175.841 13.1497 175.342 12.65C174.843 12.1503 174.337 11.6646 173.812 11.19C173.287 10.7154 172.758 10.2483 172.212 9.8C171.666 9.35168 171.1 8.92096 170.532 8.5C169.964 8.07904 169.391 7.67261 168.802 7.28C168.215 6.88739 167.619 6.50329 167.012 6.14C166.405 5.77671 165.796 5.43313 165.172 5.1C164.548 4.76689 163.911 4.45215 163.272 4.15C162.633 3.84787 161.994 3.56044 161.342 3.29C160.688 3.01956 160.027 2.75807 159.362 2.52C158.697 2.28193 158.028 2.06513 157.352 1.86C156.676 1.65486 155.986 1.46171 155.302 1.29C154.615 1.11829 153.935 0.967865 153.242 0.83C152.549 0.692135 151.849 0.57369 151.152 0.47C150.452 0.36631 149.746 0.279266 149.042 0.21C148.34 0.140734 147.638 0.0846746 146.932 0.05C146.226 0.0153252 145.518 0 144.812 0ZM144.814 8.636L110.27 8.636C109.705 8.636 109.14 8.64987 108.575 8.6776C108.011 8.70535 107.448 8.74693 106.885 8.80233C106.322 8.85774 105.761 8.92693 105.201 9.0099C104.642 9.09284 104.086 9.18947 103.532 9.29976C102.977 9.41004 102.424 9.53387 101.876 9.67124C101.328 9.80861 100.783 9.95934 100.242 10.1234C99.702 10.2876 99.1659 10.4648 98.6333 10.6553C98.1007 10.8458 97.5732 11.0492 97.0507 11.2655C96.5283 11.4819 96.0116 11.7109 95.5006 11.9526C94.9896 12.1943 94.4851 12.4484 93.9871 12.7149C93.4877 12.9814 92.9954 13.26 92.5104 13.5506C92.0253 13.8413 91.5482 14.1436 91.0789 14.4577C90.6083 14.7718 90.1463 15.0972 89.6929 15.434C89.238 15.7708 88.7926 16.1185 88.3565 16.4771C87.9189 16.8358 87.4907 17.2049 87.0718 17.5846C86.653 17.9642 86.2435 18.354 85.8434 18.7537C85.4447 19.1535 85.0553 19.5628 84.6754 19.9817C84.2954 20.4006 83.9261 20.8285 83.5674 21.2655C83.2088 21.7025 82.8612 22.148 82.5243 22.6021C82.1875 23.0562 81.8621 23.5184 81.548 23.9884C81.234 24.4585 80.9316 24.936 80.6408 25.4209C80.3502 25.9058 80.0717 26.3976 79.8053 26.8962C79.5387 27.3948 79.2846 27.8995 79.043 28.4105C78.8011 28.9216 78.5721 29.4383 78.3557 29.9607C78.1394 30.4829 77.936 31.0101 77.7456 31.5426C77.5552 32.0748 77.3779 32.6115 77.2139 33.1523C77.0496 33.6934 76.8989 34.2381 76.7615 34.7865C76.6242 35.3348 76.5004 35.8862 76.39 36.4409C76.2797 36.9953 76.1831 37.5521 76.1002 38.1113C76.0172 38.6705 75.948 39.2314 75.8926 39.794C75.8371 40.3567 75.7956 40.9204 75.768 41.485C75.7402 42.0495 75.7263 42.6146 75.7263 43.18C75.7263 43.7454 75.7402 44.3104 75.768 44.875C75.7956 45.4396 75.8371 46.0033 75.8926 46.566C75.948 47.1286 76.0172 47.6895 76.1002 48.2487C76.1831 48.8079 76.2797 49.3647 76.39 49.9191C76.5004 50.4737 76.6242 51.0252 76.7615 51.5735C76.8989 52.1219 77.0496 52.6666 77.2136 53.2077C77.3779 53.7485 77.5552 54.2852 77.7456 54.8174C77.936 55.3498 78.1394 55.8771 78.3557 56.3993C78.5721 56.9216 78.8011 57.4385 79.043 57.9495C79.2846 58.4605 79.5387 58.9653 79.8053 59.4638C80.0717 59.9623 80.3502 60.4542 80.6408 60.9391C80.9316 61.424 81.234 61.9016 81.548 62.3716C81.8621 62.8416 82.1875 63.3038 82.5243 63.7579C82.8612 64.2119 83.2088 64.6575 83.5674 65.0945C83.9261 65.5315 84.2954 65.9594 84.6754 66.3782C85.0553 66.7973 85.4447 67.2066 85.8434 67.6063C86.2435 68.0059 86.653 68.3956 87.0718 68.7754C87.4907 69.1551 87.9189 69.5243 88.3565 69.8829C88.7926 70.2416 89.238 70.5891 89.6929 70.926C90.1463 71.2628 90.6083 71.5881 91.0789 71.9023C91.5482 72.2164 92.0253 72.5186 92.5104 72.8095C92.9954 73.1001 93.4877 73.3786 93.9871 73.645C94.4851 73.9116 94.9896 74.1657 95.5006 74.4073C96.0116 74.6492 96.5283 74.8782 97.0507 75.0946C97.5732 75.3109 98.1007 75.5143 98.6333 75.7047C99.1659 75.8951 99.702 76.0724 100.242 76.2365C100.783 76.4007 101.328 76.5514 101.876 76.6888C102.424 76.8261 102.977 76.95 103.532 77.0603C104.086 77.1706 104.642 77.2672 105.201 77.3501C105.761 77.4332 106.322 77.5023 106.885 77.5578C107.448 77.6132 108.011 77.6547 108.575 77.6823C109.14 77.7102 109.705 77.724 110.27 77.724L144.814 77.724C145.38 77.724 145.945 77.7102 146.509 77.6823C147.073 77.6547 147.636 77.6132 148.199 77.5578C148.762 77.5023 149.323 77.4332 149.883 77.3501C150.442 77.2672 150.998 77.1706 151.552 77.0603C152.108 76.95 152.66 76.8261 153.208 76.6888C153.757 76.5514 154.301 76.4007 154.843 76.2365C155.382 76.0724 155.918 75.8951 156.451 75.7047C156.984 75.5143 157.511 75.3109 158.034 75.0946C158.556 74.8782 159.073 74.6492 159.584 74.4073C160.095 74.1657 160.599 73.9116 161.097 73.645C161.596 73.3786 162.088 73.1001 162.574 72.8095C163.059 72.5186 163.536 72.2164 164.005 71.9023C164.476 71.5881 164.938 71.2628 165.391 70.926C165.846 70.5891 166.292 70.2416 166.728 69.8829C167.165 69.5243 167.594 69.1551 168.012 68.7754C168.431 68.3956 168.841 68.0059 169.241 67.6063C169.64 67.2066 170.029 66.7973 170.409 66.3782C170.789 65.9594 171.158 65.5315 171.517 65.0945C171.875 64.6575 172.222 64.2119 172.559 63.7579C172.896 63.3038 173.221 62.8416 173.535 62.3716C173.85 61.9016 174.153 61.424 174.444 60.9391C174.735 60.4542 175.013 59.9623 175.28 59.4638C175.546 58.9653 175.8 58.4605 176.042 57.9495C176.284 57.4385 176.512 56.9216 176.728 56.3993C176.944 55.8771 177.148 55.3498 177.339 54.8174C177.529 54.2852 177.706 53.7485 177.87 53.2077C178.035 52.6666 178.185 52.1219 178.322 51.5735C178.46 51.0252 178.584 50.4737 178.695 49.9191C178.805 49.3647 178.901 48.8079 178.984 48.2487C179.067 47.6895 179.136 47.1286 179.192 46.566C179.246 46.0033 179.288 45.4396 179.317 44.875C179.344 44.3104 179.358 43.7454 179.358 43.18C179.358 42.6146 179.344 42.0495 179.317 41.485C179.288 40.9204 179.246 40.3567 179.192 39.794C179.136 39.2314 179.067 38.6705 178.984 38.1113C178.901 37.5521 178.805 36.9953 178.695 36.4409C178.584 35.8862 178.46 35.3348 178.324 34.7865C178.186 34.2381 178.035 33.6934 177.87 33.1523C177.706 32.6115 177.529 32.0748 177.339 31.5426C177.148 31.0101 176.944 30.4829 176.728 29.9607C176.512 29.4383 176.284 28.9216 176.042 28.4105C175.8 27.8995 175.546 27.3948 175.28 26.8962C175.013 26.3976 174.735 25.9058 174.444 25.4209C174.153 24.936 173.85 24.4585 173.535 23.9884C173.221 23.5184 172.896 23.0562 172.559 22.6021C172.222 22.148 171.875 21.7025 171.517 21.2655C171.158 20.8285 170.789 20.4006 170.409 19.9817C170.029 19.5628 169.64 19.1535 169.241 18.7537C168.841 18.354 168.431 17.9642 168.012 17.5846C167.594 17.2049 167.165 16.8358 166.728 16.4771C166.292 16.1185 165.846 15.7708 165.391 15.434C164.938 15.0972 164.476 14.7718 164.005 14.4577C163.536 14.1436 163.059 13.8413 162.574 13.5506C162.089 13.26 161.597 12.9814 161.097 12.7149C160.599 12.4484 160.095 12.1943 159.584 11.9526C159.073 11.7109 158.556 11.4819 158.034 11.2655C157.511 11.0492 156.984 10.8458 156.451 10.6553C155.918 10.4648 155.382 10.2876 154.843 10.1234C154.301 9.95934 153.757 9.80861 153.208 9.67124C152.66 9.53387 152.108 9.41004 151.552 9.29976C150.998 9.18947 150.442 9.09284 149.883 9.0099C149.323 8.92693 148.762 8.85774 148.199 8.80233C147.636 8.74693 147.073 8.70535 146.509 8.6776C145.945 8.64987 145.38 8.636 144.814 8.636ZM54.1668 59.9869L54.1668 102.017C54.1668 104.217 55.95 106 58.1496 106C60.3492 106 62.1324 104.217 62.1324 102.017L62.1324 59.9869C62.1324 50.7484 54.6431 43.2591 45.4047 43.2591L8.02514 43.2591C5.82552 43.2591 4.04234 45.0423 4.04234 47.2419C4.04234 49.4415 5.82552 51.2247 8.02514 51.2247L45.4047 51.2247C46.34 51.2247 47.2412 51.3713 48.0864 51.6427L1.21472 96.9498C-0.366776 98.4786 -0.409631 101 1.11913 102.582C2.64789 104.163 5.16931 104.206 6.7508 102.677L53.7347 57.2615C54.0151 58.1194 54.1668 59.0355 54.1668 59.9869ZM21.2823 61.64C20.984 61.0093 20.7 60.3693 20.4326 59.7247L27.4951 59.7247L22.6898 64.3697C22.5346 64.091 22.3824 63.8108 22.2323 63.53C21.8992 62.9067 21.5845 62.2788 21.2823 61.64ZM41.8523 82.21C41.4734 82.0309 41.0984 81.8472 40.7259 81.6579L45.6667 76.882L45.6667 83.8056C45.0344 83.5768 44.4139 83.3275 43.7923 83.07C43.1394 82.7995 42.4911 82.512 41.8523 82.21Z',
                    transform: `translate(${String(x)} ${String(y)}) scale(${String(iconScale)})`,
                    'pointer-events': 'none',
                    'aria-hidden': 'true',
                },
                this.block_.getSvgRoot(),
            );
            hint.setAttribute('focusable', 'false');
        }
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
