import { t } from 'i18next';
import type * as Blockly from 'blockly/core';
import { BlocksColor, OPCODE } from '../../types/blocks';

import turnLeft from './images/turnLeft.svg';
import turnRight from './images/turnRight.svg';
import { dropdownWithInput } from './plugins/fieldDropdown';

/**
 * 对于链接积木的配置项
 */
const connections = {
    nextStatement: 'Action',
    previousStatement: 'Action',
} as const;

const initBlocks = (blockly: typeof Blockly) => {
    try {
        // 源代码所示，Blockly的注册积木仅会加入到 Map 中，
        // 因此可以直接删除
        const blockTypes = Object.keys(blockly.Blocks);
        blockTypes.forEach(type => {
            delete blockly.Blocks[type];
        });
    } catch {
        // 不需要管
    }

    
    blockly.fieldRegistry.register('field_dropdown_with_block', dropdownWithInput);

    // 事实上对于如下的`message0`在blockly都是无效的
    // i18next 不支持在消息id中填入空格
    // 对于实际上的名称需要参考 i18n/locales/*/blocks.json

    blockly.common.defineBlocksWithJsonArray([
        {
            ...connections,
            type: OPCODE.motion_movesteps,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:move%1steps'),
            args0: [
                {
                    type: 'field_number',
                    name: 'VALUE',
                    value: 10,
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.motion_turnright,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:turn%1%2degrees'),
            args0: [
                {
                    type: 'field_image',
                    src: turnRight,
                    width: 30,
                    height: 30,
                    alt: t('block:turn right'),
                },
                {
                    type: 'field_number',
                    name: 'VALUE',
                    value: 15,
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.motion_turnleft,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:turn%1%2degrees'),
            args0: [
                {
                    type: 'field_image',
                    src: turnLeft,
                    width: 30,
                    height: 30,
                    alt: t('block:turn left'),
                },
                {
                    type: 'field_number',
                    name: 'VALUE',
                    value: 15,
                },
            ],
        },
        {
            ...connections,
            type: OPCODE.motion_goto,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:goto%1'),
            args0: [
                {
                    type: 'input_value',
                    name: 'TO',
                },
            ],
        },
        {
            type: OPCODE.motion_goto_menu,
            colour: BlocksColor.motion.secondary,
            output: 'String',
            message0: '%1',
            args0: [
                {
                    type: 'field_dropdown_with_block',
                    name: 'TO',
                    options: () => {
                        const options: Array<Array<string>> = [];
                        options.push([t('blocks:randomPosition'), '_random_']);
                        options.push([t('blocks:mousePosition'), '_mouse_']);
                        // todo: 增加targets的name, id
                        return options;
                    },
                },
            ],
        },
    ]);
};
export { initBlocks, connections };
