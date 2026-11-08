import { EventBus } from 'astratch-core';
import type { FunctionComponent, ReactNode, SVGProps } from 'react';
import { loadBuiltInSidebarItems } from './builtIn';

interface ISideBarEventTypes {
    ADDED_ITEM: {
        id: string;
    };
    DELETED_ITEM: {
        id: string;
    };
}

interface ISidebarItem {
    id: string;
    alt: string;
    Renderer: ReactNode;
    Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
    name: string;
}

export interface ISidebarSubmitItem {
    id?: string;
    alt?: string;
    Renderer: ReactNode;
    Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
    name: string;
}

class Sidebar extends EventBus<ISideBarEventTypes> {
    storage: Map<string, ISidebarItem>;
    constructor() {
        super();
        this.storage = new Map();
    }

    /**
     * 添加一个新侧边栏项
     * @returns id
     */
    addItem(item: ISidebarSubmitItem) {
        const id = item.id ?? crypto.randomUUID();
        const itemResult = {
            ...item,
            id,
            alt: item.alt ?? '',
        } satisfies ISidebarItem;
        this.storage.set(id, itemResult);
        this.emit('ADDED_ITEM', {
            id,
        });
        return id;
    }

    getRenderer(id: string) {
        return this.storage.get(id)?.Renderer;
    }

    removeItem(id: string) {
        if (this.storage.delete(id)) {
            this.emit('DELETED_ITEM', {
                id,
            });
            return true;
        }
        return false;
    }

    moveItemToLast(id: string) {
        const value = this.storage.get(id);
        if (!value) return;
        this.storage.delete(id);
        this.storage.set(id, value);
    }

    moveItemToTop(id: string) {
        if (!this.storage.has(id)) return;
        const entries = [...this.storage];
        const i = entries.findIndex(([k]) => k === id);
        const [entry] = entries.splice(i, 1);
        entries.unshift(entry);
        this.storage = new Map(entries);
    }

    listItem() {
        return Array.from(this.storage).map(item => item[1]);
    }
}

const sidebar = new Sidebar();
loadBuiltInSidebarItems();

export { sidebar };
