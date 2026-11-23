import { EventBus } from 'astratch-core';
import type { ComponentType } from 'react';

interface ITabsManagerEventsType {
    ADD_GROUP: {
        id: string;
        group: ITabGroup;
    };
    DELETE_GROUP: {
        id: string;
    };
    SET_WATCHING_GROUP: {
        id: string | undefined;
        group: ITabGroup | undefined;
    };
    HIDE_SECOND_ELEMENT: {
        id: string;
        group: ITabGroup;
    };
    SET_FOCUSING_GROUP: {
        id: string | undefined;
        group: ITabGroup | undefined;
        pos: 'first' | 'second';
    };
}

interface ITabGroup {
    id: string;
    parent: string | undefined;

    direction: 'vertical' | 'horizontal';
    firstElement:
        | {
              Renderer: ComponentType<{ id: string; pos: 'first' | 'second' }>;
              name: string;
          }
        | string;
    secondElement?:
        | {
              Renderer: ComponentType<{ id: string; pos: 'first' | 'second' }>;
              name: string;
          }
        | string;
    _showSecondElement: boolean;
    minFirstElementSize: number;
    minSecondElementSize: number;
    defaultSize: number;
}

interface ITabGroupSubmit {
    id?: string;
    parent: string | undefined;

    direction: 'vertical' | 'horizontal';
    /** `string` 为另一个组的id，`ComponentType`是对应的组件 */
    firstElement:
        | {
              Renderer: ComponentType<{ id: string; pos: 'first' | 'second' }>;
              name: string;
          }
        | string;
    /** `string` 为另一个组的id，`ComponentType`是对应的组件 */
    secondElement?:
        | {
              Renderer: ComponentType<{ id: string; pos: 'first' | 'second' }>;
              name: string;
          }
        | string;
    minFirstElementSize?: number;
    minSecondElementSize?: number;
    defaultSize?: number;
}

class TabsManager extends EventBus<ITabsManagerEventsType> {
    groupStorage = new Map<string, ITabGroup>();
    /** 作为最父层的组 */
    watchingGroup: string | undefined;
    setWatchingGroup(id: string | undefined) {
        this.watchingGroup = id;
        this.emit('SET_WATCHING_GROUP', {
            id,
            group: this.getGroup(id ?? ''),
        });
    }
    /** 聚焦的组 */
    focusingGroup: string | undefined;
    focusingPos: 'first' | 'second' | undefined;
    setFocusingGroup(id: string | undefined, pos: 'first' | 'second') {
        this.focusingGroup = id;
        this.focusingPos = pos;
        this.emit('SET_FOCUSING_GROUP', {
            id,
            group: this.getGroup(id ?? ''),
            pos,
        });
    }

    addGroup(meta: ITabGroupSubmit, asWatching = false, asFocusing = true) {
        const id = meta.id ?? crypto.randomUUID();
        const result = {
            ...meta,
            id,
            minFirstElementSize: meta.minFirstElementSize ?? 20,
            minSecondElementSize: meta.minSecondElementSize ?? 20,
            defaultSize: meta.defaultSize ?? 0,
            _showSecondElement: true,
        } satisfies ITabGroup;
        this.groupStorage.set(id, result);
        this.emit('ADD_GROUP', {
            id,
            group: result,
        });
        if (asWatching) this.setWatchingGroup(id);
        if (asFocusing) this.setFocusingGroup(id, 'first');
        return {
            id,
            group: result,
        };
    }

    /** 添加一个组并替换掉聚焦的组 */
    addAndReplaceFocusingGroup(meta: ITabGroupSubmit) {
        if (!this.focusingGroup) return;
        return this.addAndReplaceGroup(this.focusingGroup, meta);
    }

    /** 添加一个组并替换(删除)掉另外一个组，它会替换掉父和子元素的指向 */
    addAndReplaceGroup(replaceGroupID: string, meta: ITabGroupSubmit) {
        if (!this.groupStorage.delete(replaceGroupID)) return;
        const result = this.addGroup(meta);
        for (const group of this.groupStorage.entries()) {
            if (group[0] === result.id) continue;
            if (group[1].parent === replaceGroupID)
                this.groupStorage.get(group[0])!.parent = result.id;
            if (group[1].secondElement === replaceGroupID)
                this.groupStorage.get(group[0])!.secondElement = result.id;
            if (group[1].firstElement === replaceGroupID)
                this.groupStorage.get(group[0])!.firstElement = result.id;
        }
        // this.emit('DELETE_GROUP', { id: replaceGroupID });
        if (this.watchingGroup === replaceGroupID) this.setWatchingGroup(result.id);
        return result;
    }

    getGroup(id: string) {
        return this.groupStorage.get(id);
    }

