import { EventBus } from 'astratch-core';
import type { FunctionComponent } from 'react';

interface ISideBarEventTypes {
    ADDED_ITEM: {
        id: string;
    };
}

interface ISidebarItem {
    id: string;
    Renderer: FunctionComponent;
}

class Sidebar extends EventBus<ISideBarEventTypes> {
    storage: Map<string, ISidebarItem>;
    constructor() {
        super();
        this.storage = new Map();
    }
}

const sidebar = new Sidebar();

export { sidebar };
