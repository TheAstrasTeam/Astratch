/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由 AI 修改于 2026/8/10：为行内函数与调用积木加入参数
// 此文件由AI修改于2026/8/15：联合类型直接参与 check 数组，槽位形状由 renderer 统一处理

import * as Blockly from 'blockly/core';
import type { AshConnection } from '../connectionRules';
import { t } from 'i18next';
import { AllCheckers, BlocksColor, OPCODES } from '../../../types/vm/blocks';
import type { ICustomFunction, IFunctionReference } from '../../../types/vm/blocks';
import type { IVM } from '../../../types/vm/vm';
import type {
    IFunctionDropdownField,
    IFunctionValueBlock,
    TFunctionInputField,
    TFunctionReturnType,
    TFunctionTypeUnion,
    TPreviewFunctionData,
} from '../../../components/modal_createFunction/functionPreview';
import {
    createDropdownField,
    isDropdownField,
    normalizedDropdownOptions,
    selectedDropdownValue,
} from '../../../components/modal_createFunction/functionPreview';
import { CreateDropdownModal } from '../../../components/modal_createDropdown';
import { connections, endConnections, hatConnections, returnConnections } from './helpers';
import { createMinusWithSettingsField, createPlusField } from './mutation';
import {
    scopedSourceBlock,
    scopedSourceHost,
    type IDynamicScopedHost,
    type IScopedSlot,
    type IScopedSourceHost,
    type IScopedSourceBlock,
} from './scopedSource';
import moveLeftIcon from '../../../assets/blocks/moveLeft.svg';
import moveRightIcon from '../../../assets/blocks/moveRight.svg';
import removeIcon from '../../../assets/remove.svg';
import settingsIcon from '../../../assets/settingsFunction.svg';
import { FieldTypeModal } from '../../../components/modal_createFunction/modal_fieldType';
import { isModalOpen, modal } from '../../../components/Modal/modal';
import { PromptModal } from '../../../components/modal_prompt';

const CONTROL_BAR_BUTTON_SIZE = 20;
const CONTROL_BAR_GAP = 10;
const CONTROL_BAR_WIDTH = CONTROL_BAR_BUTTON_SIZE * 3 + CONTROL_BAR_GAP * 2;
const CONTROL_BAR_CONFIG_WIDTH = CONTROL_BAR_BUTTON_SIZE * 4 + CONTROL_BAR_GAP * 3;
const CONTROL_BAR_HEIGHT = CONTROL_BAR_BUTTON_SIZE;

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

// 此函数由AI生成
/** 参数类型 → Blockly check：null（未知）即万能，联合直接透传。 */
const paramTypeToChecks = (
    type: TFunctionInputField | TFunctionTypeUnion,
): string | string[] | null => (type === null ? null : Array.isArray(type) ? [...type] : [type]);

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
    /** 参数类型；null（ANY）表示未知万能。 */
    type: TFunctionInputField | TFunctionTypeUnion;
    dropdown?: IFunctionDropdownField;
}

/** 行内函数积木。 */
interface IFunctionInlineBlock extends IDynamicScopedHost {
    params: IFunctionParam[];
    /** 行内函数的返回类型；null（ANY）表示未知。 */
    returnType: TFunctionReturnType;
    plus(): void;
    minusByKey(key: string): void;
    /** 弹出参数类型选择 Modal（复用创建函数的输入类型 Modal）。 */
    openParamSettings(key: string): void;
    /** 把参数槽与参数积木输出一起幂等对齐到参数类型。 */
    alignParamSlot(inputName: string, param: IFunctionParam): void;
}

/** 调用积木上缓存的实参信息。 */
interface ICallArg {
    id: string;
    name: string;
    /** 实参槽类型；null（ANY）表示未知万能。 */
    type: TFunctionInputField | TFunctionTypeUnion;
    dropdown?: IFunctionDropdownField;
}

/** 调用/执行积木共用的形状同步能力。 */
interface IFunctionCallerBlock extends Blockly.Block {
    args: ICallArg[];
    /**
     * true = 插槽跟随接入的行内函数自动生成；
     * false = 用户已手动增删，插槽由用户掌控。
     */
    autoSync: boolean;
    /** 读取 FUNCTION 插槽里接的函数，同步实参插槽。 */
    syncArgs(): void;
    /** 弹出实参类型选择 Modal（仅手动模式，齿轮随 autoSync 隐藏）。 */
    openArgSettings(key: string): void;
    saveExtraState(): unknown;
    plus(): void;
    minusByKey(key: string): void;
    updateShape(): void;
    onchange(event: Blockly.Events.Abstract): void;
}

/** 调用方需要重新读取函数参数表的事件。 */
const CALLER_RESYNC_EVENTS: readonly string[] = [
    Blockly.Events.BLOCK_MOVE,
    Blockly.Events.BLOCK_CHANGE,
    Blockly.Events.FINISHED_LOADING,
];

/** 输入槽合法类型：AllCheckers 中除万能（null）外的全部值（含 NONE，供返回类型校验用）。 */
const FUNCTION_VALUE_TYPES: readonly TFunctionInputField[] = Object.values(AllCheckers).filter(
    (checker): checker is TFunctionInputField => checker !== null,
);

interface IFunctionValueExtraState {
    functionRef?: IFunctionReference;
    /** 创建函数预览使用的临时参数快照。 */
    params?: TPreviewFunctionData[];
    isValue?: boolean;
    /** 定义帽中的函数值签名，参数由作用域源积木提供。 */
    definitionMode?: boolean;
    scopedNames?: Partial<Record<string, string>>;
    colors?: ICustomFunction['color'];
    returnType?: TFunctionReturnType;
}

type IDefinitionFunctionValueBlock = IFunctionValueBlock &
    Omit<IScopedSourceHost, 'loadExtraState' | 'saveExtraState'> & {
        definitionMode: boolean;
        definitionScopedSourceReady: boolean;
        refreshFromFunctionData(): void;
        /** 下拉参数分组背景矩形，按字段下标索引（仅渲染工作区使用）。 */
        dropdownGroupRects?: Map<number, SVGRectElement>;
    };

interface IFunctionDefinitionBlock extends Blockly.Block {
    /** 指向 VM 函数的轻量引用；数据本体以 VM 为唯一事实源。 */
    functionRef: IFunctionReference | null;
    setFunctionRef(ref: IFunctionReference | null): void;
    saveExtraState(): { functionRef?: IFunctionReference };
    loadExtraState(state: { functionRef?: IFunctionReference }): void;
}

const saveFunctionValueState = (block: IFunctionValueBlock): IFunctionValueExtraState => {
    const definitionBlock = block as IDefinitionFunctionValueBlock;
    return {
        ...(block.functionRef ? { functionRef: { ...block.functionRef } } : {}),
        ...(definitionBlock.definitionMode
            ? {
                  definitionMode: true,
                  params: structuredClone(block.previewData),
                  scopedNames: { ...definitionBlock.scopedNames },
                  colors: structuredClone(block.colors),
                  returnType: structuredClone(block.returnType),
              }
            : {}),
        isValue: block.isValue,
    };
};

const isFunctionValueType = (value: unknown): value is TFunctionInputField =>
    typeof value === 'string' && FUNCTION_VALUE_TYPES.includes(value as TFunctionInputField);

const normalizeReturnType = (value: unknown): TFunctionReturnType => {
    if (value === null || value === undefined) return null;
    if (isFunctionValueType(value)) return value;
    // 联合里不允许 null（万能只能单独使用），isFunctionValueType 对
    // null 恒为 false，恰好同时完成这两个校验。
    if (
        Array.isArray(value) &&
        value.every((v): v is Exclude<TFunctionInputField, null> => isFunctionValueType(v))
    ) {
        return [...value];
    }
    return null;
};

const getReferencedFunction = (vm: IVM, reference?: IFunctionReference) =>
    reference
        ? (vm.runtime.getTargetByID(reference.targetId)?.getFunction(reference.functionId) ?? null)
        : null;

/**
 * 定义帽签名（NAME 槽与签名输出共用）的 check。
 * 返回类型非空且非 NONE 时签名直接以返回类型的形状渲染，直观展示函数
 * 返回什么；NONE（无返回值）与 null（未知）暂回退 'Function' 万能胶囊
 * （语句形态的定义帽需要 NAME 槽结构支持，另行处理）。
 */
const returnTypeChecks = (returnType: TFunctionReturnType): string | string[] =>
    returnType === null || returnType === AllCheckers.NONE
        ? 'Function'
        : Array.isArray(returnType)
          ? [...returnType]
          : [returnType];

// 此函数由AI生成
/** 逐元素比较两组 check（单值或数组），免去每次 updateShape 的 JSON 序列化开销。 */
const checksEqual = (
    a: readonly string[] | string | null,
    b: readonly string[] | string | null,
): boolean => {
    if (a === null || b === null) return a === b;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (!Array.isArray(a) || !Array.isArray(b)) return a === b;
    if (a.length !== b.length) return false;
    return a.every((check, index) => check === b[index]);
};

/**
 * 原地更新一对已连接连接的 check，并兼容作用域锁定槽。
 *
 * Blockly 的 setCheck 会立即复检现有连接；ASH 的作用域槽默认拒绝
 * 一切复检，因此更新期间必须临时解锁，否则即使两端类型最终一致，
 * 子积木也会在中间状态被拔出。
 */
const alignConnectedChecks = (
    parent: Blockly.Connection,
    child: Blockly.Connection | null,
    wanted: string | string[] | null,
): void => {
    const parentCurrent = parent.getCheck() ?? null;
    const childCurrent = child?.getCheck() ?? null;
    if (checksEqual(parentCurrent, wanted) && (!child || checksEqual(childCurrent, wanted))) return;

    const scopedParent = parent as AshConnection;
    const previous = scopedParent.allowScopedSource ?? false;
    scopedParent.allowScopedSource = true;
    try {
        parent.setCheck(null);
        if (child && !checksEqual(childCurrent, wanted)) child.setCheck(wanted);
        parent.setCheck(wanted);
    } finally {
        scopedParent.allowScopedSource = previous;
    }
};

