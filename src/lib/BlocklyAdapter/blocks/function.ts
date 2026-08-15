/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由 AI 修改于 2026/8/10：为行内函数与调用积木加入参数
// 此文件由AI修改于2026/8/15：联合类型直接参与 check 数组，槽位形状由 renderer 统一处理

import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import {
    BlocksColor,
    OPCODES,
    type IFunctionValueBlock,
    type TFunctionReturnField,
} from '../../../types/blocks';
import { connections, endConnections, returnConnections } from './helpers';
import { modal } from '../../../components/Modal/modal';
import { PromptModal } from '../../../components/modal_prompt';
import { createMinusFieldByKey, createPlusField } from './mutation';
import {
    scopedSourceBlock,
    scopedSourceHost,
    type IDynamicScopedHost,
    type IScopedSourceBlock,
} from './scopedSource';
import moveLeftImage from '../../../assets/blocks/moveLeft.svg';
import moveRightImage from '../../../assets/blocks/moveRight.svg';

/** 参数插槽的 input 名前缀，后接稳定 id。 */
const PARAM_INPUT_PREFIX = 'PARAM_';
/**
 * 参数减号按钮的 input 名前缀。
 *
 * 刻意不以 `PARAM_` 开头：否则 `PARAM_REMOVE_x` 会被当成 id 为 `REMOVE_x`
 * 的参数插槽，在清理阶段被误删。
 */
const PARAM_REMOVE_PREFIX = 'MINUS_';
/** 调用积木上实参插槽的 input 名前缀。 */
const ARG_INPUT_PREFIX = 'ARG_';
/** 实参减号按钮的 input 名前缀；同样刻意不以 `ARG_` 开头。 */
const ARG_REMOVE_PREFIX = 'ARGMINUS_';

/**
 * 从 input 名解析出它属于哪个参数；与参数无关的 input 返回 null。
 */
function paramIdOfInput(name: string): string | null {
    if (name.startsWith(PARAM_INPUT_PREFIX)) return name.slice(PARAM_INPUT_PREFIX.length);
    if (name.startsWith(PARAM_REMOVE_PREFIX)) return name.slice(PARAM_REMOVE_PREFIX.length);
    return null;
}

/**
 * 从 input 名解析出它属于哪个实参；与实参无关的 input 返回 null。
 */
function argIdOfInput(name: string): string | null {
    if (name.startsWith(ARG_INPUT_PREFIX)) return name.slice(ARG_INPUT_PREFIX.length);
    if (name.startsWith(ARG_REMOVE_PREFIX)) return name.slice(ARG_REMOVE_PREFIX.length);
    return null;
}

/** 一个参数的声明。 */
interface IFunctionParam {
    /**
     * 稳定标识。
     *
     * 不能用下标：删掉中间的参数后，后续参数的下标会左移，
     * 已经拖到函数体各处的参数积木就会认错亲。
     */
    id: string;
    /** 显示名，可由用户改。 */
    name: string;
}

/** 行内函数积木。 */
interface IFunctionInlineBlock extends IDynamicScopedHost {
    params: IFunctionParam[];
    plus(): void;
    minusByKey(key: string): void;
}

/** 调用积木上缓存的实参信息。 */
interface ICallArg {
    id: string;
    name: string;
}

/** 调用/执行积木共用的形状同步能力。 */
interface IFunctionCallerBlock extends Blockly.Block {
    args: ICallArg[];
    /**
     * true = 插槽跟随接入的行内函数自动生成；
     * false = 用户已手动增删，插槽由用户掌控。
     */
    autoSync: boolean;
    /** 读取 FUNCTION 插槽里接的行内函数，同步实参插槽。 */
    syncArgs(): void;
    plus(): void;
    minusByKey(key: string): void;
    updateShape(): void;
    onchange(event: Blockly.Events.Abstract): void;
}

/** 调用方需要重新读取行内函数参数表的事件。 */
const CALLER_RESYNC_EVENTS: readonly string[] = [
    Blockly.Events.BLOCK_MOVE,
    Blockly.Events.BLOCK_CHANGE,
    Blockly.Events.FINISHED_LOADING,
];

/** 生成参数的稳定 id。 */
const spawnParamId = (): string => crypto.randomUUID().slice(0, 8);

