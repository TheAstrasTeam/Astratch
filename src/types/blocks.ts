import * as Blockly from 'blockly';

const OPCODE = {
    // 运动
    motion_movesteps: 'motion_movesteps',
    motion_gotoxy: 'motion_gotoxy',
    motion_goto: 'motion_goto',
    motion_goto_menu: 'motion_goto_menu',
    motion_turnright: 'motion_turnright',
    motion_turnleft: 'motion_turnleft',
    motion_pointindirection: 'motion_pointindirection',
    motion_pointtowards: 'motion_pointtowards',
    motion_pointtowards_menu: 'motion_pointtowards_menu',
    motion_direction_menu: 'motion_direction_menu',
    motion_glidesecstoxy: 'motion_glidesecstoxy',
    motion_glideto: 'motion_glideto',
    motion_glideto_menu: 'motion_glideto_menu',
    motion_ifonedgebounce: 'motion_ifonedgebounce',
    motion_setrotationstyle: 'motion_setrotationstyle',
    motion_changexby: 'motion_changexby',
    motion_setx: 'motion_setx',
    motion_changeyby: 'motion_changeyby',
    motion_sety: 'motion_sety',
    motion_xposition: 'motion_xposition',
    motion_yposition: 'motion_yposition',
    motion_direction: 'motion_direction',
    motion_scroll_right: 'motion_scroll_right',
    motion_scroll_up: 'motion_scroll_up',
    motion_align_scene: 'motion_align_scene',
    motion_xscroll: 'motion_xscroll',
    motion_yscroll: 'motion_yscroll',

    // 外观
    looks_say: 'looks_say',
    looks_sayforsecs: 'looks_sayforsecs',
    looks_think: 'looks_think',
    looks_thinkforsecs: 'looks_thinkforsecs',
    looks_show: 'looks_show',
    looks_hide: 'looks_hide',
    looks_hideallsprites: 'looks_hideallsprites',
    looks_switchcostumeto: 'looks_switchcostumeto',
    looks_switchbackdropto: 'looks_switchbackdropto',
    looks_switchbackdroptoandwait: 'looks_switchbackdroptoandwait',
    looks_nextcostume: 'looks_nextcostume',
    looks_nextbackdrop: 'looks_nextbackdrop',
    looks_changeeffectby: 'looks_changeeffectby',
    looks_seteffectto: 'looks_seteffectto',
    looks_cleargraphiceffects: 'looks_cleargraphiceffects',
    looks_changesizeby: 'looks_changesizeby',
    looks_setsizeto: 'looks_setsizeto',
    looks_changestretchby: 'looks_changestretchby',
    looks_setstretchto: 'looks_setstretchto',
    looks_gotofrontback: 'looks_gotofrontback',
    looks_goforwardbackwardlayers: 'looks_goforwardbackwardlayers',
    looks_size: 'looks_size',
    looks_costumenumbername: 'looks_costumenumbername',
    looks_backdropnumbername: 'looks_backdropnumbername',
    looks_costume: 'looks_costume',
    looks_backdrops: 'looks_backdrops',

    // 声音
    sound_play: 'sound_play',
    sound_playuntildone: 'sound_playuntildone',
    sound_stopallsounds: 'sound_stopallsounds',
    sound_seteffectto: 'sound_seteffectto',
    sound_changeeffectby: 'sound_changeeffectby',
    sound_cleareffects: 'sound_cleareffects',
    sound_sounds_menu: 'sound_sounds_menu',
    sound_beats_menu: 'sound_beats_menu',
    sound_effects_menu: 'sound_effects_menu',
    sound_setvolumeto: 'sound_setvolumeto',
    sound_changevolumeby: 'sound_changevolumeby',
    sound_volume: 'sound_volume',

    // 事件
    event_whentouchingobject: 'event_whentouchingobject',
    event_broadcast: 'event_broadcast',
    event_broadcastandwait: 'event_broadcastandwait',
    event_whengreaterthan: 'event_whengreaterthan',
    event_whenflagclicked: 'event_whenflagclicked',
    event_whenkeypressed: 'event_whenkeypressed',
    event_whenthisspriteclicked: 'event_whenthisspriteclicked',
    event_whenstageclicked: 'event_whenstageclicked',
    event_whenbackdropswitchesto: 'event_whenbackdropswitchesto',
    event_whenbroadcastreceived: 'event_whenbroadcastreceived',
    event_broadcast_menu: 'event_broadcast_menu',
    event_touchingobjectmenu: 'event_touchingobjectmenu',

    // 控制
    control_repeat: 'control_repeat',
    control_repeat_until: 'control_repeat_until',
    control_while: 'control_while',
    control_for_each: 'control_for_each',
    control_forever: 'control_forever',
    control_wait: 'control_wait',
    control_wait_until: 'control_wait_until',
    control_if: 'control_if',
    control_if_else: 'control_if_else',
    control_stop: 'control_stop',
    control_create_clone_of: 'control_create_clone_of',
    control_delete_this_clone: 'control_delete_this_clone',
    control_get_counter: 'control_get_counter',
    control_incr_counter: 'control_incr_counter',
    control_clear_counter: 'control_clear_counter',
    control_all_at_once: 'control_all_at_once',
    control_start_as_clone: 'control_start_as_clone',
    control_create_clone_of_menu: 'control_create_clone_of_menu',

    // 侦测
    sensing_touchingobject: 'sensing_touchingobject',
    sensing_touchingobjectmenu: 'sensing_touchingobjectmenu',
    sensing_touchingcolor: 'sensing_touchingcolor',
    sensing_coloristouchingcolor: 'sensing_coloristouchingcolor',
    sensing_distanceto: 'sensing_distanceto',
    sensing_distancetomenu: 'sensing_distancetomenu',
    sensing_timer: 'sensing_timer',
    sensing_resettimer: 'sensing_resettimer',
    sensing_of: 'sensing_of',
    sensing_of_object_menu: 'sensing_of_object_menu',
    sensing_mousex: 'sensing_mousex',
    sensing_mousey: 'sensing_mousey',
    sensing_setdragmode: 'sensing_setdragmode',
    sensing_mousedown: 'sensing_mousedown',
    sensing_keypressed: 'sensing_keypressed',
    sensing_keyoptions: 'sensing_keyoptions',
    sensing_current: 'sensing_current',
    sensing_dayssince2000: 'sensing_dayssince2000',
    sensing_loudness: 'sensing_loudness',
    sensing_loud: 'sensing_loud',
    sensing_askandwait: 'sensing_askandwait',
    sensing_answer: 'sensing_answer',
    sensing_username: 'sensing_username',
    sensing_userid: 'sensing_userid',
    sensing_online: 'sensing_online',

    // 运算
    operator_add: 'operator_add',
    operator_subtract: 'operator_subtract',
    operator_multiply: 'operator_multiply',
    operator_divide: 'operator_divide',
    operator_lt: 'operator_lt',
    operator_equals: 'operator_equals',
    operator_gt: 'operator_gt',
    operator_and: 'operator_and',
    operator_or: 'operator_or',
    operator_not: 'operator_not',
    operator_random: 'operator_random',
    operator_join: 'operator_join',
    operator_letter_of: 'operator_letter_of',
    operator_length: 'operator_length',
    operator_contains: 'operator_contains',
    operator_mod: 'operator_mod',
    operator_round: 'operator_round',
    operator_mathop: 'operator_mathop',

    // 变量
    data_variable: 'data_variable',
    data_setvariableto: 'data_setvariableto',
    data_changevariableby: 'data_changevariableby',
    data_hidevariable: 'data_hidevariable',
    data_showvariable: 'data_showvariable',
    data_listcontents: 'data_listcontents',
    data_addtolist: 'data_addtolist',
    data_deleteoflist: 'data_deleteoflist',
    data_deletealloflist: 'data_deletealloflist',
    data_insertatlist: 'data_insertatlist',
    data_replaceitemoflist: 'data_replaceitemoflist',
    data_itemoflist: 'data_itemoflist',
    data_itemnumoflist: 'data_itemnumoflist',
    data_lengthoflist: 'data_lengthoflist',
    data_listcontainsitem: 'data_listcontainsitem',
    data_hidelist: 'data_hidelist',
    data_showlist: 'data_showlist',
    data_listindexall: 'data_listindexall',
    data_listindexrandom: 'data_listindexrandom',

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
} as const;

