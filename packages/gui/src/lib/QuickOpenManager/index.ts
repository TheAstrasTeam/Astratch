import { EventBus } from 'astratch-core';
import type { FunctionComponent, SVGProps } from 'react';
import { loadBuiltInQuickOpen } from './builtIn';

interface QuickOpenRendererProps {
    /** 前缀之后的内容 */
    content: string;
    close: () => void;
}

type IQuickOpenMeta = (
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
    icon: FunctionComponent<SVGProps<SVGSVGElement>> | undefined;
    id: string;
    /** 前缀，如 “@” “type” */
    prefix: string;
    Renderer: FunctionComponent<QuickOpenRendererProps>;
    shortcut: string[];
};

type IQuickOpenSubmitMeta = (
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
    icon?: FunctionComponent<SVGProps<SVGSVGElement>>;
    id?: string;
    /** 前缀，如 “@” “type” */
    prefix: string;
    Renderer: FunctionComponent<QuickOpenRendererProps>;
    shortcut?: string[];
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
    modes: Map<string, IQuickOpenMeta>;
    // 添加一个模式并返回对应的卸载命令
    addMode(meta: IQuickOpenSubmitMeta): {
        dispose: () => void;
        id: string;
    };
    deleteMode(id: string): void;
    getMode(id: string): IQuickOpenMeta | undefined;
    listModes(): Map<string, IQuickOpenMeta>;
}

class QuickOpenManager extends EventBus<IQuickOpenManagerEventsType> implements IQuickOpenManager {
    modes: Map<string, IQuickOpenMeta>;
    constructor() {
        super();
        this.modes = new Map();
    }
    addMode(meta: IQuickOpenSubmitMeta): {
        dispose: () => void;
        id: string;
    } {
        const resultMeta = {
            ...meta,
            id: meta.id ?? crypto.randomUUID(),
            icon: meta.icon ?? undefined,
            shortcut: meta.shortcut ?? [],
        } satisfies IQuickOpenMeta;
        if (this.modes.has(resultMeta.id))
            throw new Error(
                `Quick Open already exists "${resultMeta.translate ? resultMeta.nameID : resultMeta.name}"(${resultMeta.id}) mode`,
            );
        this.modes.set(resultMeta.id, resultMeta);
        this.emit('ADDED_MODE', {
            id: resultMeta.id,
        });
        return {
            dispose: () => {
                this.deleteMode(resultMeta.id);
            },
            id: resultMeta.id,
        };
    }
    deleteMode(id: string): void {
        if (!this.modes.has(id)) return;
        this.modes.delete(id);
        this.emit('DELETED_MODE', {
            id,
        });
    }
    getMode(id: string): IQuickOpenMeta | undefined {
        return this.modes.get(id);
    }
    listModes(): Map<string, IQuickOpenMeta> {
        return this.modes;
    }
}

const quickOpenManager = new QuickOpenManager();
loadBuiltInQuickOpen();
export { quickOpenManager, type IQuickOpenMeta as IQuickOpenMode, type QuickOpenRendererProps };
