import * as Blockly from 'blockly/core';
import { t } from 'i18next';
import { BlocksColor, OPCODES } from '../../../types/blocks';
import type { IVM } from '../../../types/vm';
import { dropdownWithInput } from '../../../../plugins/fieldDropdown';

/**
 * 对于链接积木的配置项
 */
export const connections = {
    nextStatement: 'Action',
    previousStatement: 'Action',
    inputsInline: true,
} as const;

/**
 * 帽子积木配置项
 */
export const hatConnections = {
    nextStatement: 'Action',
    inputsInline: true,
    hat: 'cap',
} as const;

/**
 * 结束积木配置项
 */
export const endConnections = {
    previousStatement: 'Action',
    inputsInline: true,
} as const;

/**
 * 匹配分支只能连接到匹配积木内部。
 */
export const matchBranchConnections = {
    previousStatement: 'MatchBranch',
    nextStatement: 'MatchBranch',
    inputsInline: true,
} as const;

/**
 * 默认分支必须位于匹配分支栈末尾。
 */
export const matchBranchEndConnections = {
    previousStatement: 'MatchBranch',
    inputsInline: true,
} as const;

/**
 * 对于返回值
 */
export const returnConnections = {
    inputsInline: true,
} as const;

/**
 * 删除 Blockly 已注册的所有积木类型
 */
export function clearRegisteredBlocks(blockly: typeof Blockly) {
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
}

/**
 * 创建一个"实体选择菜单"字段配置
 * （供 entity 相关菜单积木复用）
 *
 * 使用 dropdownWithInput（field_dropdown_with_block）以与原 JSON 定义保持一致
 */
export function createEntitiesMenu(vm: IVM) {
    return new dropdownWithInput(() => {
        const directionList: Blockly.MenuOption[] = [[t('blocks:menu.mousePoint'), '_MOUSE_']];
        vm.runtime.targets.forEach(target => {
            if (target.id === vm.runtime.editingTargetID) return;
            directionList.push([target.name, target.id]);
        });
        return directionList;
    });
}

/**
 * 创建一个静态下拉菜单字段
 * 使用 dropdownWithInput（field_dropdown_with_block）以与原 JSON 定义保持一致
 */
export function createStaticMenu(options: Blockly.MenuOption[]) {
    return new dropdownWithInput(options);
}

export { BlocksColor, OPCODES };
