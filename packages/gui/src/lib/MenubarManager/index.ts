import { EventBus } from 'astratch-core';
import { loadBuiltInMenus } from './builtIn';
import type { PartialByKeys } from '../../utils/types';

const MenubarManagerPositions = ['project', 'edit', 'run', 'layout', 'help'] as const;
type TMenubarManagerPositions = (typeof MenubarManagerPositions)[number];

interface IMenubarManagerEventsType {
    ADDED_VALUE: {
        id: string;
        position: TMenubarManagerPositions;
    };
    ADDED_CATEGORY: {
        id: string;
        position: TMenubarManagerPositions;
    };
    DELETED_VALUE: {
        id: string;
        position: TMenubarManagerPositions;
    };
    DELETED_CATEGORY: {
        id: string;
        position: TMenubarManagerPositions;
    };
    EDITED_CATEGORY: undefined;
}

type TMenubarManagerValueMeta =
    | { isDivider: true; id: string }
    | (((
          | {
                translate: true;
                nameID: string;
            }
          | {
                translate: false;
                name: string;
            }
      ) & {
          isDivider: false;
          id: string;
          /** 是否可用，否显示灰色 */
          isEnable: () => boolean;
          /** 是否可见，否不显示 */
          isVisible: () => boolean;
          /** 来自快捷键管理器的ID */
          shortcutsTipID?: string;
      }) &
          (
              | {
                    children: TMenubarManagerValueMeta[];
                    commandID?: never;
                }
              | {
                    /** CommandManager 的命令 ID */
                    commandID: string;
                    children?: never;
                }
          ));

// 我也很想用`partialByKeys`，但是它不能用啊
type TMenubarManagerValueSubmitMeta =
    | { isDivider: true; id?: string }
    | (((
          | {
                translate: true;
                nameID: string;
            }
          | {
                translate: false;
                name: string;
            }
      ) & {
          isDivider?: false;
          id?: string;
          /** 是否可用，否显示灰色 */
          isEnable?: () => boolean;
          /** 是否可见，否不显示 */
          isVisible?: () => boolean;
          /** 来自快捷键管理器的ID */
          shortcutsTipID?: string;
      }) &
          (
              | {
                    children: TMenubarManagerValueSubmitMeta[];
                    commandID?: never;
                }
              | {
                    /** CommandManager 的命令 ID */
                    commandID: string;
                    children?: never;
                }
          ));

type IMenubarManagerCategoryMeta = (
    | {
          translate: true;
          nameID: string;
      }
    | {
          translate: false;
          name: string;
      }
) & {
    id: string;
};

interface IMenubarManager {
    menubarStorage: Map<
        TMenubarManagerPositions,
        Map<string, { meta: IMenubarManagerCategoryMeta; children: TMenubarManagerValueMeta[] }>
    >;
    /**
     *
     * @param pos "project" | "edit" | "run" | "layout" | "help"
     * @param category 所属的类，填 {@link addCategory} 的返回值
     * @param meta 具体的数据，若`isDivider`为`true`则为分割线，`commandID`填入来自 [commandManager](../CommandManager/index.ts) 的命令id
     */
    addValue(
        pos: TMenubarManagerPositions,
        category: string,
        meta: TMenubarManagerValueSubmitMeta,
    ): void;
    /** 添加一个新的类，返回它的id */
    addCategory(pos: TMenubarManagerPositions, meta: IMenubarManagerCategoryMeta): string;
    deleteValue(pos: TMenubarManagerPositions, id: string): boolean;
    deleteCategory(pos: TMenubarManagerPositions, id: string): boolean;
    getValue(pos: TMenubarManagerPositions, id: string): TMenubarManagerValueMeta | undefined;
    getCategory(
        pos: TMenubarManagerPositions,
        id: string,
    ): undefined | { meta: IMenubarManagerCategoryMeta; children: TMenubarManagerValueMeta[] };
    moveCategoryLayerToTop(pos: TMenubarManagerPositions, id: string): void;
    moveCategoryLayerToLast(pos: TMenubarManagerPositions, id: string): void;
    listPosition(
        pos: TMenubarManagerPositions,
    ): Map<string, { meta: IMenubarManagerCategoryMeta; children: TMenubarManagerValueMeta[] }>;
}

