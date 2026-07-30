import * as Blockly from 'blockly/core';

const ARRAY_SHAPE_TYPE = 6;
const OBJECT_SHAPE_TYPE = 7;
const MATCH_NOTCH_TYPE = 8;
const FUNCTION_SHAPE_TYPE = 9;
const MATCH_BRANCH_CHECK = 'MatchBranch';

class AstratchConstantProvider extends Blockly.zelos.ConstantProvider {
    arrayShape: Blockly.blockRendering.DynamicShape | null = null;
    objectShape: Blockly.blockRendering.DynamicShape | null = null;
    functionShape: Blockly.blockRendering.DynamicShape | null = null;
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
        ];
        const customValueShapeTypes = [ARRAY_SHAPE_TYPE, OBJECT_SHAPE_TYPE, FUNCTION_SHAPE_TYPE];
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

    private makeFunctionShape(): Blockly.blockRendering.DynamicShape {
        const maxRadius = 6 * this.GRID_UNIT;

        const makePath = (height: number, up: boolean, right: boolean) => {
            const radius = Math.min(height / 2, maxRadius);
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
            width: height => Math.min(height / 2, maxRadius),
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
}

export function registerAstratchRenderer() {
    if (Blockly.registry.hasItem(Blockly.registry.Type.RENDERER, 'astratch')) return;
    Blockly.blockRendering.register('astratch', AstratchRenderer);
}