/** 立即刷新动态连接形状；使用 BlockSvg 自带实现以保持 Blockly 实例一致。 */
const renderBlockImmediately = (block: Blockly.Block): void => {
    if (!block.workspace.rendered) return;
    (block as unknown as Blockly.BlockSvg).render();
};

const dropdownShadowState = (
    field: IFunctionDropdownField,
): Blockly.serialization.blocks.State => ({
    type: OPCODES.FUNCTION_DROPDOWN,
    fields: { VALUE: selectedDropdownValue(field) },
    extraState: {
        options: normalizedDropdownOptions(field).map(([label, value]) => ({ label, value })),
    },
});

const bindDropdownSelection = (
    block: IFunctionValueBlock,
    field: Blockly.Field,
    index: number,
): void => {
    const showEditor = field.showEditor.bind(field);
    field.showEditor = (event?: Event) => {
        showEditor(event);
        block.selectInput(index);
    };
};

// 此函数由AI生成
/**
 * 取到（或新建）定义帽签名里的作用域值槽，并打上锁定标记。
 *
 * 锁定槽由宿主自动补块、对用户拖拽放行免疫（见 AshConnectionChecker
 * 规则 1）；新建的槽顺便定型 check，已存在的槽交由调用方对齐。
 */
const ensureLockedValueInput = (
    block: Blockly.Block,
    name: string,
    checks: string | string[] | null,
): Blockly.Input => {
    let input = block.getInput(name);
    if (input && !input.connection) {
        block.removeInput(name, true);
        input = null;
    }
    if (!input) {
        input = block.appendValueInput(name);
        input.setCheck(checks);
        (input.connection as AshConnection).isScopedSourceSlot = true;
    }
    return input;
};

// 此函数由AI生成
/**
 * 幂等同步实参槽上的下拉框影子。
 *
 * setShadowState 每次都会销毁重建影子块；而调用积木的 updateShape 会因
 * 各种无关原因（增删别的参数等）反复触发。选项没变就不重设，才能保留
 * 用户在该调用积木上已选的值——签名上的默认值只作为新建影子的初值。
 */
const syncDropdownShadowState = (
    connection: Blockly.Connection | null | undefined,
    field: IFunctionDropdownField,
): void => {
    if (!connection) return;
    const existing = connection.targetBlock();
    if (existing?.isShadow() && existing.type === OPCODES.FUNCTION_DROPDOWN) {
        const menuField = existing.getField('VALUE') as unknown as {
            getOptions(useCache?: boolean): Blockly.MenuOption[];
        } | null;
        const current = menuField?.getOptions(false);
        const wanted = normalizedDropdownOptions(field);
        if (
            current?.length === wanted.length &&
            wanted.every(([, value], index) => current[index][1] === value)
        ) {
            return;
        }
    }
    connection.setShadowState(dropdownShadowState(field));
};

// 此段由AI生成
/**
 * 枚举源积木（输入选择器）：定义帽签名里每个下拉参数除了参数槽（数据）
 * 外还有一个枚举槽，由作用域宿主自动补块、可无限拖出。拖出的枚举积木
 * 用于在函数体里选择具体选项（与 Scratch 的输入选择器一致）；仍住在
 * 枚举槽里的那枚改选会写回该参数的默认值。
 */

/** 枚举槽在宿主签名里的 input 名前缀，后接字段下标。 */
const ENUM_INPUT_PREFIX = 'ENUM_';
/** 枚举槽 key：enum-<字段下标>。 */
const ENUM_SLOT_KEY_PREFIX = 'enum-';

/** 枚举源积木；身份语义与参数积木一致（ownerId + slotKey 认亲）。 */
interface IFunctionEnumBlock extends Blockly.Block {
    ownerId?: string;
    slotKey?: string;
    updateLabel(name: string): void;
}

/** 读取枚举积木对应的宿主下拉配置；宿主丢失或字段已删时返回 null。 */
const enumFieldConfigOf = (block: IFunctionEnumBlock): IFunctionDropdownField | null => {
    if (!block.ownerId) return null;
    const key = block.slotKey ?? '';
    if (!key.startsWith(ENUM_SLOT_KEY_PREFIX)) return null;
    const index = Number(key.slice(ENUM_SLOT_KEY_PREFIX.length));
    if (!Number.isInteger(index)) return null;

    const host = block.workspace.getBlockById(block.ownerId);
    if (host?.type !== OPCODES.FUNCTION_VALUE) return null;
    const fieldData = (host as { previewData?: TPreviewFunctionData[] }).previewData?.[index];
    if (!fieldData || !isDropdownField(fieldData)) return null;
    return fieldData.type;
};

/** 枚举积木是否仍住在宿主的枚举槽里（区别于拖出的副本）。 */
const enumInHostSlot = (block: IFunctionEnumBlock): boolean =>
    block.getParent()?.id === block.ownerId;

/** 以给定配置重建枚举积木的下拉框；槽内改选会写回默认值。 */
const rebuildEnumField = (block: IFunctionEnumBlock, config: IFunctionDropdownField): void => {
    const input = block.getInput('MENU');
    if (!input) return;
    input.removeField('VALUE');
    input.appendField(
        createDropdownField(config, value => {
            // 只有住在枚举槽里的那枚改选才写默认值；拖出的副本各自持有选择。
            if (!enumInHostSlot(block)) return value;
            // 宿主数据可能被整体替换过（refreshFromFunctionData），必须现查。
            const live = enumFieldConfigOf(block);
            if (live) live.value = value;
            return value;
        }),
        'VALUE',
    );
};

/**
 * 幂等同步枚举积木的下拉选项。
 *
 * 选项没变时完全不重建（保留各副本已选的值）；选项变化时整体重建，
 * 槽内那枚显示（可能更新过的）默认值，拖出的副本保留仍然有效的选择。
 */
const syncEnumOptions = (block: IFunctionEnumBlock): void => {
    const config = enumFieldConfigOf(block);
    if (!config) return;
    const field = block.getField('VALUE') as unknown as {
        getOptions(useCache?: boolean): Blockly.MenuOption[];
        getValue(): string;
        setValue(newValue: string): void;
    } | null;
    if (!field) return;

    const wanted = normalizedDropdownOptions(config);
    const current = field.getOptions(false);
    const optionsEqual =
        current.length === wanted.length &&
        wanted.every(([, value], index) => current[index][1] === value);
    const previous = field.getValue();
    const inSlot = enumInHostSlot(block);

    if (optionsEqual) {
        // 选项没变：仅槽内那枚需要跟随可能被整体替换过的默认值。
        if (inSlot && previous !== selectedDropdownValue(config)) {
            field.setValue(selectedDropdownValue(config));
        }
        return;
    }

    rebuildEnumField(block, config);
    if (!inSlot) {
        const rebuilt = block.getField('VALUE');
        if (rebuilt && wanted.some(([, value]) => value === previous)) rebuilt.setValue(previous);
    }
};

/** 枚举积木的初始空配置；真实选项在宿主绑定（updateLabel）时同步。 */
const EMPTY_DROPDOWN_FIELD: IFunctionDropdownField = {
    type: 'dropdown',
    options: [{ value: '' }],
    allowBlocks: false,
};

// 此段由AI生成
/**
 * 下拉参数的分组背景：把签名里的参数积木与枚举积木包进同一块
 * 半透明圆角矩形（样式同函数值参数的文本提示背景），表明两者
 * 共同描述一个下拉参数。
 *
 * 背景矩形挂在宿主 svgGroup 里、插在两个子积木中 DOM 靠前者之前
 * （Blockly 的 setParent 只会 appendChild，子积木永远位于末尾），
 * 因此它稳定位于宿主路径之上、子积木之下。
 */
const DROPDOWN_GROUP_PADDING = 4;
const DROPDOWN_GROUP_RADIUS = 8;

const syncDropdownGroupBackgrounds = (host: Blockly.BlockSvg): void => {
    if (!host.workspace.rendered || host.isDeadOrDying()) return;
    const block = host as Blockly.BlockSvg & IDefinitionFunctionValueBlock;
    if (!block.definitionMode) return;
    // initSvg 之前 svgGroup 尚未创建（反序列化中途），跳过。
    const svgRoot = block.getSvgRoot() as SVGElement | undefined;
    if (!svgRoot) return;

    const rects = (block.dropdownGroupRects ??= new Map<number, SVGRectElement>());
    const alive = new Set<number>();

    block.previewData.forEach((fieldData, index) => {
        if (!isDropdownField(fieldData)) return;
        const argBlock = block.getInput(`ARG${String(index)}`)?.connection?.targetBlock() as
            Blockly.BlockSvg | undefined;
        const enumBlock = block
            .getInput(`${ENUM_INPUT_PREFIX}${String(index)}`)
            ?.connection?.targetBlock() as Blockly.BlockSvg | undefined;
        const argRoot = argBlock?.getSvgRoot();
        const enumRoot = enumBlock?.getSvgRoot();
        if (!argBlock || !enumBlock || !argRoot || !enumRoot) return;
        if (argBlock.getParent() !== block || enumBlock.getParent() !== block) return;

        const argXY = argBlock.relativeCoords;
        const enumXY = enumBlock.relativeCoords;
        const argHW = argBlock.getHeightWidth();
        const enumHW = enumBlock.getHeightWidth();

        const left = Math.min(argXY.x, enumXY.x);
        const top = Math.min(argXY.y, enumXY.y);
        const right = Math.max(argXY.x + argHW.width, enumXY.x + enumHW.width);
        const bottom = Math.max(argXY.y + argHW.height, enumXY.y + enumHW.height);

        let rect = rects.get(index);
        if (!rect || !svgRoot.contains(rect)) {
            rect = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.RECT, {
                class: 'blockly-function-dropdown-group-bg',
                'pointer-events': 'none',
            });
            rects.set(index, rect);
            // 插到两个子积木中 DOM 靠前的那个之前。
            const [first] = [argRoot, enumRoot].sort((a, b) =>
                a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
            );
            svgRoot.insertBefore(rect, first);
        }
        rect.setAttribute('x', String(left - DROPDOWN_GROUP_PADDING));
        rect.setAttribute('y', String(top - DROPDOWN_GROUP_PADDING));
        rect.setAttribute('width', String(right - left + DROPDOWN_GROUP_PADDING * 2));
        rect.setAttribute('height', String(bottom - top + DROPDOWN_GROUP_PADDING * 2));
        rect.setAttribute('rx', String(DROPDOWN_GROUP_RADIUS));
        rect.setAttribute('ry', String(DROPDOWN_GROUP_RADIUS));
        alive.add(index);
    });

    for (const [index, rect] of [...rects]) {
        if (!alive.has(index)) {
            rect.remove();
            rects.delete(index);
        }
    }
};

