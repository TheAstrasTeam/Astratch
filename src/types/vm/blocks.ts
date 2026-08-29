/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import type { IVM } from './vm';
import type {
    TFunctionReturnType,
    TPreviewFunctionData,
} from '../../components/modal_createFunction/functionPreview';

const OPCODES = {
    // 菜单
    POSITION_MENU: 'position_menu',
    //POSITION_ADDORSET_MENU: 'position_addOrSet_menu',
    //SCALE_ADDORSET_MENU: 'scale_addOrSet_menu',
    DIRECTION_SETWHERE_MENU: 'direction_setWhere_menu',
    DIRECTION_SETFACE_MENU: 'direction_setFace_menu',
    LAYER_MOVE_MENU: 'layer_move_menu',
    IMAGES_STRETCH_MENU: 'images_stretch_menu',
    //IMAGES_IMAGES_ADDORSET_MENU: 'images_images_addOrSet_menu',
    IMAGES_GRID_MENU: 'images_grid_menu',
    IMAGES_GRID_MENU_TWO: 'images_grid_menu_two',
    IMAGES_GRID_SIZE_MENU: 'images_grid_size_menu',
    EFFECTS_MENU: 'effects_menu',
    //EFFECTS_ADDORSET_MENU: 'effects_addOrSet_menu',
    VISIBILITY_MENU: 'visibility_menu',
    COLLISION_MENU: 'collision_menu',
    LIFECYCLE_CLONE_MUTATOR: 'lifecycle_clone_mutator',
    AUDIO_THEN_MENU: 'audio_then_menu',
    AUDIO_CONTROL_MENU: 'audio_control_menu',
    //AUDIO_ADDORSET_MENU: 'audio_addOrSet_menu',
    AUDIO_GET_MENU: 'audio_get_menu',
    AUDIO_GET_IS_MENU: 'audio_get_is_menu',
    AUDIO_EFFECT_MENU: 'audio_effect_menu',
    MATH_OPERATOR_MENU: 'math_operator_menu',
    LOGIC_COMPARE_MENU: 'logic_compare_menu',
    LOGIC_OPERATION_MENU: 'logic_operation_menu',
    SCIENTIFIC_FUNCTION_MENU: 'scientific_function_menu',
    DATA_NAME_MENU: 'data_name_menu',
    DATA_COMPUTE_MENU: 'data_compute_menu',
    DATA_OBJECT_TYPE_MENU: 'data_object_type_menu',
    KEY_MENU: 'key_menu',
    MOUSE_KEY_MENU: 'mouse_key_menu',
    KEY_ISPRESS_MENU: 'key_isPress_menu',
    DEBUG_LOG_TYPE_MENU: 'debug_log_type_menu',
    CANVAS_LINESET_MENU: 'canvas_lineSet_menu',
    TEXT_ALIGN_MENU: 'text_align_menu',
    EVENT_POSITION_MENU: 'event_position_menu',
    // 实体
    // - 变换
    // - - 位置
    ENTITY_TRANSFORM_POSITION_MOVESTEP: 'entity_transform_position_moveStep',
    ENTITY_TRANSFORM_POSITION_SETPOSITION: 'entity_transform_position_setPosition',
    ENTITY_TRANSFORM_POSITION_ADDPOSITION: 'entity_transform_position_addPosition',
    ENTITY_TRANSFORM_POSITION_GETPOSITION: 'entity_transform_position_getPosition',
    // - - 缩放
    ENTITY_TRANSFORM_SCALE_SETSCALE: 'entity_transform_scale_setScale',
    ENTITY_TRANSFORM_SCALE_ADDSCALE: 'entity_transform_scale_addScale',
    ENTITY_TRANSFORM_SCALE_GETSCALE: 'entity_transform_scale_getScale',
    // - - 方向
    ENTITY_TRANSFORM_DIRECTION_SETDIRECTION: 'entity_transform_direction_setDirection',
    ENTITY_TRANSFORM_DIRECTION_ADDDIRECTION: 'entity_transform_direction_addDirection',
    ENTITY_TRANSFORM_DIRECTION_FACEDIRECTION: 'entity_transform_direction_faceDirection',
    ENTITY_TRANSFORM_DIRECTION_GETDIRECTION: 'entity_transform_direction_getDirection',
    // - - 图层
    ENTITY_TRANSFORM_LAYER_SETLAYER: 'entity_transform_layer_setLayer',
    ENTITY_TRANSFORM_LAYER_MOVELAYER: 'entity_transform_layer_moveLayer',
    ENTITY_TRANSFORM_LAYER_GETLAYER: 'entity_transform_layer_getLayer',
    // - 外观
    // - - 图像
    ENTITY_APPEARANCE_IMAGES_SHOWIMAGE: 'entity_appearance_images_showImage',
    ENTITY_APPEARANCE_IMAGES_SETSTRETCH: 'entity_appearance_images_setStretch',
    ENTITY_APPEARANCE_IMAGES_ADDSTRETCH: 'entity_appearance_images_addStretch',
    ENTITY_APPEARANCE_IMAGES_GETSTRETCH: 'entity_appearance_images_getStretch',
    ENTITY_APPEARANCE_IMAGES_SETGRID: 'entity_appearance_images_setGrid',
    ENTITY_APPEARANCE_IMAGES_SETGRIDDISTANCE: 'entity_appearance_images_setGridDistance',
    ENTITY_APPEARANCE_IMAGES_ADDGRIDDISTANCE: 'entity_appearance_images_addGridDistance',
    ENTITY_APPEARANCE_IMAGES_GETGRID: 'entity_appearance_images_getGrid',
    ENTITY_APPEARANCE_IMAGES_GETGRIDDISTANCE: 'entity_appearance_images_getGridDistance',
    ENTITY_APPEARANCE_VISIBILITY_SET: 'entity_appearance_visibility_set',
    ENTITY_APPEARANCE_VISIBILITY_GET: 'entity_appearance_visibility_get',
    // - - 特效
    ENTITY_APPEARANCE_EFFECTS_SETEFFECT: 'entity_appearance_effects_setEffect',
    ENTITY_APPEARANCE_EFFECTS_ADDEFFECT: 'entity_appearance_effects_addEffect',
    ENTITY_APPEARANCE_EFFECTS_GETEFFECT: 'entity_appearance_effects_getEffect',
    // - 碰撞
    ENTITY_COLLISION_ISTOUCHING: 'entity_collision_isTouching',
    ENTITY_COLLISION_WHENTOUCHING: 'entity_collision_whenTouching',
    // - 生命周期
    ENTITY_LIFECYCLE_ONCREATED: 'entity_lifecycle_onCreated',
    ENTITY_LIFECYCLE_CLONE: 'entity_lifecycle_clone',
    ENTITY_LIFECYCLE_DELETECLONE: 'entity_lifecycle_deleteClone',

    // 音频
    // - 播放
    AUDIO_PLAY_PLAY: 'audio_play_play',
    AUDIO_PLAY_CONTROL: 'audio_play_control',
    AUDIO_PLAY_SETTIME: 'audio_play_setTime',
    AUDIO_PLAY_ADDTIME: 'audio_play_addTime',
    AUDIO_PLAY_CONTROLALL: 'audio_play_controlAll',
    AUDIO_PLAY_GETALLIDS: 'audio_play_getAllIds',
    AUDIO_PLAY_GETINFO: 'audio_play_getInfo',
    AUDIO_PLAY_ISINFO: 'audio_play_isInfo',
    // - 特效
    AUDIO_EFFECTS_SETEFFECT: 'audio_effects_setEffect',
    AUDIO_EFFECTS_RESETEFFECT: 'audio_effects_resetEffect',
    AUDIO_EFFECTS_RESETALLEFFECTS: 'audio_effects_resetAllEffects',
    AUDIO_EFFECTS_RESETEFFECTALL: 'audio_effects_resetEffectAll',
    AUDIO_EFFECTS_RESETALLEFFECTSALL: 'audio_effects_resetAllEffectsAll',
    AUDIO_EFFECTS_GETEFFECT: 'audio_effects_getEffect',

    // 资源
    RESOURCES_ADDFROMURL: 'resources_addFromUrl',
    RESOURCES_GET: 'resources_get',
    RESOURCES_EXISTS: 'resources_exists',
    RESOURCES_RENAME: 'resources_rename',
    RESOURCES_DELETE: 'resources_delete',

    // 事件
    // - 广播
    EVENT_BROADCAST_SEND: 'event_broadcast_send',
    EVENT_BROADCAST_LISTEN: 'event_broadcast_listen',
    EVENT_BROADCAST_DATA: 'event_broadcast_data',
    // - 生命周期
    EVENT_LIFECYCLE_ONSTART: 'event_lifecycle_onStart',
    EVENT_LIFECYCLE_ONSTOP: 'event_lifecycle_onStop',
    EVENT_LIFECYCLE_ONRUNNINGFORMS: 'event_lifecycle_onRunningForMs',
    // - 时间
    EVENT_TIME_RUNNINGDURATION: 'event_time_runningDuration',
    EVENT_TIME_CREATETIMER: 'event_time_createTimer',
    EVENT_TIME_RESETTIMER: 'event_time_resetTimer',
    EVENT_TIME_DELETETIMER: 'event_time_deleteTimer',
    EVENT_TIME_TIMERVALUE: 'event_time_timerValue',
    EVENT_TIME_WHENTIMEREXCEEDS: 'event_time_whenTimerExceeds',
    // - 输入
    EVENT_INPUT_GETMOUSEPOSITION: 'event_input_getMousePosition',
    EVENT_INPUT_ISMOUSETOUCHING: 'event_input_isMouseTouching',
    EVENT_INPUT_ISMOUSEBUTTONPRESSED: 'event_input_isMouseButtonPressed',
    EVENT_INPUT_ISKEYPRESSED: 'event_input_isKeyPressed',
    EVENT_INPUT_GETLASTKEYPRESSED: 'event_input_getLastKeyPressed',
    EVENT_INPUT_GETALLKEYPRESSED: 'event_input_getAllKeyPressed',
    EVENT_INPUT_GETLOUDNESS: 'event_input_getLoudness',
    EVENT_INPUT_GETFREQUENCYSPECTRUM: 'event_input_getFrequencySpectrum',
    EVENT_INPUT_WHENMOUSEHOVER: 'event_input_whenMouseHover',
    EVENT_INPUT_WHENMOUSEMOVED: 'event_input_whenMouseMoved',
    EVENT_INPUT_WHENMOUSEBUTTON: 'event_input_whenMouseButton',
    EVENT_INPUT_WHENKEYPRESSED: 'event_input_whenKeyPressed',

    // 控制
    // - 流程
    CONTROL_FLOW_WAIT: 'control_flow_wait',
    CONTROL_FLOW_WAITUNTIL: 'control_flow_waitUntil',
    CONTROL_FLOW_BREAK: 'control_flow_break',
    CONTROL_FLOW_STOPSCRIPT: 'control_flow_stopScript',
    CONTROL_FLOW_STOPPROJECT: 'control_flow_stopProject',
    // - 条件
    CONTROL_CONDITION_IF: 'control_condition_if',
    // - 循环
    CONTROL_LOOP_WHILE: 'control_loop_while',
    CONTROL_LOOP_REPEAT: 'control_loop_repeat',
    CONTROL_LOOP_REPEAT_COUNT: 'control_loop_repeat_count',
    CONTROL_LOOP_FOREACH: 'control_loop_forEach',
    CONTROL_LOOP_FOREACH_ITEM: 'control_loop_forEach_item',
    // - 匹配
    CONTROL_MATCH_MATCH: 'control_match_match',
    CONTROL_MATCH_CASE: 'control_match_case',
    CONTROL_MATCH_DEFAULT: 'control_match_default',

    // 运算
    // - 数学
    OPERATOR_MATH_OP: 'operator_math_op',
    OPERATOR_MATH_RANDOM: 'operator_math_random',
    OPERATOR_MATH_MIN: 'operator_math_min',
    OPERATOR_MATH_MAX: 'operator_math_max',
    OPERATOR_MATH_CLAMP: 'operator_math_clamp',
    // - 逻辑
    OPERATOR_LOGIC_COMPARE: 'operator_logic_compare',
    OPERATOR_LOGIC_OPERATION: 'operator_logic_operation',
    OPERATOR_LOGIC_NOT: 'operator_logic_not',
    OPERATOR_LOGIC_BOOLEAN: 'operator_logic_boolean',
    OPERATOR_LOGIC_TERNARY: 'operator_logic_ternary',
    // - 科学
    OPERATOR_SCIENTIFIC_FUNC: 'operator_scientific_func',

    // 数据
    // - 变量
    DATA_VARIABLE_GET: 'data_variable_get',
    DATA_VARIABLE_SET: 'data_variable_set',
    DATA_VARIABLE_ADD: 'data_variable_add',
    DATA_VARIABLE_COMPUTE: 'data_variable_compute',
    // - 字符串
    DATA_STRING_JOIN: 'data_string_join',
    DATA_STRING_SPLIT: 'data_string_split',
    DATA_STRING_SUBSTRING: 'data_string_substring',
    DATA_STRING_LENGTH: 'data_string_length',
    DATA_STRING_CONTAINS: 'data_string_contains',
    DATA_STRING_INDEXOF: 'data_string_indexOf',
    DATA_STRING_REPLACE: 'data_string_replace',
    // - 数组
    DATA_ARRAY_EMPTY: 'data_array_empty',
    DATA_ARRAY_PUSH: 'data_array_push',
    DATA_ARRAY_REMOVEAT: 'data_array_removeAt',
    DATA_ARRAY_REMOVEENDS: 'data_array_removeEnds',
    DATA_ARRAY_GET: 'data_array_get',
    DATA_ARRAY_LENGTH: 'data_array_length',
    DATA_ARRAY_FILTER: 'data_array_filter',
    DATA_ARRAY_INDEXOF: 'data_array_indexOf',
    DATA_ARRAY_SET: 'data_array_set',
    DATA_ARRAY_INSERT: 'data_array_insert',
    DATA_ARRAY_CONTAINS: 'data_array_contains',
    DATA_ARRAY_SLICE: 'data_array_slice',
    // - 对象
    DATA_OBJECT_EMPTY: 'data_object_empty',
    DATA_OBJECT_SET: 'data_object_set',
    DATA_OBJECT_DELETE: 'data_object_delete',
    DATA_OBJECT_GETALL: 'data_object_getAll',
    DATA_OBJECT_GET: 'data_object_get',
    DATA_OBJECT_LENGTH: 'data_object_length',
    DATA_OBJECT_HAS: 'data_object_has',
    // - 类型
    DATA_TYPE_TYPEOF: 'data_type_typeof',
    DATA_TYPE_CAST: 'data_type_cast',
    DATA_TYPE_NULL: 'data_type_null',

    // 函数
    FUNCTION_DEFINITION: 'function_definition',
    FUNCTION_CALL: 'function_call',
    FUNCTION_EXECUTE: 'function_execute',
    FUNCTION_RETURN: 'function_return',
    FUNCTION_INLINE: 'function_inline',
    FUNCTION_PARAM: 'function_param',
    FUNCTION_ARG_HINT: 'function_arg_hint',
    FUNCTION_SETDATAVALUE: 'function_setDataValue',
    FUNCTION_VALUE: 'function_value',
    FUNCTION_VALUE_ID: 'function_value_id',
    FUNCTION_DROPDOWN: 'function_dropdown',
    FUNCTION_ENUM: 'function_enum',

    // 画布
    CANVAS_CLEANALL: 'canvas_cleanAll',
    CANVAS_COLOR: 'canvas_color',
    CANVAS_POINT: 'canvas_point',
    CANVAS_LINESET: 'canvas_lineSet',
    CANVAS_LINE: 'canvas_line',
    CANVAS_FILL: 'canvas_fill',
    CANVAS_CIRCLE: 'canvas_circlr',
    CANVAS_RECTANGLE: 'canvas_rectangle',
    CANVAS_POLYGON: 'canvas_polygon',
    CANVAS_STAMP: 'canvas_stamp',
    CANVAS_STAMPPLUS: 'canvas_stampPlus',
    CANVAS_TEXT: 'canvas_text',
    CANVAS_TEXTFONT: 'canvas_textFont',

    // 删除了一些定义，因为 KOSHINO 想做，所以删了。
    // KOSHINO 是正确的😋
    // 为什么非要把某些不必要功能做成常用功能？必须所有东西都用户自适应吗？
    // 还是说不想做 TW 的插件“在右键菜单中切换”💥
    CANVAS_IMPORTDATA: 'canvas_importData',
    CANVAS_DATAEXIST: 'canvas_dataExist',
    CANVAS_DATALIST: 'canvas_dataList',
    CANVAS_RENDERALL: 'canvas_renderAll',
    CANVAS_DELLIST: 'canvas_delList',

    // 调试
    DEBUG_LOG: 'debug_log',
    DEBUG_CRASH: 'debug_crash',
    DEBUG_BREAKPOINT: 'debug_breakpoint',

    // 通用积木 (shadow blocks)
    math_number: 'math_number',
    math_integer: 'math_integer',
    math_whole_number: 'math_whole_number',
    math_positive_number: 'math_positive_number',
    math_angle: 'math_angle',
    text: 'text',
    colour_picker: 'colour_picker',

    // 自定义积木
    procedures_definition: 'procedures_definition',
    procedures_call: 'procedures_call',
    procedures_return: 'procedures_return',
    argument_reporter_string_number: 'argument_reporter_string_number',
    argument_reporter_boolean: 'argument_reporter_boolean',

    // 数据
    DATA_REFERENCE: 'data_reference',

    // 特殊
    DATA_CATEGORY: 'data_category',
    HANDLE_CREATE_DATA: 'handle_create_data',
    FUNCTION_CATEGORY: 'function_category',
    HANDLE_CREATE_FUNCTION: 'handle_create_function',
} as const;

