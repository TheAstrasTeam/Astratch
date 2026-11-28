import { EventBus } from 'astratch-core';
import type { FunctionComponent, ReactNode, SVGProps } from 'react';
import { loadBuiltInSidebarItems } from './builtIn';

interface ISideBarEventTypes {
    ADD_ITEM: {
        id: string;
    };
    DELETE_ITEM: {
        id: string;
    };
}

export interface ISidebarItem {
    id: string;
    alt: string;
    /**
     * 返回一个渲染器的函数，其中 latestStorage 存储着上次返回的 storage
     * storage 会在组件切换时触发
     */
    Renderer: () => {
        Node: (latestStorage: Record<string, unknown>) => ReactNode;
        storage: () => Record<string, unknown>;
    };
    latestStorage: Record<string, unknown>;
    Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
    name: string;
    enable: () => boolean | Promise<boolean>;
}

export interface ISidebarSubmitItem {
    id?: string;
    alt?: string;
    /**
     * 返回一个渲染器的函数，其中 latestStorage 存储着上次返回的 storage
     * storage 会在组件切换时触发
     */
    Renderer: () => {
        Node: (latestStorage: Record<string, unknown>) => ReactNode;
        storage: () => Record<string, unknown>;
    };
    Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
    name: string;
    enable: () => boolean | Promise<boolean>;
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
            latestStorage: {},
        } satisfies ISidebarItem;
        this.storage.set(id, itemResult);
        this.emit('ADD_ITEM', {
            id,
        });
        return id;
    }

    getRenderer(/** item的ID */ id: string) {
        return this.storage.get(id)?.Renderer;
    }

    removeItem(/** item的ID */ id: string) {
        if (this.storage.delete(id)) {
            this.emit('DELETE_ITEM', {
                id,
            });
            return true;
        }
        return false;
    }

    moveItemToLast(/** item的ID */ id: string) {
        const value = this.storage.get(id);
        if (!value) return;
        this.storage.delete(id);
        this.storage.set(id, value);
    }

    moveItemToTop(/** item的ID */ id: string) {
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

    /** 设置组件的存储 */
    setStorage(/** item的ID */ id: string, latestStorage: Record<string, unknown>) {
        if (!this.storage.has(id)) return;
        this.storage.get(id)!.latestStorage = latestStorage;
    }

    readStorageFromID(/** item的ID */ id: string) {
        return this.storage.get(id)?.latestStorage;
    }
}

const sidebar = new Sidebar();
loadBuiltInSidebarItems();

export { sidebar };
