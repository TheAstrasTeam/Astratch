import { EventBus } from 'astratch-core';
import type { FunctionComponent, SVGProps } from 'react';
import { loadBuiltInQuickOpen } from './builtIn';

interface QuickOpenRendererProps {
    /** 前缀之后的内容 */
    content: string;
    close: () => void;
}

type IQuickOpenMode = (
    | {
          translate: false;
          name: string;
          description: string;
      }
    | {
          translate: true;
          nameID: string;
          descriptionID: string;
      }
) & {
    icon: FunctionComponent<SVGProps<SVGSVGElement>>;
    id: string;
    /** 前缀，如 “@” “type” */
    prefix: string;
    Renderer: FunctionComponent<QuickOpenRendererProps>;
    shortcut: string[];
};

interface IQuickOpenManagerEventsType {
    ADDED_MODE: {
        id: string;
    };
    DELETED_MODE: {
        id: string;
    };
}

interface IQuickOpenManager {
    modes: Map<string, IQuickOpenMode>;
    // 添加一个模式并返回对应的卸载命令
    addMode(meta: IQuickOpenMode): {
        dispose: () => void;
    };
    deleteMode(id: string): void;
    getMode(id: string): IQuickOpenMode | undefined;
    listModes(): Map<string, IQuickOpenMode>;
}

class QuickOpenManager extends EventBus<IQuickOpenManagerEventsType> implements IQuickOpenManager {
    modes: Map<string, IQuickOpenMode>;
    constructor() {
        super();
        this.modes = new Map();
    }
    addMode(meta: IQuickOpenMode): {
        dispose: () => void;
    } {
        if (this.modes.has(meta.id))
            throw new Error(
                `Quick Open already exists "${meta.translate ? meta.nameID : meta.name}"(${meta.id}) mode`,
            );
        this.modes.set(meta.id, meta);
        this.emit('ADDED_MODE', {
            id: meta.id,
        });
        return {
            dispose: () => {
                this.deleteMode(meta.id);
            },
        };
    }
    deleteMode(id: string): void {
        if (!this.modes.has(id)) return;
        this.modes.delete(id);
        this.emit('DELETED_MODE', {
            id,
        });
    }
    getMode(id: string): IQuickOpenMode | undefined {
        return this.modes.get(id);
    }
    listModes(): Map<string, IQuickOpenMode> {
        return this.modes;
    }
}

const quickOpenManager = new QuickOpenManager();
loadBuiltInQuickOpen();
export { quickOpenManager, type IQuickOpenMode, type QuickOpenRendererProps };
