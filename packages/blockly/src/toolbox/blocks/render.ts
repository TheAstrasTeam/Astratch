/**
 * 呈现（运动 / 方向 / 显示 / 文字）的基础积木定义。
 *
 * 只做静态基础定义：不加图标，不做 `+()` 变异器。
 *
 * @author AI
 */
import { t } from 'astratch-i18n';

import { TOOLBOX_COLOR } from '../color';
import {
    BlockIcon,
    TYPES,
    arrayInput,
    connections,
    dropdown,
    numberInput,
    objectInput,
    returnConnections,
    stringInput,
} from '../helps';
import { OPCODES } from '../opcodes';
import { Blockly, blocklyAdapter } from '../..';

import SwitchToArray from './assets/switchToArray.svg';
import SwitchToNumber from './assets/switchToNumber.svg';
import TurnRight from './assets/turnRight.svg';
import TurnLeft from './assets/turnLeft.svg';
import X from './assets/x.svg';
import Y from './assets/y.svg';

const EFFECT_OPTIONS = [
    [t('blocks:option.effect.color'), 'color'],
    [t('blocks:option.effect.whirl'), 'whirl'],
    [t('blocks:option.effect.fisheye'), 'fisheye'],
    [t('blocks:option.effect.pixelate'), 'pixelate'],
    [t('blocks:option.effect.mosaic'), 'mosaic'],
    [t('blocks:option.effect.ghost'), 'ghost'],
    [t('blocks:option.effect.blur'), 'blur'],
];

const BLEND_OPTIONS = [
    [t('blocks:option.blend.default'), 'default'],
    [t('blocks:option.blend.dissolve'), 'dissolve'],
    [t('blocks:option.blend.darken'), 'darken'],
    [t('blocks:option.blend.lighten'), 'lighten'],
    [t('blocks:option.blend.screen'), 'screen'],
    [t('blocks:option.blend.multiply'), 'multiply'],
    [t('blocks:option.blend.colorBurn'), 'colorBurn'],
    [t('blocks:option.blend.colorDodge'), 'colorDodge'],
    [t('blocks:option.blend.overlay'), 'overlay'],
    [t('blocks:option.blend.difference'), 'difference'],
    [t('blocks:option.blend.pinLight'), 'pinLight'],
    [t('blocks:option.blend.softLight'), 'softLight'],
    [t('blocks:option.blend.hardLight'), 'hardLight'],
];

const LAYER_OPTIONS = [
    [t('blocks:option.layer.up'), 'up'],
    [t('blocks:option.layer.down'), 'down'],
];

const TEXT_METRIC_OPTIONS = [
    [t('blocks:option.textMetric.borderWidth'), 'borderWidth'],
    [t('blocks:option.textMetric.pixelLength'), 'pixelLength'],
];

const TEXT_COLOR_OPTIONS = [
    [t('blocks:option.textColor.color'), 'color'],
    [t('blocks:option.textColor.borderColor'), 'borderColor'],
];

