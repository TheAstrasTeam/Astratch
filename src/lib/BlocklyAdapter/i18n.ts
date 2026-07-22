// 针对Blockly部分译文的替换
import * as Blockly from 'blockly';

/**
 * 将部分中文译文替换为正确的译名
 * 例如“"已拷貝。按下 %1 貼上。"”
 *
 * *Blockly是引用传递
 * @param blockly Blockly自己
 */
const replaceChineseI18n = (blockly: typeof Blockly) => {
    blockly.Msg.KEYBOARD_NAV_COPIED_HINT = '已复制，按下 %1 来粘贴。';
    blockly.Msg.KEYBOARD_NAV_CUT_HINT = '已剪切，按下 %1 来粘贴。';
};

export { replaceChineseI18n };