type TOpcodeValue = (typeof OPCODES)[keyof typeof OPCODES];

export interface IBlockColor {
    primary?: string;
    secondary?: string;
    tertiary?: string;
    quaternary?: string;
}

const BlocksColor = {
    position: {
        primary: '#4C97FF',
        secondary: '#4280D7',
        tertiary: '#3373CC',
        quaternary: '#3373CC',
    },
    scale: {
        primary: '#3D7DE0',
        secondary: '#3068C0',
        tertiary: '#2654A0',
        quaternary: '#2654A0',
    },
    direction: {
        primary: '#2A66CC',
        secondary: '#2355B0',
        tertiary: '#1C4494',
        quaternary: '#1C4494',
    },
    layer: {
        primary: '#1A4FA8',
        secondary: '#15408A',
        tertiary: '#10336E',
        quaternary: '#10336E',
    },
    Images: {
        primary: '#ff0044',
        secondary: '#e60013',
        tertiary: '#cc0025',
        quaternary: '#cc003a',
    },
    effects: {
        primary: '#CC2244',
        secondary: '#B31D3A',
        tertiary: '#991830',
        quaternary: '#801428',
    },
    collision: {
        primary: '#5CB1D6',
        secondary: '#4E9FC4',
        tertiary: '#3D8DB5',
        quaternary: '#3D8DA5',
    },
    lifecycle: {
        primary: '#4CAF50',
        secondary: '#3D9C42',
        tertiary: '#2E8A35',
        quaternary: '#207828',
    },
    audio: {
        primary: '#CF63CF',
        secondary: '#B855B8',
        tertiary: '#A04AA0',
        quaternary: '#A04A90',
    },
    resources: {
        primary: '#59C059',
        secondary: '#4AA84A',
        tertiary: '#3D963D',
        quaternary: '#3D963D',
    },
    event: {
        primary: '#FFBF00',
        secondary: '#E6AC00',
        tertiary: '#CC9900',
        quaternary: '#CC9900',
    },
    control: {
        primary: '#FFAB19',
        secondary: '#E69900',
        tertiary: '#CC8800',
        quaternary: '#CC8800',
    },
    operator: {
        primary: '#59C059',
        secondary: '#4AA84A',
        tertiary: '#3D963D',
        quaternary: '#3D963D',
    },
    data: {
        primary: '#FF8C1A',
        secondary: '#E67E00',
        tertiary: '#CC7000',
        quaternary: '#CC7000',
    },
    function: {
        primary: '#FF6680',
        secondary: '#E65570',
        tertiary: '#CC4560',
        quaternary: '#CC4550',
    },
    canvas: {
        primary: '#0fbd8c',
        secondary: '#0ca378',
        tertiary: '#137458',
        quaternary: '#0a644b',
    },
    debug: {
        primary: '#A0A0A0',
        secondary: '#8A8A8A',
        tertiary: '#757575',
        quaternary: '#757565',
    },
    text: '#FFFFFF',
    workspace: '#F9F9F9',
    toolboxHover: '#4C97FF',
    toolboxSelected: '#E9EEF2',
    toolboxText: '#575E75',
    toolbox: '#FFFFFF',
    blackText: '#575E75',
    flyout: '#F9F9F9',
    scrollbar: '#CECDCE',
    scrollbarHover: '#CECDCE',
    textField: '#FFFFFF',
    textFieldText: '#575E75',
    insertionMarker: '#000000',
    insertionMarkerOpacity: 0.2,
    dragShadowOpacity: 0.6,
    stackGlow: '#FFF200',
    stackGlowSize: 4,
    stackGlowOpacity: 1,
    replacementGlow: '#FFFFFF',
    replacementGlowSize: 2,
    replacementGlowOpacity: 1,
    colourPickerStroke: '#FFFFFF',
    // CSS colours: support RGBA
    fieldShadow: 'rgba(255, 255, 255, 0.3)',
    dropDownShadow: 'rgba(0, 0, 0, .3)',
    numPadBackground: '#547AB2',
    numPadBorder: '#435F91',
    numPadActiveBackground: '#435F91',
    numPadText: 'white', // Do not use hex here, it cannot be inlined with data-uri SVG
    valueReportBackground: '#FFFFFF',
    valueReportBorder: '#AAAAAA',
    valueReportForeground: '#000000',
    menuHover: 'rgba(0, 0, 0, 0.2)',
    contextMenuBackground: '#ffffff',
    contextMenuBorder: '#cccccc',
    contextMenuForeground: '#000000',
    contextMenuActiveBackground: '#d6e9f8',
    contextMenuDisabledForeground: '#cccccc',
    flyoutLabelColor: '#575E75',
    checkboxInactiveBackground: '#ffffff',
    checkboxInactiveBorder: '#c8c8c8',
    checkboxActiveBackground: '#4C97FF',
    checkboxActiveBorder: '#3373CC',
    checkboxCheck: '#ffffff',
    buttonBorder: '#c6c6c6',
    buttonActiveBackground: '#ffffff',
    buttonForeground: '#575E75',
    zoomIconFilter: 'none',
    gridColor: '#dddddd',
} as const;

