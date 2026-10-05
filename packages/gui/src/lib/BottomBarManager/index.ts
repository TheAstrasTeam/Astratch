import { EventBus } from 'astratch-core';
import type { FunctionComponent } from 'react';
import { loadBuiltInBottomBarItems } from './builtIn';

interface IBottomBarManagerEventTypes {
    ADDED_BOTTOM_ITEM: {
        id: string;
    };
    DELETED_BOTTOM_ITEM: {
        id: string;
    };
}

interface BottomBarRendererProps {
    dispose: () => void;
}

type BottomBarItem = (
    | {
          translate: true;
          descriptionID: string;
      }
    | {
          translate: false;
          description: string;
      }
) & {
    commandID: string;
    id: string;
    Renderer: FunctionComponent<BottomBarRendererProps>;
    pos: 'left' | 'right';
    tip: () => {
        tip: string;
        tipMode: 'markdown' | 'html' | 'text';
    };
};

type BottomBarSubmitItem = (
    | {
          translate: true;
          descriptionID: string;
      }
    | {
          translate: false;
          description: string;
      }
) & {
    commandID: string;
    id?: string;
    Renderer: FunctionComponent<BottomBarRendererProps>;
    pos: 'left' | 'right';
    tip?: () => {
        tip: string;
        tipMode: 'markdown' | 'html' | 'text';
    };
};

class BottomBarManager extends EventBus<IBottomBarManagerEventTypes> {
    items: Map<string, BottomBarItem>;
    constructor() {
        super();
        this.items = new Map();
    }

    addItem(meta: BottomBarSubmitItem): string {
        const id = meta.id ?? crypto.randomUUID();
        const result = {
            ...meta,
            id,
            tip: () => {
                return {
                    tip: '',
                    tipMode: 'text',
                };
            },
        } satisfies BottomBarItem;
        this.items.set(id, result);
        this.emit('ADDED_BOTTOM_ITEM', {
            id,
        });
        return id;
    }

    deleteItem(id: string): boolean {
        if (!this.items.has(id)) return false;

        this.emit('DELETED_BOTTOM_ITEM', {
            id,
        });
        return this.items.delete(id);
    }

    getItem(id: string): BottomBarItem | undefined {
        return this.items.get(id);
    }

    listItem(): [string, BottomBarItem][] {
        return Array.from(this.items);
    }
}

const bottomBarManager = new BottomBarManager();
loadBuiltInBottomBarItems();
export { bottomBarManager, type BottomBarSubmitItem, type BottomBarItem };
