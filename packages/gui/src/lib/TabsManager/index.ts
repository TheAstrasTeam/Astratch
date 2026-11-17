import { EventBus } from 'astratch-core';
import type { ReactNode } from 'react';

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
}

interface ITabGroup {
    id: string;
    name: string;
    parent: string | undefined;

    direction: 'vertical' | 'horizontal';
    firstElement: string | ((id: string) => ReactNode);
    secondElement?: string | ((id: string) => ReactNode);
    _showSecondElement: boolean;
    minFirstElementSize: number;
    minSecondElementSize: number;
    defaultSize: number;
}

interface ITabGroupSubmit {
    id?: string;
    name: string;
    parent: string | undefined;

    direction: 'vertical' | 'horizontal';
    /** `string` 为另一个组的id，`(() => ReactNode)`是对应的元素 */
    firstElement: string | ((id: string) => ReactNode);
    /** `string` 为另一个组的id，`(() => ReactNode)`是对应的元素 */
    secondElement?: string | ((id: string) => ReactNode);
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

    addGroup(meta: ITabGroupSubmit, asWatching = false) {
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
        return {
            id,
            group: result,
        };
    }
    getGroup(id: string) {
        return this.groupStorage.get(id);
    }
    deleteGroup(id: string) {
        const isSuccess = this.groupStorage.delete(id);
        if (!isSuccess) return isSuccess;
        // 删除父层为它的组
        for (const group of this.groupStorage.entries()) {
            if (group[1].parent === id) this.deleteGroup(group[0]);
        }
        this.emit('DELETE_GROUP', {
            id,
        });
        return isSuccess;
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
}

const tabsManager = new TabsManager();
export { tabsManager, type ITabGroupSubmit };