type IBlocksColor = typeof BlocksColor;

export interface IBlocksConfig {
    opcode: TOpcodeValue;
    color: IBlocksColor;
}

export { OPCODES, BlocksColor };

export type Language = Record<string, string>;

/**
 * 下面导出后的blocks
 */
export interface IBlocksState {
    languageVersion: number;
    blocks: Blockly.serialization.blocks.State[];
}

/**
 * `Blockly.serialization.workspaces.save()` 的类型
 * Blockly 自身的类型声明把它写成 `{[key: string]: any}`，导致类型系统爆炸了
 */
export interface IWorkspaceState {
    blocks: IBlocksState;
    workspaceComments?: Blockly.serialization.workspaceComments.State[];
}

export interface IBlocks {
    /**
     * ## 工作区
     * > 处理 **所有** 数据&渲染的东西。
     *
     * 至于为什么不拆分？我哪知道，它返回的是这个
     *
     * 它可能还未被创建，所以可能为null
     */
    workspaceSvg: Blockly.WorkspaceSvg | null;
    /**
     * ## Blockly
     */
    Blockly: typeof Blockly;
    /**
     * ## 工具箱
     *
     * 它存储着**所有**积木配置
     */
    toolbox: Blockly.utils.toolbox.ToolboxDefinition | object;
    /**
     * 主题，让界面长得像Scratch
     */
    theme: Blockly.Theme;
    /**
     * 支持的所有语言
     */
    supportLanguages: {
        en: Language;
        'zh-Hans': Language;
    };
    /**
     * ## 工作区配置
     *
     * > 需要注意的是，部分配置不在`BlocklyOptions`中，所以加了个 Record<string, unknown>
     */
    workspaceConfig: Blockly.BlocklyOptions | Record<string, unknown>;
    /**
     * VM自身
     * 额，我们需要在Block中使用VM的其它功能
     */
    vm: IVM;
    /**
     * 设置一个语言
     * @param lang ASH 兼容的 i18n
     */
    setLanguage(lang: 'en' | 'zh-Hans'): void;
    /**
     * 销毁工作区
     *
     * @returns 是否销毁成功
     */
    dispose(): boolean;
    /**
     * 创建一个工作区
     *
     * @param restore 是否重置，若为 `false` 则若已初始化则不重置
     * @returns 是否创建成功
     */
    createWorkspace(DOM: HTMLDivElement, restart?: boolean): Promise<boolean>;
    /**
     * 重启工作区
     */
    restartWorkspace(): Promise<void>;
    /**
     * 延迟释放工作区（供 React 组件 cleanup 调用）
     */
    scheduleDispose(): void;
    /**
     * 取消 scheduleDispose 调度的释放
     */
    cancelScheduledDispose(): void;
    /**
     * 初始化 Blockly，载入插件什么的
     */
    init(): Promise<void>;
    /**
     * 刷新工作区的大小
     */
    refreshBlocklySize(): void;
}

// 设置吸附半径，48来自源码
// -> ScratchBlocks.SNAP_RADIUS
// <- 48
export const SNAP_RADIUS = 48;

/** 在VM存储的自定义函数 */
export interface IFunctionReference {
    targetId: string;
    functionId: string;
}

export interface ICustomFunction {
    body: TPreviewFunctionData[];
    color: IBlockColor;
    id: string;
    /** 是否显示为可传递的函数值；false 时显示为 Scratch 式积木。 */
    isValue: boolean;
    /** 返回类型；'none'（AllCheckers.NONE）表示无返回值，null 表示未知。 */
    returnType?: TFunctionReturnType;
}

export const AllCheckers = {
    FUNCTION: 'Function',
    STRING: 'String',
    ARRAY: 'Array',
    NUMBER: 'Number',
    OBJECT: 'Object',
    COLOUR: 'Colour',
    BOOLEAN: 'Boolean',
    ANY: null,
    /** 没有检查，这用于检测函数是否是“无返回值” */
    NONE: 'none',
} as const;
export type TAllCheckers = (typeof AllCheckers)[keyof typeof AllCheckers];
