import { t } from 'i18next';
import * as Blockly from 'blockly/core';
import { BlocksColor, OPCODE } from '../../types/blocks';


/**
 * 对于链接积木的配置项
 */
const connections = {
    nextStatement: 'Action',
    previousStatement: 'Action',
    inputsInline: true,
} as const;

/**
 * 帽子积木配置项
 */
const hatConnections = {
    nextStatement: 'Action',
    hat: 'cap',
} as const;

/**
 * 结束积木配置项
 */
const endConnections = {
    previousStatement: 'Action',
} as const;

/**
 * 对于返回值
 */
const returnConnections = {
    inputsInline: true,
} as const;

const initBlocks = (blockly: typeof Blockly) => {
    try {
        // 源代码所示，Blockly的注册积木仅会加入到 Map 中，
        // 因此可以直接删除
        const blockTypes = Object.keys(blockly.Blocks);
        blockTypes.forEach(type => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete blockly.Blocks[type];
        });
    } catch {
        // 不需要管
    }

    // 事实上对于如下的`message0`在blockly都是无效的
    // i18next 不支持在消息id中填入空格
    // 对于实际上的名称需要参考 i18n/locales/*/blocks.json

    blockly.common.defineBlocksWithJsonArray([
        {
            type: OPCODE.math_number,
            colour: BlocksColor.textField,
            output: 'Number',
            message0: '%1',
            args0: [{ type: 'field_number', name: 'NUM', value: 0 }],
        },
        {
            type: OPCODE.math_integer,
            colour: BlocksColor.textField,
            output: 'Number',
            message0: '%1',
            args0: [{ type: 'field_number', name: 'NUM', precision: 1 }],
        },
        {
            type: OPCODE.math_whole_number,
            colour: BlocksColor.textField,
            output: 'Number',
            message0: '%1',
            args0: [{ type: 'field_number', name: 'NUM', min: 0, precision: 1 }],
        },
        {
            type: OPCODE.math_positive_number,
            colour: BlocksColor.textField,
            output: 'Number',
            message0: '%1',
            args0: [{ type: 'field_number', name: 'NUM', min: 0 }],
        },
        {
            type: OPCODE.math_angle,
            colour: BlocksColor.textField,
            output: 'Number',
            message0: '%1',
            args0: [{ type: 'field_angle', name: 'NUM', value: 90 }],
        },
        {
            type: OPCODE.text,
            colour: BlocksColor.textField,
            output: 'String',
            message0: '%1',
            args0: [{ type: 'field_input', name: 'TEXT' }],
        },
        {
            type: OPCODE.colour_picker,
            colour: BlocksColor.textField,
            output: 'String',
            message0: '%1',
            args0: [{ type: 'field_colour', name: 'COLOUR', colour: '#ff0000' }],
        },

        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_POSITION_MOVESTEP,
            colour: BlocksColor.position.primary,
            message0: t('blocks:entity.transform.position.moveStep'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_POSITION_SETPOSITION,
            colour: BlocksColor.position.primary,
            message0: t('blocks:entity.transform.position.setPosition'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_POSITION_ADDPOSITION,
            colour: BlocksColor.position.primary,
            message0: t('blocks:entity.transform.position.addPosition'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_POSITION_GETPOSITION,
            colour: BlocksColor.position.primary,
            message0: t('blocks:entity.transform.position.getPosition'),
        },

        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_SCALE_SETSCALE,
            colour: BlocksColor.scale.primary,
            message0: t('blocks:entity.transform.scale.setScale'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_SCALE_ADDSCALE,
            colour: BlocksColor.scale.primary,
            message0: t('blocks:entity.transform.scale.addScale'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_SCALE_GETSCALE,
            colour: BlocksColor.scale.primary,
            message0: t('blocks:entity.transform.scale.getScale'),
        },

        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_DIRECTION_SETDIRECTION,
            colour: BlocksColor.direction.primary,
            message0: t('blocks:entity.transform.direction.setDirection'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_DIRECTION_ADDDIRECTION,
            colour: BlocksColor.direction.primary,
            message0: t('blocks:entity.transform.direction.addDirection'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_DIRECTION_FACEDIRECTION,
            colour: BlocksColor.direction.primary,
            message0: t('blocks:entity.transform.direction.faceDirection'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_DIRECTION_GETDIRECTION,
            colour: BlocksColor.direction.primary,
            message0: t('blocks:entity.transform.direction.getDirection'),
        },

        // - - 图层
        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_LAYER_SETLAYER,
            colour: BlocksColor.layer.primary,
            message0: t('blocks:entity.transform.layer.setLayer'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_LAYER_MOVELAYER,
            colour: BlocksColor.layer.primary,
            message0: t('blocks:entity.transform.layer.moveLayer'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_TRANSFORM_LAYER_GETLAYER,
            colour: BlocksColor.layer.primary,
            message0: t('blocks:entity.transform.layer.getLayer'),
        },

        // - 外观
        // - - 图像
        {
            ...connections,
            type: OPCODE.ENTITY_APPEARANCE_IMAGES_SHOWIMAGE,
            colour: BlocksColor.Images.primary,
            message0: t('blocks:entity.appearance.images.showImage'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_APPEARANCE_IMAGES_SETSTRETCH,
            colour: BlocksColor.Images.primary,
            message0: t('blocks:entity.appearance.images.setStretch'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_APPEARANCE_IMAGES_ADDSTRETCH,
            colour: BlocksColor.Images.primary,
            message0: t('blocks:entity.appearance.images.addStretch'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_APPEARANCE_IMAGES_GETSTRETCH,
            colour: BlocksColor.Images.primary,
            message0: t('blocks:entity.appearance.images.getStretch'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_APPEARANCE_IMAGES_SETGRID,
            colour: BlocksColor.Images.primary,
            message0: t('blocks:entity.appearance.images.setGrid'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_APPEARANCE_IMAGES_SETGRIDDISTANCE,
            colour: BlocksColor.Images.primary,
            message0: t('blocks:entity.appearance.images.setGridDistance'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_APPEARANCE_IMAGES_GETGRID,
            colour: BlocksColor.Images.primary,
            message0: t('blocks:entity.appearance.images.getGrid'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_APPEARANCE_IMAGES_GETGRIDDISTANCE,
            colour: BlocksColor.Images.primary,
            message0: t('blocks:entity.appearance.images.getGridDistance'),
        },
        // - - 特效
        {
            ...connections,
            type: OPCODE.ENTITY_APPEARANCE_EFFECTS_SETEFFECT,
            colour: BlocksColor.effects.primary,
            message0: t('blocks:entity.appearance.effects.setEffect'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_APPEARANCE_EFFECTS_ADDEFFECT,
            colour: BlocksColor.effects.primary,
            message0: t('blocks:entity.appearance.effects.addEffect'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_APPEARANCE_EFFECTS_GETEFFECT,
            colour: BlocksColor.effects.primary,
            message0: t('blocks:entity.appearance.effects.getEffect'),
        },
        // - 碰撞
        {
            ...connections,
            type: OPCODE.ENTITY_COLLISION_ISTOUCHING,
            colour: BlocksColor.collision.primary,
            message0: t('blocks:entity.collision.isTouching'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_COLLISION_WHENTOUCHING,
            colour: BlocksColor.collision.primary,
            message0: t('blocks:entity.collision.whenTouching'),
        },

        // - 生命周期
        {
            ...hatConnections,
            type: OPCODE.ENTITY_LIFECYCLE_ONCREATED,
            colour: BlocksColor.lifecycle.primary,
            message0: t('blocks:entity.lifecycle.onCreated'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_LIFECYCLE_CLONE,
            colour: BlocksColor.lifecycle.primary,
            message0: t('blocks:entity.lifecycle.clone'),
        },
        {
            ...connections,
            type: OPCODE.ENTITY_LIFECYCLE_DELETECLONE,
            colour: BlocksColor.lifecycle.primary,
            message0: t('blocks:entity.lifecycle.deleteClone'),
        },

        // 音频
        // - 播放
        {
            ...connections,
            type: OPCODE.AUDIO_PLAY_PLAY,
            colour: BlocksColor.audio.primary,
            message0: t('blocks:audio.play.play'),
        },
        {
            ...connections,
            type: OPCODE.AUDIO_PLAY_CONTROL,
            colour: BlocksColor.audio.primary,
            message0: t('blocks:audio.play.control'),
        },
        {
            ...connections,
            type: OPCODE.AUDIO_PLAY_SETTIME,
            colour: BlocksColor.audio.primary,
            message0: t('blocks:audio.play.setTime'),
        },
        {
            ...connections,
            type: OPCODE.AUDIO_PLAY_CONTROLALL,
            colour: BlocksColor.audio.primary,
            message0: t('blocks:audio.play.controlAll'),
        },
        {
            ...connections,
            type: OPCODE.AUDIO_PLAY_GETALLIDS,
            colour: BlocksColor.audio.primary,
            message0: t('blocks:audio.play.getAllIds'),
        },
        {
            ...connections,
            type: OPCODE.AUDIO_PLAY_GETINFO,
            colour: BlocksColor.audio.primary,
            message0: t('blocks:audio.play.getInfo'),
        },
        // - 特效
        {
            ...connections,
            type: OPCODE.AUDIO_EFFECTS_SETEFFECT,
            colour: BlocksColor.audio.secondary,
            message0: t('blocks:audio.effects.setEffect'),
        },
        {
            ...connections,
            type: OPCODE.AUDIO_EFFECTS_ADDEFFECT,
            colour: BlocksColor.audio.secondary,
            message0: t('blocks:audio.effects.addEffect'),
        },
        {
            ...connections,
            type: OPCODE.AUDIO_EFFECTS_RESETEFFECT,
            colour: BlocksColor.audio.secondary,
            message0: t('blocks:audio.effects.resetEffect'),
        },
        {
            ...connections,
            type: OPCODE.AUDIO_EFFECTS_RESETALLEFFECTS,
            colour: BlocksColor.audio.secondary,
            message0: t('blocks:audio.effects.resetAllEffects'),
        },
        {
            ...connections,
            type: OPCODE.AUDIO_EFFECTS_RESETEFFECTALL,
            colour: BlocksColor.audio.secondary,
            message0: t('blocks:audio.effects.resetEffectAll'),
        },
        {
            ...connections,
            type: OPCODE.AUDIO_EFFECTS_RESETALLEFFECTSALL,
            colour: BlocksColor.audio.secondary,
            message0: t('blocks:audio.effects.resetAllEffectsAll'),
        },
        {
            ...connections,
            type: OPCODE.AUDIO_EFFECTS_GETEFFECT,
            colour: BlocksColor.audio.secondary,
            message0: t('blocks:audio.effects.getEffect'),
        },

        // 资源
        {
            ...connections,
            type: OPCODE.RESOURCES_ADDFROMURL,
            colour: BlocksColor.resources.primary,
            message0: t('blocks:resources.addFromUrl'),
        },
        {
            ...connections,
            type: OPCODE.RESOURCES_GET,
            colour: BlocksColor.resources.primary,
            message0: t('blocks:resources.get'),
        },
        {
            ...connections,
            type: OPCODE.RESOURCES_EXISTS,
            colour: BlocksColor.resources.primary,
            message0: t('blocks:resources.exists'),
        },
        {
            ...connections,
            type: OPCODE.RESOURCES_RENAME,
            colour: BlocksColor.resources.primary,
            message0: t('blocks:resources.rename'),
        },
        {
            ...connections,
            type: OPCODE.RESOURCES_DELETE,
            colour: BlocksColor.resources.primary,
            message0: t('blocks:resources.delete'),
        },

        // 事件
        // - 广播
        {
            ...connections,
            type: OPCODE.EVENT_BROADCAST_SEND,
            colour: BlocksColor.event.primary,
            message0: t('blocks:event.broadcast.send'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_BROADCAST_LISTEN,
            colour: BlocksColor.event.secondary,
            message0: t('blocks:event.broadcast.listen'),
        },
        // - 生命周期
        {
            ...connections,
            type: OPCODE.EVENT_LIFECYCLE_ONSTART,
            colour: BlocksColor.event.primary,
            message0: t('blocks:event.lifecycle.onStart'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_LIFECYCLE_ONSTOP,
            colour: BlocksColor.event.primary,
            message0: t('blocks:event.lifecycle.onStop'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_LIFECYCLE_ONRUNNINGFORMS,
            colour: BlocksColor.event.primary,
            message0: t('blocks:event.lifecycle.onRunningForMs'),
        },
        // - 时间
        {
            ...connections,
            type: OPCODE.EVENT_TIME_RUNNINGDURATION,
            colour: BlocksColor.event.secondary,
            message0: t('blocks:event.time.runningDuration'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_TIME_CREATETIMER,
            colour: BlocksColor.event.secondary,
            message0: t('blocks:event.time.createTimer'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_TIME_RESETTIMER,
            colour: BlocksColor.event.secondary,
            message0: t('blocks:event.time.resetTimer'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_TIME_DELETETIMER,
            colour: BlocksColor.event.secondary,
            message0: t('blocks:event.time.deleteTimer'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_TIME_TIMERVALUE,
            colour: BlocksColor.event.secondary,
            message0: t('blocks:event.time.timerValue'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_TIME_WHENTIMEREXCEEDS,
            colour: BlocksColor.event.secondary,
            message0: t('blocks:event.time.whenTimerExceeds'),
        },
        // - 输入
        {
            ...connections,
            type: OPCODE.EVENT_INPUT_GETMOUSEPOSITION,
            colour: BlocksColor.event.tertiary,
            message0: t('blocks:event.input.getMousePosition'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_INPUT_ISMOUSETOUCHING,
            colour: BlocksColor.event.tertiary,
            message0: t('blocks:event.input.isMouseTouching'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_INPUT_ISKEYPRESSED,
            colour: BlocksColor.event.tertiary,
            message0: t('blocks:event.input.isKeyPressed'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_INPUT_GETLASTKEYPRESSED,
            colour: BlocksColor.event.tertiary,
            message0: t('blocks:event.input.getLastKeyPressed'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_INPUT_GETLOUDNESS,
            colour: BlocksColor.event.tertiary,
            message0: t('blocks:event.input.getLoudness'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_INPUT_GETFREQUENCYSPECTRUM,
            colour: BlocksColor.event.tertiary,
            message0: t('blocks:event.input.getFrequencySpectrum'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_INPUT_WHENMOUSEHOVER,
            colour: BlocksColor.event.tertiary,
            message0: t('blocks:event.input.whenMouseHover'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_INPUT_WHENMOUSEMOVED,
            colour: BlocksColor.event.tertiary,
            message0: t('blocks:event.input.whenMouseMoved'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_INPUT_WHENMOUSEBUTTON,
            colour: BlocksColor.event.tertiary,
            message0: t('blocks:event.input.whenMouseButton'),
        },
        {
            ...connections,
            type: OPCODE.EVENT_INPUT_WHENKEYPRESSED,
            colour: BlocksColor.event.tertiary,
            message0: t('blocks:event.input.whenKeyPressed'),
        },

        // 控制
        // - 流程
        {
            ...connections,
            type: OPCODE.CONTROL_FLOW_WAIT,
            colour: BlocksColor.control.primary,
            message0: t('blocks:control.flow.wait'),
        },
        {
            ...connections,
            type: OPCODE.CONTROL_FLOW_WAITUNTIL,
            colour: BlocksColor.control.primary,
            message0: t('blocks:control.flow.waitUntil'),
        },
        {
            ...connections,
            type: OPCODE.CONTROL_FLOW_BREAK,
            colour: BlocksColor.control.primary,
            message0: t('blocks:control.flow.break'),
        },
        {
            ...connections,
            type: OPCODE.CONTROL_FLOW_STOPSCRIPT,
            colour: BlocksColor.control.primary,
            message0: t('blocks:control.flow.stopScript'),
        },
        {
            ...connections,
            type: OPCODE.CONTROL_FLOW_STOPPROJECT,
            colour: BlocksColor.control.primary,
            message0: t('blocks:control.flow.stopProject'),
        },
        // - 条件
        {
            ...connections,
            type: OPCODE.CONTROL_CONDITION_IF,
            colour: BlocksColor.control.secondary,
            message0: t('blocks:control.condition.if'),
        },
        // - 循环
        {
            ...connections,
            type: OPCODE.CONTROL_LOOP_WHILE,
            colour: BlocksColor.control.tertiary,
            message0: t('blocks:control.loop.while'),
        },
        {
            ...connections,
            type: OPCODE.CONTROL_LOOP_REPEAT,
            colour: BlocksColor.control.tertiary,
            message0: t('blocks:control.loop.repeat'),
        },
        {
            ...connections,
            type: OPCODE.CONTROL_LOOP_FOREACH,
            colour: BlocksColor.control.tertiary,
            message0: t('blocks:control.loop.forEach'),
        },
        // - 匹配
        {
            ...connections,
            type: OPCODE.CONTROL_MATCH_MATCH,
            colour: BlocksColor.control.secondary,
            message0: t('blocks:control.match.match'),
        },
        {
            ...connections,
            type: OPCODE.CONTROL_MATCH_CASE,
            colour: BlocksColor.control.secondary,
            message0: t('blocks:control.match.case'),
        },
        {
            ...connections,
            type: OPCODE.CONTROL_MATCH_DEFAULT,
            colour: BlocksColor.control.secondary,
            message0: t('blocks:control.match.default'),
        },

        // 运算
        // - 数学
        {
            ...connections,
            type: OPCODE.OPERATOR_MATH_OP,
            colour: BlocksColor.operator.primary,
            message0: t('blocks:operator.math.op'),
        },
        {
            ...connections,
            type: OPCODE.OPERATOR_MATH_RANDOM,
            colour: BlocksColor.operator.primary,
            message0: t('blocks:operator.math.random'),
        },
        // - 逻辑
        {
            ...connections,
            type: OPCODE.OPERATOR_LOGIC_COMPARE,
            colour: BlocksColor.operator.secondary,
            message0: t('blocks:operator.logic.compare'),
        },
        {
            ...connections,
            type: OPCODE.OPERATOR_LOGIC_NOT,
            colour: BlocksColor.operator.secondary,
            message0: t('blocks:operator.logic.not'),
        },
        {
            ...connections,
            type: OPCODE.OPERATOR_LOGIC_BOOLEAN,
            colour: BlocksColor.operator.secondary,
            message0: t('blocks:operator.logic.boolean'),
        },
        // - 科学
        {
            ...connections,
            type: OPCODE.OPERATOR_SCIENTIFIC_FUNC,
            colour: BlocksColor.operator.tertiary,
            message0: t('blocks:operator.scientific.func'),
        },

        // 数据
        // - 变量
        {
            ...connections,
            type: OPCODE.DATA_VARIABLE_SET,
            colour: BlocksColor.data.primary,
            message0: t('blocks:data.variable.set'),
        },
        {
            ...connections,
            type: OPCODE.DATA_VARIABLE_ADD,
            colour: BlocksColor.data.primary,
            message0: t('blocks:data.variable.add'),
        },
        {
            ...connections,
            type: OPCODE.DATA_VARIABLE_COMPUTE,
            colour: BlocksColor.data.primary,
            message0: t('blocks:data.variable.compute'),
        },
        // - 字符串
        {
            ...connections,
            type: OPCODE.DATA_STRING_JOIN,
            colour: BlocksColor.data.secondary,
            message0: t('blocks:data.string.join'),
        },
        {
            ...connections,
            type: OPCODE.DATA_STRING_SPLIT,
            colour: BlocksColor.data.secondary,
            message0: t('blocks:data.string.split'),
        },
        {
            ...connections,
            type: OPCODE.DATA_STRING_SUBSTRING,
            colour: BlocksColor.data.secondary,
            message0: t('blocks:data.string.substring'),
        },
        {
            ...connections,
            type: OPCODE.DATA_STRING_LENGTH,
            colour: BlocksColor.data.secondary,
            message0: t('blocks:data.string.length'),
        },
        // - 数组
        {
            ...connections,
            type: OPCODE.DATA_ARRAY_EMPTY,
            colour: BlocksColor.data.tertiary,
            message0: t('blocks:data.array.empty'),
        },
        {
            ...connections,
            type: OPCODE.DATA_ARRAY_PUSH,
            colour: BlocksColor.data.tertiary,
            message0: t('blocks:data.array.push'),
        },
        {
            ...connections,
            type: OPCODE.DATA_ARRAY_REMOVEAT,
            colour: BlocksColor.data.tertiary,
            message0: t('blocks:data.array.removeAt'),
        },
        {
            ...connections,
            type: OPCODE.DATA_ARRAY_REMOVEENDS,
            colour: BlocksColor.data.tertiary,
            message0: t('blocks:data.array.removeEnds'),
        },
        {
            ...connections,
            type: OPCODE.DATA_ARRAY_GET,
            colour: BlocksColor.data.tertiary,
            message0: t('blocks:data.array.get'),
        },
        {
            ...connections,
            type: OPCODE.DATA_ARRAY_LENGTH,
            colour: BlocksColor.data.tertiary,
            message0: t('blocks:data.array.length'),
        },
        {
            ...connections,
            type: OPCODE.DATA_ARRAY_FILTER,
            colour: BlocksColor.data.tertiary,
            message0: t('blocks:data.array.filter'),
        },
        {
            ...connections,
            type: OPCODE.DATA_ARRAY_INDEXOF,
            colour: BlocksColor.data.tertiary,
            message0: t('blocks:data.array.indexOf'),
        },
        // - 对象
        {
            ...connections,
            type: OPCODE.DATA_OBJECT_EMPTY,
            colour: BlocksColor.data.secondary,
            message0: t('blocks:data.object.empty'),
        },
        {
            ...connections,
            type: OPCODE.DATA_OBJECT_SET,
            colour: BlocksColor.data.secondary,
            message0: t('blocks:data.object.set'),
        },
        {
            ...connections,
            type: OPCODE.DATA_OBJECT_DELETE,
            colour: BlocksColor.data.secondary,
            message0: t('blocks:data.object.delete'),
        },
        {
            ...connections,
            type: OPCODE.DATA_OBJECT_GETALL,
            colour: BlocksColor.data.secondary,
            message0: t('blocks:data.object.getAll'),
        },
        {
            ...connections,
            type: OPCODE.DATA_OBJECT_GET,
            colour: BlocksColor.data.secondary,
            message0: t('blocks:data.object.get'),
        },
        {
            ...connections,
            type: OPCODE.DATA_OBJECT_LENGTH,
            colour: BlocksColor.data.secondary,
            message0: t('blocks:data.object.length'),
        },
        // - 类型
        {
            ...connections,
            type: OPCODE.DATA_TYPE_TYPEOF,
            colour: BlocksColor.data.tertiary,
            message0: t('blocks:data.type.typeof'),
        },
        {
            ...connections,
            type: OPCODE.DATA_TYPE_CAST,
            colour: BlocksColor.data.tertiary,
            message0: t('blocks:data.type.cast'),
        },

        // 函数
        {
            ...connections,
            type: OPCODE.FUNCTION_DEFINITION,
            colour: BlocksColor.function.primary,
            message0: t('blocks:function.definition'),
        },
        {
            ...connections,
            type: OPCODE.FUNCTION_CALL,
            colour: BlocksColor.function.primary,
            message0: t('blocks:function.call'),
        },
        {
            ...connections,
            type: OPCODE.FUNCTION_EXECUTE,
            colour: BlocksColor.function.secondary,
            message0: t('blocks:function.execute'),
        },
        {
            ...connections,
            type: OPCODE.FUNCTION_RETURN,
            colour: BlocksColor.function.primary,
            message0: t('blocks:function.return'),
        },
        {
            ...connections,
            type: OPCODE.FUNCTION_INLINE,
            colour: BlocksColor.function.primary,
            message0: t('blocks:function.inline'),
        },
        {
            ...connections,
            type: OPCODE.FUNCTION_RUNBRANCH,
            colour: BlocksColor.function.primary,
            message0: t('blocks:function.runBranch'),
        },
        {
            ...connections,
            type: OPCODE.FUNCTION_SETDATAVALUE,
            colour: BlocksColor.function.primary,
            message0: t('blocks:function.setDataValue'),
        },

        // 调试
        {
            ...connections,
            type: OPCODE.DEBUG_LOG,
            colour: BlocksColor.debug.primary,
            message0: t('blocks:debug.log'),
        },
        {
            ...connections,
            type: OPCODE.DEBUG_CRASH,
            colour: BlocksColor.debug.primary,
            message0: t('blocks:debug.crash'),
        },
        {
            ...connections,
            type: OPCODE.DEBUG_BREAKPOINT,
            colour: BlocksColor.debug.primary,
            message0: t('blocks:debug.breakpoint'),
        },
    ]);
};
export { initBlocks, connections, hatConnections, endConnections };