/** 参数默认名：a、b、c…… 用完回退到 p9、p10。 */
const defaultParamName = (index: number): string =>
    index < 26 ? String.fromCharCode(97 + index) : `p${index.toString()}`;

/**
 * 从一个积木出发，找到它接入的行内函数并读出参数表。
 * 没接或接的不是行内函数时返回空数组。
 */
function readParamsFromFunctionInput(block: Blockly.Block): IFunctionParam[] {
    const target = block.getInput('FUNCTION')?.connection?.targetBlock();
    if (target?.type !== OPCODES.FUNCTION_INLINE) return [];

    const host = target as IFunctionInlineBlock;
    // params[].name 只是创建时的默认名（a、b、c……），改名写的是 scopedNames，
    // 所以显示名必须走 getScopedName，否则调用积木永远显示旧名。
    return host.params.map(param => ({
        id: param.id,
        name: host.getScopedName(param.id),
    }));
}

/**
 * 实参提示文字的样式：半透明，视觉上像输入框的 placeholder 而非真实取值。
 */
Blockly.Css.register(`
.ashArgHint {
    fill-opacity: 0.5;
}
`);

/**
 * 注册函数类积木
 */
export function initFunctionBlocks(blockly: typeof Blockly) {
    blockly.Blocks[OPCODES.FUNCTION_DEFINITION] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:function.definition'),
                message1: '%1',
                colour: BlocksColor.function.primary,
                args0: [{ type: 'input_value', name: 'NAME', check: 'String' }],
                args1: [{ type: 'input_statement', name: 'DO', check: 'Action' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.FUNCTION_RETURN] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...endConnections,
                message0: t('blocks:function.return'),
                colour: BlocksColor.function.primary,
                args0: [{ type: 'input_value', name: 'VALUE' }],
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.FUNCTION_SETDATAVALUE] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                ...connections,
                message0: t('blocks:function.setDataValue'),
                colour: BlocksColor.function.primary,
                args0: [
                    { type: 'input_value', name: 'NAME', check: 'String' },
                    { type: 'input_value', name: 'VALUE' },
                ],
            });
        },
    } as Blockly.Block;

    /**
     * zelos 会把只有一个文本输入框的积木渲染为整个只有文本输入框
     * 说白了，这会导致积木变成白色，所以禁用了它
     */
    // @ts-expect-error 扩展它是有必要的
    class FunctionValueTextField extends Blockly.FieldTextInput {
        override isFullBlockField(): boolean {
            return false;
        }

        protected override initView() {
            super.initView();
            const root = this.getSvgRoot();
            if (root) Blockly.utils.dom.addClass(root, 'ashFunctionValueText');
        }
    }

    // 此函数由AI生成
    /**
     * 创建函数编辑模式下的左右移动按钮。
     *
     * 点击后把 previewData 里第 index 项与相邻项交换并重建形状。
     * 与 mutation.ts 的按钮同机制：FieldImage 回调发生在 pointerup 手势中，
     * 结构更新放到微任务里执行。
     */
    function createMoveField(direction: 'left' | 'right', index: number): Blockly.FieldImage {
        const image = direction === 'left' ? moveLeftImage : moveRightImage;
        return new Blockly.FieldImage(image, 15, 15, undefined, field => {
            const block = field.getSourceBlock() as IFunctionValueBlock | null;
            if (!block || block.isInFlyout) return;

            queueMicrotask(() => {
                if (block.isDeadOrDying()) return;
                block.moveField(index, direction === 'left' ? -1 : 1);
            });
        });
    }

    /** 值槽位的影子块：只有一个文字输入框（输入参数 id）。 */
    blockly.Blocks[OPCODES.FUNCTION_VALUE_ID] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [{ type: 'field_input', name: 'ID', spellcheck: false }],
                output: null,
                colour: BlocksColor.textField,
            });
        },
    } as Blockly.Block;

    blockly.Blocks[OPCODES.FUNCTION_VALUE] = {
        init(this: IFunctionValueBlock) {
            this.editMode = false;
            this.jsonInit({
                ...returnConnections,
                colour: BlocksColor.function.primary,
                output: 'Function',
            });
        },
        moveField(this: IFunctionValueBlock, index: number, delta: number) {
            const target = index + delta;
            if (target < 0 || target >= this.previewData.length) return;

            // 原地交换：外部（创建弹窗）可能持有同一数组引用，换新数组会断开同步。
            const next = [...this.previewData];
            [next[index], next[target]] = [next[target], next[index]];
            this.previewData.splice(0, this.previewData.length, ...next);
            this.updateShape();
        },
        updateShape() {
            for (const input of [...this.inputList]) {
                this.removeInput(input.name, true);
            }

            this.previewData.forEach((fieldData, index) => {
                if (this.editMode) {
                    this.appendDummyInput(`BTN_MOVE_LEFT_${String(index)}`).appendField(
                        createMoveField('left', index),
                    );
                }

                const inputID = `ARG${String(index)}`;
                if (fieldData.type === 'text') {
                    const textInput = new FunctionValueTextField(
                        fieldData.text ?? '',
                        value => {
                            fieldData.text = value;
                            return value;
                        },
                        {
                            spellcheck: false,
                        },
                    );
                    this.appendDummyInput(inputID).appendField(textInput, `TEXT_${String(index)}`);
                } else {
                    const input = this.appendValueInput(inputID);
                    const checks = (Array.isArray(fieldData.type)
                        ? fieldData.type
                        : [fieldData.type]).map(type => {
                            if(type) return type
                                .split('')
                                .map((char, index) => (index ? char : char.toUpperCase()))
                                .join('');
                            return 'String';
                        });

                    if (checks.length > 0) input.setCheck(checks);
                    input.connection?.setShadowState({
                        type: OPCODES.FUNCTION_VALUE_ID,
                        fields: { ID: fieldData.text ?? '' },
                    });
                    const shadowText = input.connection
                        ?.targetBlock()
                        ?.getField('ID') as Blockly.FieldTextInput | null;
                    shadowText?.setValidator((value: string) => {
                        fieldData.text = value;
                        return value;
                    });
                }

                if (this.editMode) {
                    this.appendDummyInput(`BTN_MOVE_RIGHT_${String(index)}`).appendField(
                        createMoveField('right', index),
                    );
                }
            });
        },
    } as IFunctionValueBlock;

    // ── 行内函数 ──────────────────────────────────────────────
    // 形如 `行内函数 (a)⊖ (b)⊖ ⊕ { ... }`，
    // 括号里是可以拖出去反复使用的参数积木。

    blockly.Blocks[OPCODES.FUNCTION_INLINE] = {
        ...scopedSourceHost({
            sourceType: OPCODES.FUNCTION_PARAM,
            slots: host =>
                (host as IFunctionInlineBlock).params.map(param => ({
                    inputName: `${PARAM_INPUT_PREFIX}${param.id}`,
                    key: param.id,
                    defaultName: param.name,
                })),
        }),

        init(this: IFunctionInlineBlock) {
            this.params = [];
            this.setColour(BlocksColor.function.primary);
            this.setOutput(true, 'Function');
            this.setInputsInline(true);
            this.updateShape();
            this.initScopedHost();
        },

        plus(this: IFunctionInlineBlock) {
            const param: IFunctionParam = {
                id: spawnParamId(),
                name: defaultParamName(this.params.length),
            };
            this.params = [...this.params, param];
            this.updateShape();
            this.ensureScopedBlocks();
        },

        minusByKey(this: IFunctionInlineBlock, key: string) {
            if (!this.params.some(param => param.id === key)) return;

            // 先销毁散落在函数体里的引用，再拆插槽。
            this.discardScopedSlot(key);
            this.params = this.params.filter(param => param.id !== key);
            this.updateShape();
        },

        /**
         * 幂等地把形状对齐到 params，只增删差异部分。
         *
         * 三条不能违反的约束：
         * 1. 不重建 DO。removeInput 会把函数体里的积木 unplug 成游离积木。
         * 2. 不重建参数插槽。参数积木一游离就会触发 BLOCK_MOVE →
         *    ensureScopedBlocks → 再补一个新的，造成重复参数。
         * 3. 每个 input 都单独判断存在性，任何一次中途失败都能靠下次调用自愈。
         */
        updateShape(this: IFunctionInlineBlock) {
            const wanted = new Set(this.params.map(param => param.id));

            for (const input of [...this.inputList]) {
                const id = paramIdOfInput(input.name);
                if (id !== null && !wanted.has(id)) this.removeInput(input.name, true);
            }

            if (!this.getInput('LABEL')) {
                this.appendDummyInput('LABEL').appendField(t('blocks:function.inline'));
            }

            for (const param of this.params) {
                const inputName = `${PARAM_INPUT_PREFIX}${param.id}`;
                const removeName = `${PARAM_REMOVE_PREFIX}${param.id}`;
                if (!this.getInput(inputName)) this.appendValueInput(inputName);
                if (!this.getInput(removeName)) {
                    this.appendDummyInput(removeName).appendField(
                        createMinusFieldByKey({ removeKey: param.id }),
                    );
                }
            }

            if (!this.getInput('ADD')) {
                this.appendDummyInput('ADD').appendField(createPlusField());
            }
            if (!this.getInput('DO')) this.appendStatementInput('DO').setCheck('Action');

            // 按目标顺序逐个移到末尾，走完一轮顺序就对了。
            const order = ['LABEL'];
            for (const param of this.params) {
                order.push(`${PARAM_INPUT_PREFIX}${param.id}`, `${PARAM_REMOVE_PREFIX}${param.id}`);
            }
            order.push('ADD', 'DO');
            for (const name of order) this.moveInputBefore(name, null);
        },

        saveExtraState(this: IFunctionInlineBlock) {
            return {
                params: this.params.map(param => ({
                    ...param,
                    // 名字以 scopedNames 为准（改名走的是那条路）。
                    name: this.getScopedName(param.id),
                })),
            };
        },

        loadExtraState(this: IFunctionInlineBlock, state: { params?: IFunctionParam[] }) {
            this.params = (state.params ?? []).map(param => ({ ...param }));
            this.scopedNames = Object.fromEntries(this.params.map(param => [param.id, param.name]));
            this.updateShape();
            this.updateScopedLabels();
        },
    };

    // 参数积木：可以从行内函数头部拖出来，在函数体内反复使用。
    // output 为 null（万能），因此能插进任何插槽，包括「执行函数」。
    blockly.Blocks[OPCODES.FUNCTION_PARAM] = scopedSourceBlock({
        colour: BlocksColor.function.secondary,
        defaultLabel: () => t('blocks:function.param'),
        hostTypes: [OPCODES.FUNCTION_INLINE],
        openRenamePrompt: ({ currentName, commit }) => {
            void modal.open(PromptModal, {
                message: t('blocks:rename.functionParam.prompt', { message: currentName }),
                defaultValue: currentName,
                callback: commit,
            });
        },
    }) as IScopedSourceBlock;

    const callerMixin = () => ({
        syncArgs(this: IFunctionCallerBlock) {
            if (this.isDeadOrDying() || this.isInsertionMarker()) return;

            const target = this.getInput('FUNCTION')?.connection?.targetBlock();
            const isInline = target?.type === OPCODES.FUNCTION_INLINE;

            if (!isInline) {
                // 摘下行内函数：保留现有插槽（里面的实参不丢），把控制权交还用户。
                if (this.autoSync) {
                    this.autoSync = false;
                    this.updateShape();
                }
                return;
            }

            const params = readParamsFromFunctionInput(this);
            const unchanged =
                this.autoSync &&
                params.length === this.args.length &&
                params.every(
                    (param, i) => param.id === this.args[i].id && param.name === this.args[i].name,
                );
            if (unchanged) return;

            this.autoSync = true;
            this.args = params;
            this.updateShape();
        },

        onchange(this: IFunctionCallerBlock, event: Blockly.Events.Abstract) {
            if (CALLER_RESYNC_EVENTS.includes(event.type)) this.syncArgs();
        },

        // ⊕/⊖ 只在手动模式下渲染，因此这里无需再判断模式。
        plus(this: IFunctionCallerBlock) {
            this.args = [
                ...this.args,
                { id: spawnParamId(), name: defaultParamName(this.args.length) },
            ];
            this.updateShape();
        },

        minusByKey(this: IFunctionCallerBlock, key: string) {
            if (!this.args.some(arg => arg.id === key)) return;
            this.args = this.args.filter(arg => arg.id !== key);
            this.updateShape();
        },

        updateShape(this: IFunctionCallerBlock) {
            const wanted = new Set(this.args.map(arg => arg.id));

            for (const input of [...this.inputList]) {
                const id = argIdOfInput(input.name);
                if (id !== null && !wanted.has(id)) this.removeInput(input.name, true);
            }

            const order: string[] = [];
            for (const arg of this.args) {
                order.push(`${ARG_INPUT_PREFIX}${arg.id}`);
                if (!this.autoSync) order.push(`${ARG_REMOVE_PREFIX}${arg.id}`);
            }
            if (this.autoSync) this.removeInput('ADD', true);
            else if (!this.getInput('ADD')) {
                this.appendDummyInput('ADD').appendField(createPlusField());
            }
            if (!this.autoSync) order.push('ADD');
            if (this.args.length > 0) {
                this.removeInput('ENDROW', true);
                this.appendEndRowInput('ENDROW');
                order.push('ENDROW');
            } else {
                this.removeInput('ENDROW', true);
            }
            order.push('FUNCTION');

            for (const arg of this.args) {
                const inputName = `${ARG_INPUT_PREFIX}${arg.id}`;
                if (!this.getInput(inputName)) {
                    this.appendValueInput(inputName);
                }
                // 参数名以半透明提示的形式显示在空槽里（类似输入框 placeholder），
                // 插入真实积木后自动被盖住，拖走又会重新露出来。
                const connection = this.getInput(inputName)?.connection;
                const hint = connection?.getShadowState() as
                    { fields?: { HINT?: string } } | undefined;
                // 名字没变就别重设，setShadowState 会产生一串多余的变更事件。
                if (hint?.fields?.HINT !== arg.name) {
                    connection?.setShadowState({
                        type: OPCODES.FUNCTION_ARG_HINT,
                        fields: { HINT: arg.name },
                    });
                }

                // 自动模式由行内函数决定参数个数，不给 ⊖，避免和上游打架。
                const removeName = `${ARG_REMOVE_PREFIX}${arg.id}`;
                if (this.autoSync) this.removeInput(removeName, true);
                else if (!this.getInput(removeName)) {
                    this.appendDummyInput(removeName).appendField(
                        createMinusFieldByKey({ removeKey: arg.id }),
                    );
                }
            }
            for (const name of order) this.moveInputBefore(name, null);
        },

        saveExtraState(this: IFunctionCallerBlock) {
            return { args: this.args, autoSync: this.autoSync };
        },

        loadExtraState(
            this: IFunctionCallerBlock,
            state: { args?: ICallArg[]; autoSync?: boolean },
        ) {
            // 读档顺序是「建积木 → loadExtraState → 接子积木」，
            // 此刻还读不到行内函数，必须靠快照先把插槽建出来，
            // 否则用户填的实参会因为没有落脚点而丢失。
            this.args = state.args ?? [];
            this.autoSync = state.autoSync ?? true;
            this.updateShape();
        },
    });

    blockly.Blocks[OPCODES.FUNCTION_CALL] = {
        ...callerMixin(),
        init(this: IFunctionCallerBlock) {
            this.args = [];
            this.autoSync = true;
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:function.call'),
                message1: '%1',
                colour: BlocksColor.function.primary,
                output: null,
                args1: [{ type: 'input_value', name: 'FUNCTION', check: 'Function' }],
            });
            this.updateShape();
        },
    };

    blockly.Blocks[OPCODES.FUNCTION_EXECUTE] = {
        ...callerMixin(),
        init(this: IFunctionCallerBlock) {
            this.args = [];
            this.autoSync = true;
            this.jsonInit({
                ...connections,
                message0: t('blocks:function.execute'),
                message1: '%1',
                colour: BlocksColor.function.secondary,
                args1: [{ type: 'input_value', name: 'FUNCTION', check: 'Function' }],
            });
            this.updateShape();
        },
    };

    // 实参提示积木：空槽里的半透明参数名，作为 shadow 存在。
    // 用户拖真值进来它自动隐藏，拖走又会回来 —— 与 Scratch 默认值同机制。
    // 编译时「槽里还是 hint」即代表该实参未传（对应 JS 的 undefined）。
    blockly.Blocks[OPCODES.FUNCTION_ARG_HINT] = {
        init(this: Blockly.Block) {
            this.jsonInit({
                message0: '%1',
                args0: [
                    {
                        // 必须用可序列化的 label：普通 field_label 不参与序列化，
                        // setShadowState 里传的 fields 会被直接忽略，提示就成了空白。
                        type: 'field_label_serializable',
                        name: 'HINT',
                        text: '',
                        class: 'ashArgHint',
                    },
                ],
                output: null,
                colour: BlocksColor.function.primary,
            });
        },
    } as Blockly.Block;
}
