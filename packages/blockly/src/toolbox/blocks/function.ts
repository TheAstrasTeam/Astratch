/**
 * 函数的基础积木定义。
 *
 * 只做静态基础定义：不加图标，不做 `+()` 变异器。
 * “创建函数”与“调用函数”（[...函数]）属于动态积木，暂时跳过。
 *
 * @author AI
 */
import { t } from 'astratch-i18n';

import { TOOLBOX_COLOR } from '../color';
import { TYPES, connections, functionInput, returnConnections, statementInput } from '../helps';
import { OPCODES } from '../opcodes';
import { blocklyAdapter } from '../../blockly';
import type { Blockly } from '../..';

export const initFunctionBlocks = () => {
    blocklyAdapter.Blockly.Blocks[OPCODES.execute] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:function.execute'),
                args0: [functionInput('FUNCTION')],
                colour: TOOLBOX_COLOR.function,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.executeReturn] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:function.executeReturn'),
                args0: [functionInput('FUNCTION')],
                output: TYPES.UNKNOWN,
                colour: TOOLBOX_COLOR.function,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.inlineFunction] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:function.inline'),
                message1: '%1',
                args1: [statementInput('DO')],
                output: TYPES.FUNCTION,
                colour: TOOLBOX_COLOR.function,
            });
        },
    } as Blockly.Block;
};