type TOpcodeValue = (typeof OPCODE)[keyof typeof OPCODE];

const BlocksColor = {
    motion: {
        primary: '#4C97FF',
        secondary: '#4280D7',
        tertiary: '#3373CC',
        quaternary: '#3373CC',
    },
    looks: {
        primary: '#9966FF',
        secondary: '#855CD6',
        tertiary: '#774DCB',
        quaternary: '#774DCB',
    },
    sounds: {
        primary: '#CF63CF',
        secondary: '#C94FC9',
        tertiary: '#BD42BD',
        quaternary: '#BD42BD',
    },
    control: {
        primary: '#FFAB19',
        secondary: '#EC9C13',
        tertiary: '#CF8B17',
        quaternary: '#CF8B17',
    },
    event: {
        primary: '#FFBF00',
        secondary: '#E6AC00',
        tertiary: '#CC9900',
        quaternary: '#CC9900',
    },
    sensing: {
        primary: '#5CB1D6',
        secondary: '#47A8D1',
        tertiary: '#2E8EB8',
        quaternary: '#2E8EB8',
    },
    pen: {
        primary: '#0fBD8C',
        secondary: '#0DA57A',
        tertiary: '#0B8E69',
        quaternary: '#0B8E69',
    },
    operators: {
        primary: '#59C059',
        secondary: '#46B946',
        tertiary: '#389438',
        quaternary: '#389438',
    },
    data: {
        primary: '#FF8C1A',
        secondary: '#FF8000',
        tertiary: '#DB6E00',
        quaternary: '#DB6E00',
    },
    // This is not a new category, but rather for differentiation
    // between lists and scalar variables.
    data_lists: {
        primary: '#FF661A',
        secondary: '#FF5500',
        tertiary: '#E64D00',
        quaternary: '#E64D00',
    },
    more: {
        primary: '#FF6680',
        secondary: '#FF4D6A',
        tertiary: '#FF3355',
        quaternary: '#FF3355',
    },
    addons: {
        primary: '#29beb8',
        secondary: '#3aa8a4',
        tertiary: '#3aa8a4',
        quaternary: '#3aa8a4',
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

export { OPCODE, BlocksColor };

export type Language = { [key: string]: string };

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
     * 设置一个语言
     * @param lang AEN 兼容的 i18n
     */
    setLanguage: (lang: 'en' | 'zh-Hans') => void;
    /**
     * 销毁工作区
     *
     * @returns 是否销毁成功
     */
    dispose: () => boolean;
    /**
     * 创建一个工作区
     *
     * @returns 是否创建成功
     */
    createWorkspace: (DOM: HTMLDivElement) => Promise<boolean>;
    /**
     * 重启工作区
     */
    restartWorkspace: () => void;
    /**
     * 初始化 Blockly，载入插件什么的
     */
    init: () => Promise<void>;
}