// 此函数由AI生成
/**
 * 返回值槽的类型默认 shadow：与工具箱里的默认值同机制。
 * Array / Object / Function / 联合类型 / null（未知）没有自然的默认值，
 * 返回 null 表示保持空槽。
 */
const defaultShadowFor = (
    returnType: TFunctionReturnType,
): Blockly.serialization.blocks.State | null => {
    switch (returnType) {
        case AllCheckers.NUMBER:
            return { type: OPCODES.math_number, fields: { NUM: 0 } };
        case AllCheckers.STRING:
            return { type: OPCODES.text, fields: { TEXT: '' } };
        case AllCheckers.BOOLEAN:
            return { type: OPCODES.OPERATOR_LOGIC_BOOLEAN, extraState: { value: true } };
        case AllCheckers.COLOUR:
            return { type: OPCODES.colour_picker, fields: { COLOUR: '#ff0000' } };
        default:
            return null;
    }
};

/**
 * 定义帽中的函数值是一个作用域宿主：每个参数槽里都放着可拖出的参数积木。
 * 普通 FUNCTION_VALUE 不使用这些槽，因此不会改变普通函数值的交互。
 * 下拉参数发放两种源积木：参数积木（值 = 各调用积木上选择的选项）与
 * 枚举积木（在函数体里选择具体选项用），都可无限拖出。
 */
const functionDefinitionValueScopedHost = scopedSourceHost({
    sourceType: OPCODES.FUNCTION_PARAM,
    extraSourceTypes: [OPCODES.FUNCTION_ENUM],
    slots: host => {
        const block = host as IDefinitionFunctionValueBlock;
        return block.previewData.flatMap((fieldData, index): IScopedSlot[] => {
            if (fieldData.type === 'text') return [];
            const slots: IScopedSlot[] = [
                {
                    inputName: `ARG${String(index)}`,
                    key: String(index),
                    defaultName: fieldData.text ?? '',
                },
            ];
            if (isDropdownField(fieldData)) {
                slots.push({
                    inputName: `${ENUM_INPUT_PREFIX}${String(index)}`,
                    key: `${ENUM_SLOT_KEY_PREFIX}${String(index)}`,
                    sourceType: OPCODES.FUNCTION_ENUM,
                    defaultName: '',
                });
            }
            return slots;
        });
    },
});

/** 根据函数展示配置切换值积木的输出/语句连接。 */
const configureFunctionValueConnections = (
    block: Blockly.Block,
    isValue: boolean,
    returnType: TFunctionReturnType,
) => {
    if (block.outputConnection?.isConnected()) block.outputConnection.disconnect();
    if (block.previousConnection?.isConnected()) block.previousConnection.disconnect();
    if (block.nextConnection?.isConnected()) block.nextConnection.disconnect();

    if (!isValue && returnType === AllCheckers.NONE) {
        // 无返回值：语句积木，没有输出。
        block.setOutput(false);
        block.setPreviousStatement(true, 'Action');
        block.setNextStatement(true, 'Action');
        return;
    }

    block.setPreviousStatement(false);
    block.setNextStatement(false);
    if (!isValue) {
        if (returnType === null) {
            // 未知：万能输出。
            block.setOutput(true);
        } else {
            // checker 字符串本身就是合法的输出类型（'Boolean'、'String'……）。
            block.setOutput(true, Array.isArray(returnType) ? returnType : [returnType]);
        }
    } else {
        block.setOutput(true, 'Function');
    }
};

/** 切换单个函数引用积木的显示方式，并把它作为一次可撤销的 mutation。 */
const setFunctionValueMode = (block: IFunctionValueBlock, isValue: boolean) => {
    if (block.isInFlyout || block.editMode || block.isDeadOrDying() || block.isValue === isValue)
        return;

    const oldState = JSON.stringify(saveFunctionValueState(block));
    const previousGroup = Blockly.Events.getGroup();
    Blockly.Events.setGroup(true);
    try {
        block.isValue = isValue;
        configureFunctionValueConnections(block, isValue, block.returnType);
        block.updateShape();

        const newState = JSON.stringify(saveFunctionValueState(block));
        if (oldState !== newState) {
            Blockly.Events.fire(
                new Blockly.Events.BlockChange(block, 'mutation', null, oldState, newState),
            );
        }
    } finally {
        Blockly.Events.setGroup(previousGroup || false);
    }
};

/** 让函数值积木里的参数提示跟随函数积木的主色。 */
const syncFunctionValueHintColors = (block: Blockly.Block) => {
    const color = block.getColour();
    for (const input of block.inputList) {
        const hint = input.connection?.targetBlock();
        if (hint?.type !== OPCODES.FUNCTION_ARG_HINT || hint.getColour() === color) continue;
        hint.setColour(color);
    }
};

/** 生成参数的稳定 id。 */
const spawnParamId = (): string => crypto.randomUUID().slice(0, 8);

/** 参数默认名：a、b、c…… 用完回退到 p9、p10。 */
const defaultParamName = (index: number): string =>
    index < 26 ? String.fromCharCode(97 + index) : `p${index.toString()}`;

/**
 * 从调用方的 FUNCTION 槽读取函数签名。
 *
 * 行内函数使用带稳定 id 的 params；普通函数值没有独立的参数 id，
 * 因此使用 previewData 的原始下标生成 id。保留原始下标可以避免固定
 * 文本项夹在参数之间时，函数签名变化后错误复用已有实参槽。
 */
function readParamsFromFunctionInput(block: Blockly.Block): IFunctionParam[] {
    const target = block.getInput('FUNCTION')?.connection?.targetBlock();
    if (target?.type === OPCODES.FUNCTION_INLINE) {
        const host = target as IFunctionInlineBlock;
        // params[].name 只是创建时的默认名（a、b、c……），改名写的是 scopedNames，
        // 所以显示名必须走 getScopedName，否则调用积木永远显示旧名。
        return host.params.map(param => ({
            type: param.type,
            id: param.id,
            name: host.getScopedName(param.id),
        }));
    }

    if (target?.type === OPCODES.FUNCTION_VALUE) {
        const value = target as IFunctionValueBlock;
        // 下拉框参数（无论是否允许填积木）都在调用积木上生成一个
        // 带选择框的实参槽，选中值由各调用积木自己持有。
        return value.previewData.flatMap((fieldData, index) =>
            fieldData.type === 'text'
                ? []
                : isDropdownField(fieldData)
                  ? [
                        {
                            type: AllCheckers.STRING,
                            id: `arg-${String(index)}`,
                            name:
                                normalizedDropdownOptions(fieldData.type).find(
                                    ([, optionValue]) =>
                                        optionValue === selectedDropdownValue(fieldData.type),
                                )?.[0] ?? selectedDropdownValue(fieldData.type),
                            dropdown: fieldData.type,
                        },
                    ]
                  : [
                        {
                            type: fieldData.type as TFunctionInputField | TFunctionTypeUnion,
                            id: `arg-${String(index)}`,
                            name: fieldData.text ?? '',
                        },
                    ],
        );
    }

    return [];
}

/**
 * 实参提示文字的样式：半透明，视觉上像输入框的 placeholder 而非真实取值。
 */
Blockly.Css.register(`
.ashArgHint {
    fill-opacity: 0.5;
}
`);

// 此类由AI生成
/**
 * 带背景圆角矩形的静态文本
 */
class FieldLabelWithBackground extends Blockly.FieldLabel {
    override initView() {
        super.initView();
        this.createBorderRect_();
        if (this.borderRect_ && this.textElement_)
            this.getSvgRoot()?.insertBefore(this.borderRect_, this.textElement_);
        this.getBorderRect().setAttribute('class', 'blockly-function-value-shadow-bg');
    }
}

/**
 * 注册函数类积木
 */
