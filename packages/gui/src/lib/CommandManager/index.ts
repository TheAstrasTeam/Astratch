import { EventBus } from 'astratch-core';
import { t } from 'astratch-i18n';
import { loadBuiltInCommands } from './builtIn';

interface ICommandManagerEventsType {
    ADDED_COMMAND: {
        id: string;
    };
    DELETED_COMMAND: {
        id: string;
    };
}

type ICommandSubmitMeta = (
    | {
          translate: true;
          descriptionID: string;
          nameID: string;
      }
    | {
          translate: false;
          description: string;
          name: string;
      }
) & {
    callback: (data: unknown) => void | Promise<void>;
    shortcuts?: string[];
    author: string;
    id?: string;
};

interface ICommandMeta {
    id: string;
    description: string;
    author: string;
    name: string;
    callback: (data: unknown) => void | Promise<void>;
    shortcuts: string[];
}

type commandsStorage = Map<string, ICommandMeta>;

interface ICommandManager {
    commands: commandsStorage;
    addCommand(meta: ICommandSubmitMeta): {
        dispose: () => void;
    };
    deleteCommand(id: string): void;
    getCommandMeta(id: string): ICommandMeta | undefined;
    getCommandCallback(id: string): ((data: unknown) => void | Promise<void>) | undefined;
}

class CommandManager extends EventBus<ICommandManagerEventsType> implements ICommandManager {
    commands: Map<string, ICommandMeta>;
    constructor() {
        super();
        this.commands = new Map();
    }
    addCommand(submitMeta: ICommandSubmitMeta): {
        dispose: () => void;
    } {
        const meta: ICommandMeta = {
            id: submitMeta.id ?? crypto.randomUUID(),
            callback: submitMeta.callback,
            shortcuts: submitMeta.shortcuts ?? [],
            author: submitMeta.author,
            name: '',
            description: '',
        };
        if (submitMeta.translate) {
            meta.name = t(submitMeta.nameID);
            meta.description = t(submitMeta.descriptionID);
        } else {
            meta.name = submitMeta.name;
            meta.description = submitMeta.description;
        }
        this.commands.set(meta.id, meta);
        this.emit('ADDED_COMMAND', {
            id: meta.id,
        });
        return {
            dispose: () => {
                this.deleteCommand(meta.id);
            },
        };
    }
    deleteCommand(id: string): void {
        this.commands.delete(id);
        this.emit('DELETED_COMMAND', {
            id,
        });
    }
    getCommandMeta(id: string): ICommandMeta | undefined {
        return this.commands.get(id);
    }

    getCommandCallback(id: string): ((data: unknown) => void | Promise<void>) | undefined {
        return this.getCommandMeta(id)?.callback;
    }
}

const commandManager = new CommandManager();
loadBuiltInCommands();
export { commandManager, type commandsStorage };