class MenubarManager extends EventBus<IMenubarManagerEventsType> implements IMenubarManager {
    menubarStorage: Map<
        'project' | 'edit' | 'run' | 'layout' | 'help',
        Map<string, { meta: IMenubarManagerCategoryMeta; children: TMenubarManagerValueMeta[] }>
    >;
    /**
     * 遍历位于`pos`的所有菜单项
     * @param callback value：当前的菜单项、parent：value的父亲、index：位置
     * @returns
     */
    protected forAllValue(
        pos: TMenubarManagerPositions,
        callback: (
            value: TMenubarManagerValueMeta,
            parent: TMenubarManagerValueMeta[],
            index: number,
        ) => boolean,
    ) {
        const _forValue = (values: TMenubarManagerValueMeta[]) => {
            for (let i = 0; i < values.length; i++) {
                const value = values[i];
                if (callback(value, values, i)) return true;
                if (!value.isDivider && _forValue(value.children ?? [])) return true;
            }
            return false;
        };
        for (const category of this.listPosition(pos)) {
            if (_forValue(category[1].children)) return;
        }
    }
    constructor() {
        super();
        this.menubarStorage = new Map();
        MenubarManagerPositions.forEach(pos => {
            this.menubarStorage.set(pos, new Map());
        });
    }
    addValue(
        pos: TMenubarManagerPositions,
        category: string,
        meta: TMenubarManagerValueSubmitMeta,
    ): void {
        const _parseSubmitToData = (
            meta: TMenubarManagerValueSubmitMeta,
        ): TMenubarManagerValueMeta => {
            if (meta.isDivider === true)
                return { ...meta, isDivider: true, id: meta.id ?? crypto.randomUUID() };
            if (meta.children) {
                return {
                    ...meta,
                    isDivider: false,
                    isEnable: meta.isEnable ?? (() => true),
                    isVisible: meta.isVisible ?? (() => true),
                    id: meta.id ?? crypto.randomUUID(),
                    children: meta.children.map(child => _parseSubmitToData(child)),
                };
            }
            return {
                ...meta,
                isDivider: false,
                isEnable: meta.isEnable ?? (() => true),
                isVisible: meta.isVisible ?? (() => true),
                id: meta.id ?? crypto.randomUUID(),
            };
        };
        const categoryData = this.listPosition(pos).get(category);
        if (!categoryData) throw new Error(`Category: ${category} isn't exist in ${pos}.`);
        const data = {
            ..._parseSubmitToData(meta),
            category,
        };
        categoryData.children.push(data);
        this.emit('ADDED_VALUE', {
            id: data.id,
            position: pos,
        });
    }
    addCategory(
        pos: TMenubarManagerPositions,
        meta: PartialByKeys<IMenubarManagerCategoryMeta, 'id'>,
    ): string {
        const id = meta.id ?? crypto.randomUUID();
        this.listPosition(pos).set(id, {
            meta: {
                ...meta,
                id,
            },
            children: [],
        });
        this.emit('ADDED_CATEGORY', {
            id,
            position: pos,
        });
        this.emit('EDITED_CATEGORY', undefined);
        return id;
    }
    deleteValue(pos: TMenubarManagerPositions, id: string): boolean {
        let result = false;
        this.forAllValue(pos, (value, parent, index) => {
            if (value.id === id) {
                parent.splice(index, 1);
                result = true;
                this.emit('DELETED_VALUE', {
                    id: value.id,
                    position: pos,
                });
                this.emit('EDITED_CATEGORY', undefined);

                return true;
            }
            return false;
        });
        return result;
    }
    deleteCategory(pos: TMenubarManagerPositions, id: string): boolean {
        const isDeleted = this.listPosition(pos).delete(id);
        if (isDeleted) {
            this.emit('DELETED_CATEGORY', {
                id: id,
                position: pos,
            });
            this.emit('EDITED_CATEGORY', undefined);
        }
        return isDeleted;
    }
    getValue(pos: TMenubarManagerPositions, id: string): TMenubarManagerValueMeta | undefined {
        let result: TMenubarManagerValueMeta | undefined = undefined;
        this.forAllValue(pos, value => {
            if (value.id === id) {
                result = value;
                return true;
            }
            return false;
        });
        return result;
    }
    getCategory(
        pos: TMenubarManagerPositions,
        id: string,
    ): undefined | { meta: IMenubarManagerCategoryMeta; children: TMenubarManagerValueMeta[] } {
        return this.listPosition(pos).get(id);
    }
    moveCategoryLayerToLast(pos: TMenubarManagerPositions, id: string): void {
        const map = this.listPosition(pos);
        const _value = map.get(id);
        if (!_value) return;
        map.delete(id);
        map.set(id, _value);
        this.emit('EDITED_CATEGORY', undefined);
    }
    moveCategoryLayerToTop(pos: TMenubarManagerPositions, id: string): void {
        const map = this.listPosition(pos);
        const _value = map.get(id);
        if (!_value) return;
        map.delete(id);
        const _mapWithoutValue = [...map];
        map.clear();
        map.set(id, _value);
        for (const [k, v] of _mapWithoutValue) {
            map.set(k, v);
        }
        this.emit('EDITED_CATEGORY', undefined);
    }
    listPosition(
        pos: TMenubarManagerPositions,
    ): Map<string, { meta: IMenubarManagerCategoryMeta; children: TMenubarManagerValueMeta[] }> {
        return this.menubarStorage.get(pos)!;
    }
}

const menubarManager = new MenubarManager();
loadBuiltInMenus();
export {
    menubarManager,
    MenubarManagerPositions,
    type TMenubarManagerValueMeta,
    type IMenubarManagerCategoryMeta,
    type TMenubarManagerPositions,
};
