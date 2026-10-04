import type { IEvents } from 'astratch-core';
import { Entity, type IEntityInfo } from './targets/entity';
import { Module, type IModuleInfo } from './targets/module';
import type { IVMEventsType } from '../vm';

interface IRuntime {
    targets: {
        entities: Map<string, Entity>;
        modules: Map<string, Module>;
    };

    /** 创建一个目标，返回它的ID */
    createTarget<T extends 'entity' | 'module'>(
        mode: T,
        meta?: T extends 'entity' ? IEntityInfo : IModuleInfo,
    ): string;

    /**
     * 删除一个目标
     * @param recordHistory 是否记录删除的历史纪录，默认记录
     */
    removeTarget(mode: 'entity' | 'module', id: string, recordHistory?: boolean): boolean;
}

class Runtime implements IRuntime {
    targets: IRuntime['targets'];
    private emit: IEvents<IVMEventsType>['emit'];

    constructor(emitMethod: IEvents<IVMEventsType>['emit']) {
        this.emit = emitMethod;
        this.targets = {
            entities: new Map(),
            modules: new Map(),
        };
    }

    createTarget<T extends 'entity' | 'module'>(
        mode: T,
        meta?: T extends 'entity' ? IEntityInfo : IModuleInfo,
    ): string {
        const id = meta?.id ?? crypto.randomUUID();
        if (mode === 'entity') this.targets.entities.set(id, new Entity(meta ?? {}));
        else this.targets.modules.set(id, new Module(meta ?? {}));
        this.emit('CREATE_TARGET', {
            targetID: id,
            mode,
        });
        return id;
    }

    removeTarget(mode: 'entity' | 'module', id: string, recordHistory = true): boolean {
        if (mode === 'entity') {
            if (recordHistory) {
                //TODO: 记录历史记录
            }
            this.emit('REMOVE_TARGET', {
                targetID: id,
                mode,
            });
            return this.targets.entities.delete(id);
        } else {
            if (recordHistory) {
                //TODO: 记录历史记录
            }
            this.emit('REMOVE_TARGET', {
                targetID: id,
                mode,
            });
            return this.targets.modules.delete(id);
        }
    }
}

export { Runtime, type IRuntime };
