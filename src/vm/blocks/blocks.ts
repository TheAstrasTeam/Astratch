import { t } from 'i18next';
import type * as Blockly from 'blockly/core';
import { BlocksColor, OPCODE } from '../../types/blocks';

import turnLeft from './images/turnLeft.svg';
import turnRight from './images/turnRight.svg';

/**
 * 对于链接积木的配置项
 */
const connections = {
    nextStatement: 'Action',
    previousStatement: 'Action',
} as const;

const initBlocks = (blockly: typeof Blockly) => {
    // 删除已定义的积木，重新定义
    Object.values(OPCODE).forEach(blk => {
        try {
            if (Object.keys(blockly.Blocks).indexOf(blk) !== -1)
                blockly.registry.unregister('Block', blk);
        } catch {
            // 不需要管
        }
    });

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
    ]);
    blockly.common.defineBlocksWithJsonArray([
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
    ]);
    blockly.common.defineBlocksWithJsonArray([
        {
            ...connections,
            type: OPCODE.motion_turnleft,
            colour: BlocksColor.motion.primary,
            message0: t('blocks:turn %1 %2 degrees'),
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
    ]);
};
export { initBlocks, connections };