export function initFunctionBlocks(blockly: typeof Blockly, vm: IVM) {
    // 定义帽：持有指向 VM 函数的轻量引用并持久化。
    // 数据本体永远以 VM（target.function）为唯一事实源，
    // 帽子只保存"我属于哪个函数"。
    blockly.Blocks[OPCODES.FUNCTION_DEFINITION] = {
        init(this: IFunctionDefinitionBlock) {
            this.functionRef = null;
            this.jsonInit({
                ...hatConnections,
                message0: t('blocks:function.definition'),
                colour: BlocksColor.function.primary,
                args0: [{ type: 'input_value', name: 'NAME' }],
            });
            this.setDeletable(false);

            const connection = this.getInput('NAME')?.connection as AshConnection | undefined;
            if (!connection) return;
            connection.isScopedSourceSlot = true;
            connection.allowScopedSource = true;

            // 时序问题可能撞车
            queueMicrotask(() => {
                try {
                    if (this.isDeadOrDying()) return;
                    if (connection.targetBlock()) return;

                    const value = this.workspace.newBlock(OPCODES.FUNCTION_VALUE);
                    value.setMovable(false);

                    // 新建的签名子块与存档恢复的签名走同一条 definitionMode
                    // 读档路径，从 VM 里读出函数数据（参数、颜色、返回类型），
                    // 否则它只是一块没有任何形状信息的空白积木。
                    if (this.functionRef) {
                        (value as unknown as IDefinitionFunctionValueBlock).loadExtraState?.({
                            definitionMode: true,
                            functionRef: { ...this.functionRef },
                        });
                        value.setDeletable(false);
                    }

                    if (!value.outputConnection) return;
                    if (this.workspace.rendered) (value as Blockly.BlockSvg).initSvg();

                    // NAME 槽与签名输出使用同一份返回类型 check，
                    // 两边一致才能连上（connect 不匹配时静默失败）。
                    const returnType = normalizeReturnType(
                        getReferencedFunction(vm, this.functionRef ?? undefined)?.returnType,
                    );
                    connection.setCheck(returnTypeChecks(returnType));
                    connection.connect(value.outputConnection);

                    if (this.workspace.rendered) (value as Blockly.BlockSvg).render();
                } finally {
                    connection.allowScopedSource = false;
                }
            });
        },
        /** 设置持有的函数引用。 */
        setFunctionRef(this: IFunctionDefinitionBlock, ref: IFunctionReference | null) {
            this.functionRef = ref;
        },
        saveExtraState(this: IFunctionDefinitionBlock) {
            return this.functionRef ? { functionRef: { ...this.functionRef } } : {};
        },
        loadExtraState(
            this: IFunctionDefinitionBlock,
            state: { functionRef?: IFunctionReference },
        ) {
            this.functionRef = state.functionRef ?? null;
            // 签名的输出形状 = 返回类型（见签名 definitionMode 读档），
            // NAME 槽的 check 必须同步，否则反序列化时签名插不进槽
            // （connect 在 check 不匹配时静默失败）。
            const returnType = normalizeReturnType(
                getReferencedFunction(vm, this.functionRef ?? undefined)?.returnType,
            );
            this.getInput('NAME')?.connection?.setCheck(returnTypeChecks(returnType));
        },
    } as IFunctionDefinitionBlock;

    interface IFUNCTION_RETURN extends Blockly.Block {
        dragging: boolean;
        /** 上次应用到 VALUE 槽的组合标记（check + shadow），防止重复触发事件。 */
        appliedShadowMarker?: string;
        /** 带事件分组的槽位刷新：调整与起因同组，保证撤销正确。 */
        refreshValueSlot(event: Blockly.Events.Abstract): void;
        updateShape(): void;
    }

    blockly.Blocks[OPCODES.FUNCTION_RETURN] = {
        init(this: IFUNCTION_RETURN) {
            this.jsonInit({
                ...endConnections,
                colour: BlocksColor.function.primary,
            });
            // VALUE 槽终生存在，绝不增删：反序列化（读档、flyout 拖出、
            // 粘贴）在建块后立刻恢复 inputs.VALUE 里的子积木/shadow，
            // 槽必须此刻就在；NONE 的「不显示」用 setVisible 实现
            // （Blockly 折叠块同款机制，连接跟踪由它自己维护）。
            // 槽的可见性 / check / 默认 shadow 由 updateShape 幂等调整。
            this.appendDummyInput('TEXT').appendField(t('blocks:function.return'));
            this.appendValueInput('VALUE');
            this.updateShape();
        },
        // 此函数由AI生成
        onchange(this: IFUNCTION_RETURN, event: Blockly.Events.Abstract) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            if (event.type === Blockly.Events.BLOCK_CHANGE) {
                const change = event as Blockly.Events.BlockChange;
                const changed = this.workspace.getBlockById(change.blockId ?? '');
                if (!changed) return;

                const isStatementAncestor = (candidate: Blockly.Block): boolean => {
                    let cursor: Blockly.Block | null = this.getParent();
                    while (cursor) {
                        if (cursor === candidate) return true;
                        cursor = cursor.getParent();
                    }
                    return false;
                };

                if (changed.type === OPCODES.FUNCTION_INLINE) {
                    if (isStatementAncestor(changed)) this.refreshValueSlot(event);
                } else if (changed.type === OPCODES.FUNCTION_VALUE) {
                    const hat = changed.getParent();
                    if (hat && isStatementAncestor(hat)) this.refreshValueSlot(event);
                }
                return;
            }

            if (
                !(
                    [
                        Blockly.Events.BLOCK_MOVE,
                        Blockly.Events.BLOCK_DELETE,
                        Blockly.Events.FINISHED_LOADING,
                    ] as string[]
                ).includes(event.type)
            )
                return;
            this.refreshValueSlot(event);
        },
        refreshValueSlot(this: IFUNCTION_RETURN, event: Blockly.Events.Abstract) {
            // 同步执行（core 的 logic_ternary 模式）；updateShape 完全
            // 幂等，自身触发的子事件再次进入时全部命中守卫直接返回。
            // 调整产生的事件与起因归入同组，保证撤销行为正确。
            Blockly.Events.setGroup(event.group);
            try {
                this.updateShape();
            } finally {
                Blockly.Events.setGroup(false);
            }
        },
        updateShape(this: IFUNCTION_RETURN) {
            if (this.isDeadOrDying() || this.isInsertionMarker()) return;

            const getValueType = (): TFunctionReturnType => {
                if (this.dragging) return AllCheckers.ANY;
                // 向上找最近的函数容器
                let block: Blockly.Block | null = this.getParent();
                while (block) {
                    if (block.type === OPCODES.FUNCTION_INLINE)
                        return (block as IFunctionInlineBlock).returnType;
                    if (block.type === OPCODES.FUNCTION_DEFINITION) {
                        const signature = block
                            .getInput('NAME')
                            ?.connection?.targetBlock() as IFunctionValueBlock | null;
                        return signature?.returnType ?? AllCheckers.ANY;
                    }
                    block = block.getParent();
                }
                return AllCheckers.ANY;
            };

            const wanted = getValueType();
            const input = this.getInput('VALUE');
            if (!input) return;
            const connection = input.connection;
            if (!connection) return;

            // NONE：隐藏槽即可，结构不动。
            const wantVisible = wanted !== AllCheckers.NONE;
            if (input.isVisible() !== wantVisible) {
                input.setVisible(wantVisible);
                if (this.workspace.rendered)
                    void (this as unknown as Blockly.BlockSvg).queueRender();
            }
            if (!wantVisible) return;

            const wantedChecks =
                wanted === null ? null : Array.isArray(wanted) ? [...wanted] : [wanted];
            // 以 wanted 本身作标记：check 与默认 shadow 都由它唯一确定，
            // 不必每次 updateShape 都 JSON 序列化一遍。
            const marker = Array.isArray(wanted) ? wanted.join('|') : String(wanted);

            const target = connection.targetBlock();
            const hasShadow = !!target && target.isShadow();

            // check 变化：先清掉保留的 shadow（含槽内的旧 shadow 本体），
            // 再处理子积木、设新 check。否则拔下不兼容的真实子积木时，
            // disconnect 会用残留的 shadowDom 立刻 respawn 旧类型 shadow，
            // 撞上新 check 直接抛 ConnectionFailure（expected X, found Y）。
            const current = connection.getCheck() ?? null;
            if (!checksEqual(current, wantedChecks)) {
                connection.setShadowState(null);
                this.appliedShadowMarker = '';
                if (target && !hasShadow) {
                    // 真实子积木与新类型不兼容 → 分组拔下（core 同款）。
                    const childOut = target.outputConnection;
                    if (
                        childOut &&
                        !target.workspace.connectionChecker.doTypeChecks(connection, childOut)
                    ) {
                        target.unplug();
                    }
                }
                input.setCheck(wantedChecks);
            }

            // 默认 shadow：真实积木优先；同类型默认（可能被用户改过值）
            // 保留；其余按类型补默认 / 清空。
            if (target && !hasShadow) {
                this.appliedShadowMarker = undefined;
                return;
            }
            if (this.appliedShadowMarker === marker) return;
            const shadow = defaultShadowFor(wanted);
            if (hasShadow && target.type === shadow?.type) {
                this.appliedShadowMarker = marker;
                return;
            }
            this.appliedShadowMarker = marker;
            connection.setShadowState(shadow);
        },
    } as IFUNCTION_RETURN;

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

        override showEditor(e?: Event) {
            super.showEditor(e);
            // 编辑器被打开说明该输入框被选中。
            const block = this.getSourceBlock() as IFunctionValueBlock | null;
            const match = this.name?.match(/^TEXT_(\d+)$/);
            if (block && match) block.selectInput(Number(match[1]));
        }

        protected override widgetDispose_() {
            super.widgetDispose_();
            // 编辑器关闭（回车/Esc/失焦）说明取消选中。
            const block = this.getSourceBlock() as IFunctionValueBlock | null;
            if (block && !block.isDeadOrDying()) block.deselectInput();
        }

        protected override initView() {
            super.initView();
            const root = this.getSvgRoot();
            if (root) {
                Blockly.utils.dom.addClass(root, 'ashFunctionValueText');
                this.applyFill_();
            }
        }
        override applyColour() {
            super.applyColour();
            this.applyFill_();
        }

        private applyFill_() {
            const block = this.getSourceBlock() as Blockly.BlockSvg | null;
            if (!block) return;
            const rect = this.getSvgRoot()?.querySelector('rect');
            if (rect) rect.style.fill = block.getColourTertiary();
        }
    }

    // 此函数由AI生成
    /** 输入框在画布（blocklyBlockCanvas）坐标里的左上角锚点；渲染完成前可能为 null。 */
    function inputAnchorOf(
        this: IFunctionValueBlock,
        index: number,
    ): { x: number; y: number } | null {
        const input = this.getInput(`ARG${String(index)}`);
        if (!input) return null;
        const bxy = this.getRelativeToSurfaceXY();

        if (!input.connection) {
            const field = this.getField(`TEXT_${String(index)}`);
            const root = field?.getSvgRoot();
            if (!field || !root) return null;
            const xy = Blockly.utils.svgMath.getRelativeXY(root);
            // 返回输入框的水平中心，便于控制栏居中。
            return { x: bxy.x + xy.x + field.getSize().width / 2, y: bxy.y + xy.y };
        }

        const shadow = input.connection.targetBlock();
        if (!shadow) return null;
        const sxy = shadow.getRelativeToSurfaceXY();
        const hw = (shadow as Blockly.BlockSvg).getHeightWidth();
        return { x: sxy.x + hw.width / 2, y: sxy.y };
    }

    // 此函数由AI生成
    /**
     * 控制栏：HTML div 装在 foreignObject 里挂到画布（blocklyBlockCanvas），
     * 跟随工作区平移缩放。仅当选中了输入框时创建，定位在它上方。
     */
    function updateControlBar(this: IFunctionValueBlock) {
        this.controlBar?.remove();
        this.controlBar = null;
        if (!this.editMode || this.isDeadOrDying()) return;

        const index = this.activeInputIndex ?? -1;
        const anchor = index >= 0 ? inputAnchorOf.call(this, index) : null;
        if (!anchor) return;
        const activeData = this.previewData[index];
        const hasConfig = isDropdownField(activeData);
        const controlBarWidth = hasConfig ? CONTROL_BAR_CONFIG_WIDTH : CONTROL_BAR_WIDTH;

        const fo = Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.FOREIGNOBJECT,
            {
                class: 'blockly-function-previewBlock-controlBar',
                width: controlBarWidth,
                height: CONTROL_BAR_HEIGHT,
            },
            (this.workspace as Blockly.WorkspaceSvg).getCanvas(),
        );
        this.controlBar = fo;

        const controlBar = document.createElement('div');
        controlBar.className = 'blockly-function-previewBlock-controlBar-content';
        fo.appendChild(controlBar);

        const goLeft = document.createElement('img');
        goLeft.src = moveLeftIcon;
        goLeft.style.filter = 'invert(1) var(--svg-filter)';
        goLeft.className = 'blockly-function-previewBlock-controlBar-button';
        goLeft.addEventListener('pointerdown', e => {
            e.stopPropagation();
            e.preventDefault();
            // 左移后移动方法内部会重新选中这个输入框。
            this.moveField(index, -1);
        });

        let configure;
        if (hasConfig) {
            configure = document.createElement('img');
            configure.src = settingsIcon;
            configure.style.filter = 'invert(1) var(--svg-filter)';
            configure.className = 'blockly-function-previewBlock-controlBar-button';
            configure.title = t('gui:createFunction.dropdownConfigure');
            configure.addEventListener('pointerdown', event => {
                event.stopPropagation();
                event.preventDefault();
                this.openDropdownSettings(index);
            });
        }

        const remove = document.createElement('img');
        remove.src = removeIcon;
        remove.style.filter = 'var(--svg-filter)';
        remove.className = 'blockly-function-previewBlock-controlBar-button';
        remove.addEventListener('pointerdown', e => {
            e.stopPropagation();
            e.preventDefault();
            this.removeField(index);
        });

        const goRight = document.createElement('img');
        goRight.src = moveRightIcon;
        goRight.style.filter = 'invert(1) var(--svg-filter)';
        goRight.className = 'blockly-function-previewBlock-controlBar-button';
        goRight.addEventListener('pointerdown', e => {
            e.stopPropagation();
            e.preventDefault();
            // 右移后移动方法内部会重新选中这个输入框。
            this.moveField(index, 1);
        });
        controlBar.appendChild(goLeft);
        if (hasConfig) controlBar.appendChild(configure as unknown as HTMLImageElement);
        controlBar.appendChild(remove);
        controlBar.appendChild(goRight);

        // 水平居中在输入框上方。
        fo.setAttribute('x', String(anchor.x - controlBarWidth / 2));
        fo.setAttribute('y', String(anchor.y - CONTROL_BAR_HEIGHT - 6));
    }

    // 此函数由AI生成
    /**
     * 值槽位影子块的 ID 字段无法子类化，这里在实例上包装它的选中生命周期：
     * showEditor 被调用 = 输入框被选中；widgetDispose_（编辑器关闭） = 取消选中。
     */
    function bindShadowSelection(
        this: IFunctionValueBlock,
        field: Blockly.FieldTextInput,
        index: number,
    ) {
        const origShow = field.showEditor.bind(field);
        field.showEditor = (e?: Event) => {
            origShow(e);
            // WidgetDiv.show 会先关闭旧编辑器；必须等旧字段完成 deselect 后再选中新字段。
            this.selectInput(index);
        };
        const wrapped = field as unknown as { widgetDispose_: () => void };
        const origDispose = wrapped.widgetDispose_.bind(field);
        wrapped.widgetDispose_ = () => {
            this.deselectInput();
            origDispose();
        };
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

    /** 自定义选择框积木；通常作为允许填积木的函数字段 shadow。 */
    blockly.Blocks[OPCODES.FUNCTION_DROPDOWN] = {
        init(this: Blockly.Block) {
            this.setOutput(true, 'String');
            this.setColour(BlocksColor.function.secondary);
            this.appendDummyInput('MENU').appendField(
                createDropdownField(EMPTY_DROPDOWN_FIELD),
                'VALUE',
            );
        },
        saveExtraState(this: Blockly.Block) {
            const field = this.getField('VALUE');
            const dropdown = field as unknown as {
                getOptions(useCache?: boolean): Blockly.MenuOption[];
            };
            return {
                options: dropdown.getOptions(false).map(([label, value]) => ({
                    label: typeof label === 'string' ? label : value,
                    value,
                })),
            };
        },
        loadExtraState(
            this: Blockly.Block,
            state: { options?: IFunctionDropdownField['options'] },
        ) {
            const options = state.options?.length ? state.options : [{ value: '' }];
            const input = this.getInput('MENU');
            if (!input) return;
            input.removeField('VALUE');
            input.appendField(
                createDropdownField({ type: 'dropdown', options, allowBlocks: false }),
                'VALUE',
            );
        },
    } as Blockly.Block;

    // 此积木由AI生成
    /**
     * 枚举源积木（输入选择器）：住在定义帽签名的枚举槽里，可无限拖出。
     * 拖出的副本是带选择框的字符串常量；宿主的选项变化会同步到所有副本，
     * 参数删除时副本一并销毁（走作用域源的 updateScopedLabels 通道）。
     */
    blockly.Blocks[OPCODES.FUNCTION_ENUM] = {
        init(this: IFunctionEnumBlock) {
            this.ownerId = undefined;
            this.slotKey = undefined;
            this.setOutput(true, AllCheckers.STRING);
            this.setColour(BlocksColor.function.secondary);
            this.appendDummyInput('MENU').appendField(
                createDropdownField(EMPTY_DROPDOWN_FIELD),
                'VALUE',
            );
        },
        updateLabel(this: IFunctionEnumBlock, _name: string) {
            // 枚举积木没有名字标签；这里按作用域源协议同步下拉选项。
            syncEnumOptions(this);
        },
        saveExtraState(this: IFunctionEnumBlock) {
            const dropdown = this.getField('VALUE') as unknown as {
                getOptions(useCache?: boolean): Blockly.MenuOption[];
            } | null;
            return {
                ...(this.ownerId ? { ownerId: this.ownerId, slotKey: this.slotKey ?? '' } : {}),
                options: (dropdown?.getOptions(false) ?? []).map(([label, value]) => ({
                    label: typeof label === 'string' ? label : value,
                    value,
                })),
            };
        },
        loadExtraState(
            this: IFunctionEnumBlock,
            state: {
                ownerId?: string;
                slotKey?: string;
                options?: IFunctionDropdownField['options'];
            },
        ) {
            this.ownerId = state.ownerId;
            this.slotKey = state.slotKey;
            // 优先用宿主的最新配置；宿主尚未载入（浮动副本先于定义帽加载）
            // 时回退到自带的选项快照，之后 updateScopedLabels 会再校正。
            const config =
                enumFieldConfigOf(this) ??
                ({
                    type: 'dropdown',
                    options: state.options?.length ? state.options : [{ value: '' }],
                    allowBlocks: false,
                } satisfies IFunctionDropdownField);
            rebuildEnumField(this, config);
        },
    } as IFunctionEnumBlock;

    blockly.Blocks[OPCODES.FUNCTION_VALUE] = {
        ...functionDefinitionValueScopedHost,
        init(this: IDefinitionFunctionValueBlock) {
            this.functionRef = null;
            this.previewData = [];
            this.colors = BlocksColor.function;
            this.editMode = false;
            this.activeInputIndex = -1;
            this.controlBar = null;
            this.isValue = true;
            this.returnType = null;
            this.definitionMode = false;
            this.definitionScopedSourceReady = false;
            this.dropdownGroupRects = new Map();
            this.jsonInit({
                ...returnConnections,
                colour: BlocksColor.function.primary,
                output: 'Function',
            });
            // 所有渲染最终都汇经 renderEfficiently：字段变化（枚举改选）、
            // 形状变化、补块等触发的重排都在这里刷新下拉参数的分组背景。
            if (this.workspace.rendered) {
                const svgBlock = this as unknown as Blockly.BlockSvg;
                const baseRenderEfficiently = svgBlock.renderEfficiently.bind(svgBlock);
                svgBlock.renderEfficiently = () => {
                    baseRenderEfficiently();
                    syncDropdownGroupBackgrounds(svgBlock);
                };
            }
        },
        loadExtraState(this: IDefinitionFunctionValueBlock, state: IFunctionValueExtraState) {
            if (state.definitionMode) {
                const functionData = getReferencedFunction(vm, state.functionRef);
                this.definitionMode = true;
                this.allowScopedRename = false;
                this.functionRef = state.functionRef ?? null;
                this.scopedNames = { ...state.scopedNames };
                this.previewData = structuredClone(functionData?.body ?? state.params ?? []);
                this.colors = structuredClone(
                    functionData?.color ?? state.colors ?? BlocksColor.function,
                );
                this.isValue = true;
                this.returnType = normalizeReturnType(functionData?.returnType ?? state.returnType);
                this.setMovable(false);
                this.setDeletable(false);
                // 无返回类型时保持 'Function'；NONE（无返回值）同样回退，
                // 语句形态的定义帽需要 NAME 槽结构支持，另行处理。
                if (this.returnType !== null && this.returnType !== AllCheckers.NONE) {
                    this.setOutputShape(null);
                    this.setPreviousStatement(false);
                    this.setNextStatement(false);
                    this.setOutput(true, returnTypeChecks(this.returnType));
                } else {
                    configureFunctionValueConnections(this, true, null);
                    if (this.returnType === null) {
                        // 3 = zelos ConstantProvider.SHAPES.SQUARE（zelos 独有常量，
                        this.setOutputShape(3);
                    }
                }
                this.updateShape();
                this.initScopedHost();
                this.definitionScopedSourceReady = true;
                return;
            }

            this.definitionMode = false;
            const functionData = getReferencedFunction(vm, state.functionRef);

            this.functionRef = state.functionRef ?? null;
            this.previewData = structuredClone(functionData?.body ?? state.params ?? []);
            this.colors = structuredClone(functionData?.color ?? BlocksColor.function);
            // 引用积木自己的显示状态优先；函数定义中的 true 只是默认值。
            this.isValue = state.isValue ?? functionData?.isValue ?? true;
            this.returnType = normalizeReturnType(functionData?.returnType);

            // 引用目标可能已删除；此时仍应渲染一个空签名。
            configureFunctionValueConnections(this, this.isValue, this.returnType);
            this.updateShape();
        },
        refreshFromFunctionData(this: IDefinitionFunctionValueBlock) {
            if (this.isDeadOrDying() || !this.functionRef) return;
            const functionData = getReferencedFunction(vm, this.functionRef);
            if (!functionData) return;

            this.previewData = structuredClone(functionData.body);
            this.colors = structuredClone(functionData.color);
            this.returnType = normalizeReturnType(functionData.returnType);

            // 更新输出 checker 时暂时放宽父槽，避免新旧返回类型切换时
            // Blockly 将仍然兼容的函数值从调用处拔出。
            const output = this.outputConnection;
            const parent = output?.targetConnection;
            const wanted = this.definitionMode
                ? returnTypeChecks(this.returnType)
                : this.isValue
                  ? ['Function']
                  : returnTypeChecks(this.returnType);
            if (output && parent) alignConnectedChecks(parent, output, wanted);
            else if (output && !checksEqual(output.getCheck() ?? null, wanted))
                output.setCheck(wanted);

            this.updateShape();
            if (this.definitionMode) {
                this.ensureScopedBlocks();
                // ensureScopedBlocks 只处理签名槽内的源积木；已经拖出
                // 槽位的参数副本也要跟随最新函数参数名称和类型。
                this.updateScopedLabels();
            }
        },
        saveExtraState(this: IDefinitionFunctionValueBlock) {
            return saveFunctionValueState(this);
        },
        customContextMenu(
            this: IDefinitionFunctionValueBlock,
            options: (
                | Blockly.ContextMenuRegistry.ContextMenuOption
                | Blockly.ContextMenuRegistry.LegacyContextMenuOption
            )[],
        ) {
            if (this.definitionMode || this.editMode || !this.functionRef) return;

            const block = this as unknown as Blockly.BlockSvg;
            if (this.isInFlyout) {
                options.unshift({
                    id: 'functionValueEdit',
                    text: t('blocks:function.edit'),
                    enabled: true,
                    scope: { block, focusedNode: block },
                    weight: 10,
                    callback: () => {
                        // 防止循环依赖
                        void import('../../../components/modal_createFunction').then(
                            ({ CreateFunctionModal }) => {
                                if (isModalOpen(CreateFunctionModal)) return;
                                void modal.open(CreateFunctionModal, {
                                    vm,
                                    addID: this.functionRef?.targetId ?? vm.runtime.editingTargetID,
                                    editFunctionId: this.functionRef?.functionId,
                                });
                            },
                        );
                    },
                });
                options.unshift({
                    id: 'functionValueRemove',
                    text: t('blocks:function.remove'),
                    enabled: true,
                    scope: { block, focusedNode: block },
                    weight: 10,
                    callback: () => {
                        // 防止循环依赖
                        void import('../../../components/modal_confirm').then(
                            ({ ConfirmModal }) => {
                                if (isModalOpen(ConfirmModal)) return;
                                void modal.open(ConfirmModal, {
                                    message: t('blocks:function.remove.tip'),
                                    callback: result => {
                                        if (result)
                                            vm.runtime
                                                .getTargetByID(this.functionRef?.targetId ?? '')
                                                ?.removeCustomFunction(
                                                    this.functionRef?.functionId ?? '',
                                                );
                                    },
                                });
                            },
                        );
                    },
                });
                return;
            }
            options.unshift({
                separator: true,
            } as Blockly.ContextMenuRegistry.SeparatorContextMenuOption);
            options.unshift({
                id: 'functionValueDisplayMode',
                text: t(
                    this.isValue ? 'blocks:function.showAsScratch' : 'blocks:function.showAsValue',
                ),
                enabled: this.isEditable(),
                scope: { block, focusedNode: block },
                weight: 10,
                callback: () => {
                    setFunctionValueMode(this, !this.isValue);
                },
            });
        },
        /** 选中输入框（其编辑器被打开）时显示控制栏。 */
        selectInput(this: IFunctionValueBlock, index: number) {
            if (!this.editMode || this.isDeadOrDying()) return;
            this.activeInputIndex = index;
            updateControlBar.call(this);
        },
        openDropdownSettings(this: IFunctionValueBlock, index: number) {
            if (!this.editMode || this.isDeadOrDying()) return;
            const data = this.previewData[index];
            if (!isDropdownField(data)) return;

            void modal.open(CreateDropdownModal, {
                initial: structuredClone(data.type),
                parentWindowID: 'createFunction',
                blocking: true,
                callback: next => {
                    if (this.isDeadOrDying()) return;
                    // 只更新选择框配置，保留已输入的 ID（text）。
                    this.previewData[index] = { type: next, text: data.text };
                    this.updateShape();
                    this.selectInput(index);
                },
            });
        },
        /** 取消选中当前输入框，销毁控制栏。 */
        deselectInput(this: IFunctionValueBlock) {
            if (!this.editMode || this.isDeadOrDying()) return;
            this.activeInputIndex = -1;
            updateControlBar.call(this);
        },
        moveField(this: IFunctionValueBlock, index: number, delta: number) {
            const target = index + delta;
            if (target < 0 || target >= this.previewData.length) return;

            const next = [...this.previewData];
            [next[index], next[target]] = [next[target], next[index]];
            this.previewData.splice(0, this.previewData.length, ...next);
            this.updateShape();
            // 移动后重新选中该输入框（重新打开它的编辑器，选中状态随之恢复）。
            const input = this.getInput(`ARG${String(target)}`);
            const field = input?.connection
                ? input.connection.targetBlock()?.getField('ID')
                : this.getField(`TEXT_${String(target)}`);
            field?.showEditor();
        },
        /** 从预览数据里移除一个输入并重建形状（编辑模式下）。 */
        removeField(this: IFunctionValueBlock, index: number) {
            if (!this.editMode || this.isDeadOrDying()) return;
            this.previewData.splice(index, 1);
            this.activeInputIndex = -1;
            this.updateShape();
        },
        updateShape(this: IDefinitionFunctionValueBlock) {
            if (this.definitionMode) {
                const wanted = new Set(this.previewData.map((_, index) => `ARG${String(index)}`));
                const wantedEnums = new Set(
                    this.previewData.flatMap((fieldData, index) =>
                        isDropdownField(fieldData) ? [`${ENUM_INPUT_PREFIX}${String(index)}`] : [],
                    ),
                );
                for (const input of [...this.inputList]) {
                    if (input.name.startsWith('ARG') && !wanted.has(input.name)) {
                        this.removeInput(input.name, true);
                    } else if (
                        input.name.startsWith(ENUM_INPUT_PREFIX) &&
                        !wantedEnums.has(input.name)
                    ) {
                        // 字段不再是下拉参数（或已被删除）时，枚举槽一并清理；
                        // 槽内与散落的枚举积木由 updateScopedLabels 负责销毁。
                        this.removeInput(input.name, true);
                    }
                }

                this.setColour(this.colors.primary ?? BlocksColor.function.primary);
                this.setStyle(this.getStyleName());

                this.previewData.forEach((fieldData, index) => {
                    const inputName = `ARG${String(index)}`;
                    let input = this.getInput(inputName);

                    if (isDropdownField(fieldData)) {
                        // 数据槽：与普通参数一致，参数源积木可无限拖出，
                        // 运行值 = 各调用积木上选择的选项。
                        input = ensureLockedValueInput(
                            this,
                            inputName,
                            paramTypeToChecks(AllCheckers.STRING),
                        );
                        const connection = input.connection;
                        const source = connection?.targetBlock();
                        const sourceOutput =
                            source?.type === OPCODES.FUNCTION_PARAM
                                ? source.outputConnection
                                : null;
                        if (connection)
                            alignConnectedChecks(
                                connection,
                                sourceOutput,
                                paramTypeToChecks(AllCheckers.STRING),
                            );

                        // 枚举槽：同样由作用域宿主补块，枚举积木可无限拖出，
                        // 供函数体选择具体选项（Scratch 的输入选择器）。
                        const enumInput = ensureLockedValueInput(
                            this,
                            `${ENUM_INPUT_PREFIX}${String(index)}`,
                            paramTypeToChecks(AllCheckers.STRING),
                        );
                        const enumConnection = enumInput.connection;
                        const enumSource = enumConnection?.targetBlock();
                        const enumSourceOutput =
                            enumSource?.type === OPCODES.FUNCTION_ENUM
                                ? enumSource.outputConnection
                                : null;
                        if (enumConnection)
                            alignConnectedChecks(
                                enumConnection,
                                enumSourceOutput,
                                paramTypeToChecks(AllCheckers.STRING),
                            );
                        return;
                    }

                    if (fieldData.type === 'text') {
                        if (input?.connection) {
                            this.removeInput(inputName, true);
                            input = null;
                        }
                        if (!input) {
                            this.appendDummyInput(inputName).appendField(
                                fieldData.text ?? '',
                                `TEXT_${String(index)}`,
                            );
                        } else {
                            this.getField(`TEXT_${String(index)}`)?.setValue(fieldData.text ?? '');
                        }
                        return;
                    }

                    if (input && !input.connection) {
                        this.removeInput(inputName, true);
                        input = null;
                    }
                    input ??= this.appendValueInput(inputName);
                    const connection = input.connection;
                    const wantedChecks = paramTypeToChecks(
                        fieldData.type as TFunctionInputField | TFunctionTypeUnion,
                    );
                    const source = connection?.targetBlock();
                    const sourceOutput =
                        source?.type === OPCODES.FUNCTION_PARAM ? source.outputConnection : null;
                    if (connection) alignConnectedChecks(connection, sourceOutput, wantedChecks);
                });

                for (let index = 0; index < this.previewData.length; index++) {
                    this.moveInputBefore(`ARG${String(index)}`, null);
                    // 枚举槽紧跟在对应参数槽后面。
                    const enumName = `${ENUM_INPUT_PREFIX}${String(index)}`;
                    if (this.getInput(enumName)) this.moveInputBefore(enumName, null);
                }
                // 删除参数等形状变化未必触发宿主重渲染，这里兜底清理
                // 分组背景（坐标最终以 renderEfficiently 里的同步为准）。
                syncDropdownGroupBackgrounds(this as unknown as Blockly.BlockSvg);
                updateControlBar.call(this);
                return;
            }

            for (const input of [...this.inputList]) {
                this.removeInput(input.name, true);
            }

            this.setColour(this.colors.primary ?? BlocksColor.function.primary);
            this.setStyle(this.getStyleName());

            this.previewData.forEach((fieldData, index) => {
                const inputID = `ARG${String(index)}`;
                if (fieldData.type === 'text') {
                    if (this.editMode) {
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
                        this.appendDummyInput(inputID).appendField(
                            textInput,
                            `TEXT_${String(index)}`,
                        );
                    } else {
                        this.appendDummyInput(inputID).appendField(
                            fieldData.text ?? '',
                            `TEXT_${String(index)}`,
                        );
                    }
                } else if (isDropdownField(fieldData)) {
                    if (this.editMode) {
                        // 编辑页：下拉框参数与普通参数一致显示可编辑 ID；
                        // 选项配置走控制栏的 ⚙ 按钮。
                        const input = this.appendValueInput(inputID);
                        input.setCheck('String');
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
                        if (shadowText) bindShadowSelection.call(this, shadowText, index);
                    } else if (this.isValue) {
                        // 函数值模式：与普通参数一致，仅展示 ID 标签。
                        this.appendDummyInput(inputID).appendField(
                            new FieldLabelWithBackground(
                                fieldData.text ?? '  ',
                                'blockly-function-value-shadow',
                            ),
                        );
                    } else {
                        // Scratch 模式：选择框在函数积木上。
                        const input = fieldData.type.allowBlocks
                            ? this.appendValueInput(inputID)
                            : this.appendDummyInput(inputID);
                        if (input.connection) {
                            input.setCheck('String');
                            input.connection.setShadowState(dropdownShadowState(fieldData.type));
                        } else {
                            const dropdown = createDropdownField(fieldData.type, value => {
                                fieldData.type.value = value;
                            });
                            input.appendField(dropdown, `DROPDOWN_${String(index)}`);
                            bindDropdownSelection(this, dropdown, index);
                        }
                    }
                } else {
                    let input: Blockly.Input;
                    if (this.definitionMode) input = this.appendValueInput(inputID);
                    else if (!this.isValue || this.editMode) input = this.appendValueInput(inputID);
                    else input = this.appendDummyInput(inputID);

                    const fieldType = fieldData.type as TFunctionInputField | TFunctionTypeUnion;
                    if (this.definitionMode) input.setCheck(fieldType);
                    if (this.editMode && !this.definitionMode) {
                        input.setCheck(fieldType);
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
                        if (shadowText) bindShadowSelection.call(this, shadowText, index);
                    } else if (this.definitionMode) {
                        // 作用域宿主会在这个空槽里放入 FUNCTION_PARAM，
                        // 用户拖走后再补一个新的参数源积木。
                    } else {
                        if (this.isValue) {
                            input.appendField(
                                new FieldLabelWithBackground(
                                    fieldData.text ?? '  ',
                                    'blockly-function-value-shadow',
                                ),
                            );
                        } else {
                            input.setCheck(fieldType);
                            input.connection?.setShadowState(
                                fieldData.type === AllCheckers.BOOLEAN
                                    ? {
                                          type: OPCODES.OPERATOR_LOGIC_BOOLEAN,
                                      }
                                    : {
                                          type: OPCODES.FUNCTION_ARG_HINT,
                                          fields: { HINT: fieldData.text ?? '' },
                                      },
                            );
                        }
                    }
                }
            });

            syncFunctionValueHintColors(this);
            updateControlBar.call(this);
            // 等渲染完成后（字段 transform 就位）用最新布局重新定位。
            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(() => {
                    if (!this.isDeadOrDying()) {
                        syncFunctionValueHintColors(this);
                        updateControlBar.call(this);
                    }
                });
            }
        },
        onchange(this: IDefinitionFunctionValueBlock, event: Blockly.Events.Abstract) {
            if (
                this.definitionMode &&
                (
                    [
                        Blockly.Events.BLOCK_CREATE,
                        Blockly.Events.BLOCK_MOVE,
                        Blockly.Events.BLOCK_DELETE,
                        Blockly.Events.FINISHED_LOADING,
                    ] as string[]
                ).includes(event.type)
            ) {
                this.ensureScopedBlocks();
            }
            // 工作区反序列化会在 loadExtraState 之后再次载入 shadow，
            // 因此在后续事件中再同步一次颜色，避免恢复后回到默认粉色。
            if (!this.editMode && !this.isDeadOrDying()) {
                syncFunctionValueHintColors(this);
            }
        },
        updateControlBar(this: IFunctionValueBlock) {
            updateControlBar.call(this);
        },
    } as IDefinitionFunctionValueBlock;

    // 此函数由AI生成
    /**
     * 行内函数的「返回值类型」按钮：样式同 +/− 按钮，点击弹出
     * 创建函数同款的返回值选择 Modal。选择结果作为 mutation 记录，
     * 可随存档保存与撤销。
     */
    const createInlineReturnTypeField = (): Blockly.FieldImage =>
        new Blockly.FieldImage(
            settingsIcon,
            15,
            15,
            t('blocks:function.inlineReturnType'),
            field => {
                const block = field.getSourceBlock() as IFunctionInlineBlock | null;
                if (!block || block.isInFlyout) return;
                // FieldImage 回调位于 Blockly 的 pointerup 手势中，弹窗延后打开。
                queueMicrotask(() => {
                    if (block.isDeadOrDying()) return;
                    void modal.open(FieldTypeModal, {
                        purpose: 'return',
                        blocking: true,
                        callback: result => {
                            if (result === 'text' || block.isDeadOrDying()) return;
                            if (block.returnType === result) return;
                            const oldState = JSON.stringify(block.saveExtraState());
                            block.returnType = result;
                            const newState = JSON.stringify(block.saveExtraState());
                            if (oldState !== newState) {
                                Blockly.Events.fire(
                                    new Blockly.Events.BlockChange(
                                        block,
                                        'mutation',
                                        null,
                                        oldState,
                                        newState,
                                    ),
                                );
                            }
                        },
                    });
                });
            },
        );

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
            this.returnType = null;
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
                type: null,
            };
            this.params = [...this.params, param];
            this.updateShape();
            this.ensureScopedBlocks();
        },

        // 此函数由AI生成
        /** 弹出参数类型选择 Modal（复用创建函数的输入类型 Modal）。 */
        openParamSettings(this: IFunctionInlineBlock, key: string) {
            const param = this.params.find(item => item.id === key);
            if (!param) return;
            void modal.open(FieldTypeModal, {
                purpose: 'input',
                blocking: true,
                callback: result => {
                    // 输入类型 Modal 不会返回 NONE（那是返回值语境的占位）。
                    if (result === 'text' || result === AllCheckers.NONE) return;
                    if (this.isDeadOrDying()) return;
                    const target = this.params.find(item => item.id === key);
                    if (!target || JSON.stringify(target.type) === JSON.stringify(result)) return;
                    const oldState = JSON.stringify(this.saveExtraState());
                    target.type = result;
                    const newState = JSON.stringify(this.saveExtraState());
                    if (oldState !== newState) {
                        Blockly.Events.fire(
                            new Blockly.Events.BlockChange(
                                this,
                                'mutation',
                                null,
                                oldState,
                                newState,
                            ),
                        );
                    }
                    // 槽位与参数输出的两端对齐由 alignParamSlot 幂等完成。
                    this.updateShape();
                    this.ensureScopedBlocks();

                    // 被拖出槽位的浮动副本（保留 ownerId/slotKey 的参数
                    // 积木）不在任何对齐管道里，这里统一同步输出类型；
                    // 槽内那份由 alignParamSlot 处理，跳过避免重复复检。
                    const slotConnection = this.getInput(`${PARAM_INPUT_PREFIX}${key}`)?.connection;
                    const wantedChecks = paramTypeToChecks(result);
                    for (const block of this.workspace.getAllBlocks(false)) {
                        const source = block as unknown as IScopedSourceBlock;
                        if (source.type !== OPCODES.FUNCTION_PARAM) continue;
                        if (source.ownerId !== this.id || source.slotKey !== key) continue;
                        if (source.outputConnection?.targetConnection === slotConnection) continue;
                        const out = source.outputConnection;
                        if (out && !checksEqual(out.getCheck() ?? null, wantedChecks)) {
                            out.setCheck(wantedChecks);
                            if (block.workspace.rendered) {
                                void (block as unknown as Blockly.BlockSvg).queueRender();
                            }
                        }
                    }
                    // 浮动副本的 queueRender + 槽内两端的对齐，统一在这里
                    // 同步 flush（rAF 批处理实测不刷新外形）。
                    if (this.workspace.rendered) (this as unknown as Blockly.BlockSvg).render();
                },
            });
        },

        // 此函数由AI生成
        /**
         * 把参数槽与参数积木的输出一起对齐到参数类型（完全幂等）。
         *
         * 槽位与积木输出是同一条连接的两端：任何一端单独进入中间态，
         * 都会触发 onCheckChanged_ 复检、把参数挤出去。所以先把槽位
         * 切到万能过渡（setCheck(null) 不触发复检），再在临时开锁下
         * 对齐参数输出、定型槽位——锁定槽在检查器规则 1 里默认拒绝
         * 一切复检，不开锁连「两端一致」的合法复检都过不了。
         */
        alignParamSlot(this: IFunctionInlineBlock, inputName: string, param: IFunctionParam) {
            const input = this.getInput(inputName);
            const connection = input?.connection as AshConnection | undefined;
            if (!connection) return;
            const wantedChecks = paramTypeToChecks(param.type);
            if (checksEqual(connection.getCheck() ?? null, wantedChecks)) return;

            const paramBlock = connection.targetBlock();
            const paramOut =
                paramBlock && !paramBlock.isShadow() ? paramBlock.outputConnection : null;

            connection.setCheck(null);
            if (paramOut) {
                const previous = connection.allowScopedSource ?? false;
                connection.allowScopedSource = true;
                try {
                    paramOut.setCheck(wantedChecks);
                    connection.setCheck(wantedChecks);
                } finally {
                    connection.allowScopedSource = previous;
                }
            } else {
                connection.setCheck(wantedChecks);
            }
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
                this.appendDummyInput('LABEL')
                    .appendField(createInlineReturnTypeField())
                    .appendField(t('blocks:function.inline'));
            }

            for (const param of this.params) {
                const inputName = `${PARAM_INPUT_PREFIX}${param.id}`;
                const removeName = `${PARAM_REMOVE_PREFIX}${param.id}`;
                if (!this.getInput(inputName)) this.appendValueInput(inputName);
                // 槽位与参数积木输出两端一起对齐到参数类型（null=万能）。
                this.alignParamSlot(inputName, param);
                if (!this.getInput(removeName)) {
                    this.appendDummyInput(removeName).appendField(
                        createMinusWithSettingsField({ key: param.id }),
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
                returnType: this.returnType,
                params: this.params.map(param => ({
                    ...param,
                    // 名字以 scopedNames 为准（改名走的是那条路）。
                    name: this.getScopedName(param.id),
                })),
            };
        },

        loadExtraState(
            this: IFunctionInlineBlock,
            state: { params?: IFunctionParam[]; returnType?: TFunctionReturnType },
        ) {
            this.params = (state.params ?? []).map(param => ({
                ...param,
                // 旧档没有 type 字段，归一为未知万能。
                type: param.type ?? null,
            }));
            this.returnType = state.returnType ?? null;
            this.scopedNames = Object.fromEntries(this.params.map(param => [param.id, param.name]));
            this.updateShape();
            this.updateScopedLabels();
        },
    };

    // 参数积木：可以从行内函数头部拖出来，在函数体内反复使用。
    // output 为 null（万能），因此能插进任何插槽，包括「执行函数」。
    blockly.Blocks[OPCODES.FUNCTION_PARAM] = scopedSourceBlock({
        colour: BlocksColor.function.secondary,
        defaultLabel: () => '',
        hostTypes: [OPCODES.FUNCTION_INLINE, OPCODES.FUNCTION_VALUE],
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
            const isFunction =
                target?.type === OPCODES.FUNCTION_INLINE || target?.type === OPCODES.FUNCTION_VALUE;

            // 输出 check 跟随接入函数的返回类型：null（未知）/ NONE 都
            // 归为万能；仅 FUNCTION_CALL 有输出连接（执行块是语句）。
            // 摘下函数后回到手动模式，输出同样回到万能。
            if (this.outputConnection) {
                const returnType = isFunction
                    ? (target as IFunctionInlineBlock | IFunctionValueBlock).returnType
                    : null;
                const wantedChecks =
                    returnType === null || returnType === AllCheckers.NONE
                        ? null
                        : Array.isArray(returnType)
                          ? [...returnType]
                          : [returnType];
                if (!checksEqual(this.outputConnection.getCheck() ?? null, wantedChecks)) {
                    this.outputConnection.setCheck(wantedChecks);
                }
            }

            if (!isFunction) {
                // 摘下函数：保留现有插槽（里面的实参不丢），把控制权交还用户。
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
                    (param, i) =>
                        param.id === this.args[i].id &&
                        param.name === this.args[i].name &&
                        checksEqual(param.type, this.args[i].type) &&
                        JSON.stringify(param.dropdown) === JSON.stringify(this.args[i].dropdown),
                );
            if (unchanged) return;

            this.autoSync = true;
            this.args = params;
            this.updateShape();
        },

        onchange(this: IFunctionCallerBlock, event: Blockly.Events.Abstract) {
            if (CALLER_RESYNC_EVENTS.includes(event.type)) this.syncArgs();
        },

        // 此函数由AI生成
        /** 弹出实参类型选择 Modal（复用创建函数的输入类型 Modal）。 */
        openArgSettings(this: IFunctionCallerBlock, key: string) {
            const arg = this.args.find(item => item.id === key);
            if (!arg) return;
            void modal.open(FieldTypeModal, {
                purpose: 'input',
                blocking: true,
                callback: result => {
                    // 输入类型 Modal 不会返回 NONE（那是返回值语境的占位）。
                    if (result === 'text' || result === AllCheckers.NONE) return;
                    if (this.isDeadOrDying()) return;
                    const target = this.args.find(item => item.id === key);
                    if (!target || checksEqual(target.type, result)) return;
                    const oldState = JSON.stringify(this.saveExtraState());
                    target.type = result;
                    const newState = JSON.stringify(this.saveExtraState());
                    if (oldState !== newState) {
                        Blockly.Events.fire(
                            new Blockly.Events.BlockChange(
                                this,
                                'mutation',
                                null,
                                oldState,
                                newState,
                            ),
                        );
                    }
                    this.updateShape();
                },
            });
        },

        // ⊕/⊖ 只在手动模式下渲染，因此这里无需再判断模式。
        plus(this: IFunctionCallerBlock) {
            this.args = [
                ...this.args,
                {
                    id: spawnParamId(),
                    name: defaultParamName(this.args.length),
                    type: null,
                },
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
                const wantedChecks = paramTypeToChecks(arg.type);

                if (arg.dropdown && !arg.dropdown.allowBlocks) {
                    // 纯下拉框：选择框直接作为积木自身的字段（不是影子积木），
                    // 选中值随调用积木的字段状态持久化，各调用点互不影响。
                    if (this.getInput(inputName)?.connection) this.removeInput(inputName, true);
                    const dummy = this.getInput(inputName) ?? this.appendDummyInput(inputName);
                    const fieldName = `DROPDOWN_${arg.id}`;
                    const field = this.getField(fieldName) as unknown as {
                        getOptions(useCache?: boolean): Blockly.MenuOption[];
                    } | null;
                    const wanted = normalizedDropdownOptions(arg.dropdown);
                    const current = field?.getOptions(false);
                    const sameOptions =
                        current?.length === wanted.length &&
                        wanted.every(([, value], index) => current[index][1] === value);
                    // 选项没变就不重建，保留该调用积木上已选的值。
                    if (!sameOptions) {
                        dummy.removeField(fieldName, true);
                        dummy.appendField(createDropdownField(arg.dropdown), fieldName);
                    }
                } else {
                    // 允许填积木的下拉框与普通参数一样使用值槽。
                    const input = this.getInput(inputName);
                    if (input && !input.connection) this.removeInput(inputName, true);
                    if (!this.getInput(inputName)) this.appendValueInput(inputName);
                    const argConnection = this.getInput(inputName)?.connection;

                    // 实参槽 check 跟随参数定义的类型（null=万能）。
                    // hint shadow 的输出 check 会在下面同步，避免类型切换时被拔出；
                    // 不兼容的真实积木仍由复检自然挤出。
                    // 参数名以半透明提示的形式显示在空槽里（类似输入框 placeholder），
                    // 插入真实积木后自动被盖住，拖走又会重新露出来。
                    if (arg.dropdown) {
                        syncDropdownShadowState(argConnection, arg.dropdown);
                    } else {
                        const hint = argConnection?.getShadowState() as
                            { fields?: { HINT?: string } } | undefined;
                        // 名字没变就别重设，setShadowState 会产生一串多余的变更事件。
                        if (hint?.fields?.HINT !== arg.name) {
                            argConnection?.setShadowState({
                                type: OPCODES.FUNCTION_ARG_HINT,
                                fields: { HINT: arg.name },
                            });
                        }
                    }
                    // 父槽与 hint shadow 必须以万能类型作为过渡，避免从旧类型
                    // 切换到新类型时，Blockly 在两端暂时不兼容的瞬间拔出 shadow。
                    const hintBlock = argConnection?.targetBlock();
                    const hintOutput = hintBlock?.isShadow() ? hintBlock.outputConnection : null;
                    const currentChecks = argConnection?.getCheck() ?? null;
                    const hintChecks = hintOutput?.getCheck() ?? null;
                    if (
                        !checksEqual(currentChecks, wantedChecks) ||
                        (hintOutput && !checksEqual(hintChecks, wantedChecks))
                    ) {
                        if (hintOutput) {
                            argConnection?.setCheck(null);
                            hintOutput.setCheck(wantedChecks);
                            argConnection?.setCheck(wantedChecks);
                        } else {
                            argConnection?.setCheck(wantedChecks);
                        }
                    }
                }

                // 自动模式由行内函数决定参数个数与类型，整个按钮组隐藏；
                // 手动模式用竖向按钮组：上「−」删除，下「⚙」设置类型。
                const removeName = `${ARG_REMOVE_PREFIX}${arg.id}`;
                if (this.autoSync) this.removeInput(removeName, true);
                else if (!this.getInput(removeName)) {
                    this.appendDummyInput(removeName).appendField(
                        createMinusWithSettingsField({
                            key: arg.id,
                            settingsMethod: 'openArgSettings',
                        }),
                    );
                }
            }
            for (const name of order) this.moveInputBefore(name, null);
            renderBlockImmediately(this);
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