export const initRenderBlocks = () => {
    blocklyAdapter.Blockly.Blocks[OPCODES.entitiesMenu] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: '%1',
                args0: [dropdown('TARGET', [['', '']])],
                colour: TOOLBOX_COLOR.render,
                output: 'String',
            });
            blocklyAdapter.emit(this, 'GET_MENU', {
                type: 'entities',
                handler: (data: [string, string][]) => {
                    const field = this.getField('TARGET') as Blockly.FieldDropdown;
                    field.setOptions(data);
                },
            });
            queueMicrotask(() => {
                if (!this.isShadow()) return;
                const parent = this.getParent();
                if (!parent) return;
                if (!parent.rendered) return;
                const parentBlockSvg = parent as Blockly.BlockSvg;

                this.setColour(parentBlockSvg.getColourSecondary());
            });
        },
    } as Blockly.Block;

    // 运动
    blocklyAdapter.Blockly.Blocks[OPCODES.forward] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:motion.forward'),
                args0: [numberInput('STEPS')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.moveTo] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:motion.moveTo'),
                args0: [stringInput('TARGET')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.setX] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:motion.setX'),
                args0: [numberInput('X')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.setY] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:motion.setY'),
                args0: [numberInput('Y')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.changeX] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:motion.changeX'),
                args0: [numberInput('X')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.changeY] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:motion.changeY'),
                args0: [numberInput('Y')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.setXY] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:motion.setXY'),
                args0: [arrayInput('XY')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    const xyBlock = (isSet: boolean) =>
        ({
            init() {
                this.jsonInit({
                    ...connections,
                    colour: TOOLBOX_COLOR.render,
                });
                this.isArrayInput = false;
                this.isInit = false;
                this.xNumber = 0;
                this.yNumber = 0;
                this.updateShape();
            },
            updateShape() {
                if (this.isArrayInput) {
                    // 2个数字 -> 1个数组
                    // 如果并不存在 moveText_number 文本，证明这个输入框刚刚其实不是两个数字
                    if (!this.getInput('moveText_number') && this.isInit) return;
                    [
                        'moveText_number',
                        'moveSwitcher',
                        'moveX_Icon',
                        'moveValue_x',
                        'moveY_Icon',
                        'moveValue_y',
                    ].forEach(inputID => {
                        this.removeInput(inputID, true);
                    });
                    this.appendDummyInput('moveText_array').appendField(
                        t(isSet ? 'blocks:motion.setXY' : 'blocks:motion.changeXY'),
                    );
                    this.appendDummyInput('moveSwitcher').appendField(
                        new Blockly.FieldImage(SwitchToNumber, 24, 24, undefined, () => {
                            this.isArrayInput = false;
                            this.updateShape();
                        }),
                    );
                    this.appendValueInput('moveValue_array').setCheck('Array');
                    this.isInit = true;
                    return;
                }
                // 1个数组 -> 2个数字
                if (!this.getInput('moveText_array') && this.isInit) return;
                ['moveText_array', 'moveSwitcher', 'moveValue_array'].forEach(inputID => {
                    this.removeInput(inputID, true);
                });
                this.appendDummyInput('moveText_number').appendField(
                    t(isSet ? 'blocks:motion.setXY' : 'blocks:motion.changeXY'),
                );
                this.appendDummyInput('moveSwitcher').appendField(
                    new Blockly.FieldImage(SwitchToArray, 24, 24, undefined, () => {
                        this.isArrayInput = true;
                        this.updateShape();
                    }),
                );
                this.appendDummyInput('moveX_Icon').appendField(new Blockly.FieldImage(X, 25, 25));
                this.appendValueInput('moveValue_x')
                    .setCheck('Number')
                    .connection?.setShadowState({
                        type: OPCODES.number,
                        fields: {
                            NUM: this.xNumber,
                        },
                    });
                this.appendDummyInput('moveY_Icon').appendField(new Blockly.FieldImage(Y, 25, 25));
                this.appendValueInput('moveValue_y')
                    .setCheck('Number')
                    .connection?.setShadowState({
                        type: OPCODES.number,
                        fields: {
                            NUM: this.yNumber,
                        },
                    });
                this.isInit = true;
            },
            saveExtraState() {
                return {
                    isArrayInput: this.isArrayInput,
                    xNumber: this.xNumber,
                    yNumber: this.yNumber,
                };
            },
            loadExtraState(state: { isArrayInput: boolean; xNumber: number; yNumber: number }) {
                this.isArrayInput = state.isArrayInput;
                this.xNumber = state.xNumber;
                this.yNumber = state.yNumber;
                this.updateShape();
            },
            onchange(event) {
                if (this.isArrayInput) return;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                if (event.type !== Blockly.Events.BLOCK_CHANGE) return;
                const changedEvent = event as unknown as Blockly.Events.BlockChange;
                if (changedEvent.element !== 'field') return;
                const xInput = this.getInput('moveValue_x')?.connection?.getShadowState();
                const yInput = this.getInput('moveValue_y')?.connection?.getShadowState();
                if (!xInput || !yInput) return;
                if (changedEvent.blockId === xInput.id)
                    this.xNumber = changedEvent.newValue as number;
                if (changedEvent.blockId === yInput.id)
                    this.yNumber = changedEvent.newValue as number;
            },
        }) as Blockly.Block & {
            isArrayInput: boolean;
            isInit: boolean;
            xNumber: number;
            yNumber: number;
            updateShape(): void;
        };

    blocklyAdapter.Blockly.Blocks[OPCODES.setXY] = xyBlock(true);
    blocklyAdapter.Blockly.Blocks[OPCODES.changeXY] = xyBlock(false);

    // 方向
    blocklyAdapter.Blockly.Blocks[OPCODES.turnLeft] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:motion.turnLeft'),
                args0: [numberInput('DEGREES')],
                colour: TOOLBOX_COLOR.render,
            });
            this.addIcon(new BlockIcon(this, TurnLeft));
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.turnRight] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:motion.turnRight'),
                args0: [numberInput('DEGREES')],
                colour: TOOLBOX_COLOR.render,
            });
            this.addIcon(new BlockIcon(this, TurnRight));
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.setHeading] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:motion.setHeading'),
                args0: [numberInput('DEGREES')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.faceTo] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:motion.faceTo'),
                args0: [stringInput('TARGET')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.heading] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:motion.heading'),
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    // 显示 - 大小
    blocklyAdapter.Blockly.Blocks[OPCODES.setSize] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:display.setSize'),
                args0: [numberInput('SIZE')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.changeSize] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:display.changeSize'),
                args0: [numberInput('SIZE')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.size] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:display.size'),
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    // 显示 - 可见性
    blocklyAdapter.Blockly.Blocks[OPCODES.show] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:display.show'),
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.hide] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:display.hide'),
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.visible] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:display.visible'),
                output: TYPES.BOOLEAN,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    // 显示 - 造型
    blocklyAdapter.Blockly.Blocks[OPCODES.switchCostume] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:display.switchCostume'),
                args0: [objectInput('COSTUME')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.costume] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:display.costume'),
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    // 显示 - 特效
    blocklyAdapter.Blockly.Blocks[OPCODES.changeEffect] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:display.changeEffect'),
                args0: [dropdown('EFFECT', EFFECT_OPTIONS), numberInput('VALUE')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.setEffect] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:display.setEffect'),
                args0: [dropdown('EFFECT', EFFECT_OPTIONS), numberInput('VALUE')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.effect] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:display.effect'),
                args0: [dropdown('EFFECT', EFFECT_OPTIONS)],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    // 显示 - 混合方式
    blocklyAdapter.Blockly.Blocks[OPCODES.setBlendMode] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:display.setBlendMode'),
                args0: [dropdown('BLEND', BLEND_OPTIONS)],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.blendMode] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:display.blendMode'),
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    // 显示 - 裁剪
    blocklyAdapter.Blockly.Blocks[OPCODES.setClip] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:display.setClip'),
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.resetClip] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:display.resetClip'),
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.clip] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:display.clip'),
                output: TYPES.ARRAY,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    // 显示 - 层级
    blocklyAdapter.Blockly.Blocks[OPCODES.changeLayer] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:display.changeLayer'),
                args0: [dropdown('DIRECTION', LAYER_OPTIONS), numberInput('COUNT')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.setLayer] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:display.setLayer'),
                args0: [numberInput('LAYER')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.layer] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:display.layer'),
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    // 文字
    blocklyAdapter.Blockly.Blocks[OPCODES.showText] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:text.show'),
                args0: [stringInput('TEXT')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.setFont] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:text.setFont'),
                args0: [objectInput('ASSET')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.setTextColor] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:text.setTextColor'),
                args0: [stringInput('COLOR')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.setTextBorderColor] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:text.setTextBorderColor'),
                args0: [stringInput('COLOR')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.setTextBorderWidth] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:text.setTextBorderWidth'),
                args0: [numberInput('WIDTH')],
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.textMetric] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:text.metric'),
                args0: [dropdown('METRIC', TEXT_METRIC_OPTIONS)],
                output: TYPES.NUMBER,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.textColor] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:text.color'),
                args0: [dropdown('COLOR', TEXT_COLOR_OPTIONS)],
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.stopText] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:text.stop'),
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.textShowing] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:text.showing'),
                output: TYPES.BOOLEAN,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.textFont] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:text.font'),
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.textContent] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:text.content'),
                output: TYPES.STRING,
                colour: TOOLBOX_COLOR.render,
            });
        },
    } as Blockly.Block;
};