    deleteGroup(id: string) {
        const parent = this.groupStorage.get(id)?.parent;
        const isSuccess = this.groupStorage.delete(id);
        if (!isSuccess) return isSuccess;
        // 删除父层为它的组
        for (const [groupID, group] of this.groupStorage.entries()) {
            if (group.parent === id) this.deleteGroup(groupID);
            if (group.firstElement === id) {
                if (group.secondElement)
                    this.addAndReplaceGroup(groupID, {
                        ...group,
                        firstElement: group.secondElement,
                        secondElement: undefined,
                    });
                else this.deleteGroup(groupID);
            }
            if (group.secondElement === id) {
                this.addAndReplaceGroup(groupID, {
                    ...group,
                    secondElement: undefined,
                });
            }
        }
        if (this.watchingGroup === id) this.setWatchingGroup(parent);
        this.emit('DELETE_GROUP', {
            id,
        });
        return isSuccess;
    }

    /** 删除一个组里的指定元素 */
    deleteElementOfGroup(groupID: string, pos: 'first' | 'second') {
        const group = this.getGroup(groupID);
        if (!group) return;
        if (pos === 'first') {
            if (!group.secondElement) this.deleteGroup(groupID);
            this.addAndReplaceGroup(groupID, {
                ...group,
                firstElement: group.secondElement!,
                secondElement: undefined,
            });
        } else {
            this.addAndReplaceGroup(groupID, {
                ...group,
                secondElement: undefined,
            });
        }
    }

    /** 让组的 secondElement 隐藏，不再渲染 */
    hideGroupSecondElement(id: string) {
        const group = this.getGroup(id);
        if (!group) return;
        group._showSecondElement = !group._showSecondElement;
        this.emit('HIDE_SECOND_ELEMENT', {
            id,
            group,
        });
    }

    /** 清理无意义的组 */
    sweepGroup() {
        for (;;) {
            const entry = Array.from(this.groupStorage.entries()).find(
                ([groupID, group]) =>
                    groupID !== this.focusingGroup &&
                    group.secondElement === undefined &&
                    typeof group.firstElement === 'string',
            );
            if (!entry) return;
            const [groupID, group] = entry;
            const resultID = group.firstElement as string;

            for (const [replaceGroupID, replaceGroup] of Array.from(this.groupStorage.entries())) {
                if (replaceGroupID === groupID) continue;
                if (replaceGroup.parent === groupID) replaceGroup.parent = resultID;
                if (replaceGroup.firstElement === groupID) replaceGroup.firstElement = resultID;
                if (replaceGroup.secondElement === groupID) replaceGroup.secondElement = resultID;
            }
            if (this.watchingGroup === groupID) this.setWatchingGroup(resultID);

            this.groupStorage.delete(groupID);
            this.emit('DELETE_GROUP', { id: groupID });
        }
    }

    /** 在聚焦处插入新的元素，它会自动处理不同情况的连接关系 */
    insertElementToFocusingGroup(element: ITabGroup['firstElement']) {
        // 如果已有在看的组且拥有聚焦的组，则添加到聚焦的组
        // 如果已有在看的组且没有聚焦的组，则对在看的组分开
        // 如果没有在看的组，直接替换
        if (tabsManager.watchingGroup === undefined)
            tabsManager.setWatchingGroup(
                tabsManager.addGroup({
                    direction: 'horizontal',
                    firstElement: element,
                    parent: tabsManager.watchingGroup,
                }).id,
            );
        else {
            if (tabsManager.focusingGroup) {
                const group = tabsManager.getGroup(tabsManager.focusingGroup)!;
                if (!group.secondElement) {
                    // 若没有第二元素，直接在第二元素加
                    tabsManager.addAndReplaceGroup(tabsManager.focusingGroup, {
                        ...group,
                        secondElement: element,
                    });
                } else {
                    // 若有第二元素，则将聚焦位置元素原本的元素移动到新的组
                    const currentID = tabsManager.addGroup(
                        {
                            ...group,
                            firstElement:
                                group[
                                    tabsManager.focusingPos === 'first'
                                        ? 'firstElement'
                                        : 'secondElement'
                                ]!,
                            secondElement: element,
                            parent: group.id,
                            id: undefined,
                        },
                        false,
                        false,
                    ).id;
                    tabsManager.addAndReplaceGroup(tabsManager.focusingGroup, {
                        ...group,
                        [tabsManager.focusingPos === 'first' ? 'firstElement' : 'secondElement']:
                            currentID,
                    });
                }
            } else {
                const group = tabsManager.getGroup(tabsManager.watchingGroup)!;
                if (!group.secondElement) {
                    // 若没有第二元素，直接在第二元素加
                    tabsManager.addAndReplaceGroup(tabsManager.watchingGroup, {
                        ...group,
                        secondElement: element,
                    });
                } else {
                    // 若有第二元素，则将第二元素原本的元素移动到新的组
                    const currentID = tabsManager.addGroup({
                        ...group,
                        firstElement: group.secondElement,
                        secondElement: element,
                    }).id;
                    tabsManager.addAndReplaceGroup(tabsManager.watchingGroup, {
                        ...group,
                        secondElement: currentID,
                    });
                }
            }
        }
    }
}

const tabsManager = new TabsManager();
export { tabsManager, type ITabGroupSubmit, type ITabGroup };
