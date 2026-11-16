import type { IEvents } from 'astratch-core';
import { Entity, type IEntityInfo } from './targets/entity';
import { Module, type IModuleInfo } from './targets/module';
import { type IVMEventsType } from '../../vm';
import { Path, type IPathInfo } from './folder';
import * as Comlink from 'comlink';

export type * from './targets/entity';
export type * from './targets/module';
export type * from './targets/index';
export type * from './folder';

type TTARGETS = 'entity' | 'module';

class Targets {
    private targets: {
        entities: Map<string, Entity>;
        modules: Map<string, Module>;
    };
    private paths: {
        entities: Path;
        modules: Path;
    };
    private emit: IEvents<IVMEventsType>['emit'];

    private cache_entitiesInfo: IEntityInfo[] = [];
    private cache_modulesInfo: IModuleInfo[] = [];
    private cache_isAlreadyGetEntitiesCache = false;
    private cache_isAlreadyGetModulesCache = false;

    constructor(emitMethod: IEvents<IVMEventsType>['emit']) {
        this.emit = emitMethod;
        this.targets = {
            entities: new Map(),
            modules: new Map(),
        };
        this.paths = {
            entities: new Path(this, this.emit, 'entity'),
            modules: new Path(this, this.emit, 'module'),
        };
    }

    get getPath() {
        return Comlink.proxy(this.paths);
    }

    /** 创建一个目标，返回它的ID */
    createTarget<T extends TTARGETS>(
        mode: T,
        meta?: T extends 'entity' ? Partial<IEntityInfo> : Partial<IModuleInfo>,
    ): string {
        const id = meta?.id ?? crypto.randomUUID();
        if (mode === 'entity') {
            this.targets.entities.set(id, new Entity(meta ?? {}, this.emit.bind(this)));
            // 给对应的path添加children
            if (meta?.parent)
                this.getPath.entities.getPath(meta.parent)?.children.push({ isPath: false, id });
            this.cache_isAlreadyGetEntitiesCache = false;
        } else {
            this.targets.modules.set(id, new Module(meta ?? {}, this.emit.bind(this)));
            // 给对应的path添加children
            if (meta?.parent)
                this.getPath.modules.getPath(meta.parent)?.children.push({ isPath: false, id });
            this.cache_isAlreadyGetModulesCache = false;
        }
        this.emit('CREATE_TARGET', {
            targetID: id,
            mode,
        });
        return id;
    }

    renameTarget(mode: TTARGETS, id: string, newName: string, silence = false): void {
        const target = this.targets[mode === 'entity' ? 'entities' : 'modules'].get(id);
        if (!target) {
            if (silence) return;
            else throw new Error(` The ${id} (${mode}) is not found.`);
        }
        if (mode === 'entity') this.cache_isAlreadyGetEntitiesCache = false;
        else this.cache_isAlreadyGetModulesCache = false;
        target.name = newName;
    }

    /**
     * 删除一个目标
     * @param recordHistory 是否记录删除的历史纪录，默认记录
     */
    removeTarget(mode: TTARGETS, id: string, recordHistory = true): boolean {
        if (mode === 'entity') {
            if (recordHistory) {
                //TODO: 记录历史记录
            }
            this.emit('REMOVE_TARGET', {
                targetID: id,
                mode,
            });
            this.cache_isAlreadyGetModulesCache = false;
            return this.targets.entities.delete(id);
        } else {
            if (recordHistory) {
                //TODO: 记录历史记录
            }
            this.emit('REMOVE_TARGET', {
                targetID: id,
                mode,
            });
            this.cache_isAlreadyGetEntitiesCache = false;
            return this.targets.modules.delete(id);
        }
    }

    getTarget<T extends TTARGETS>(
        mode: T,
        id: string,
    ): T extends 'entity' ? Entity | undefined : Module | undefined {
        return this.targets[mode === 'entity' ? 'entities' : 'modules'].get(
            id,
        ) as T extends 'entity' ? Entity | undefined : Module | undefined;
    }

    listTargetsInfo<T extends TTARGETS>(
        mode: T,
        useCache = false,
    ): {
        module: IModuleInfo[];
        entity: IEntityInfo[];
    }[T] {
        if (mode === 'entity') {
            // 返回缓存
            if (useCache && this.cache_isAlreadyGetEntitiesCache)
                return this.cache_entitiesInfo as {
                    module: IModuleInfo[];
                    entity: IEntityInfo[];
                }[T];
            const result = Array.from(this.targets.entities.values()).map(target =>
                target.serialize(),
            ) as {
                module: IModuleInfo[];
                entity: IEntityInfo[];
            }[T];
            this.cache_isAlreadyGetEntitiesCache = true;
            this.cache_entitiesInfo = result as IEntityInfo[];
            return result;
        }
        // 返回缓存
        if (useCache && this.cache_isAlreadyGetModulesCache)
            return this.cache_modulesInfo as {
                module: IModuleInfo[];
                entity: IEntityInfo[];
            }[T];
        const result = Array.from(this.targets.modules.values()).map(target =>
            target.serialize(),
        ) as {
            module: IModuleInfo[];
            entity: IEntityInfo[];
        }[T];
        this.cache_isAlreadyGetModulesCache = true;
        this.cache_modulesInfo = result as IModuleInfo[];
        return result;
    }

    /** 列出目标树，这包含着Paths的对应关系 */
    listTargetsInfoTree<T extends TTARGETS>(mode: T, id: null | string = null): TINFO_TREE<T> {
        if (mode === 'entity') {
            const result: TINFO_TREE<'entity'> = [];
            this.listTargetsInfo('entity', true).forEach(target => {
                if (target.parent !== id) return;
                result.push({
                    isFolder: false,
                    target,
                });
            });
            this.getPath.entities.pathsStorage.forEach(path => {
                if (path.parent !== id) return;
                path.children.forEach(child => {
                    if (child.isPath)
                        result.push({
                            isFolder: true,
                            folder: this.paths.entities.getPath(child.id)!,
                            children: this.listTargetsInfoTree(
                                mode,
                                child.id,
                            ) as unknown as TINFO_TREE<'entity'>,
                        });
                    else
                        result.push({
                            isFolder: false,
                            target: this.getTarget('entity', child.id)!.serialize(),
                        });
                });
            });
            return result as TINFO_TREE<T>;
        }
        const result: TINFO_TREE<'module'> = [];
        this.listTargetsInfo('module', true).forEach(target => {
            if (target.parent !== id) return;
            result.push({
                isFolder: false,
                target,
            });
        });
        this.getPath.modules.pathsStorage.forEach(path => {
            if (path.parent !== id) return;
            path.children.forEach(child => {
                if (child.isPath)
                    result.push({
                        isFolder: true,
                        folder: this.paths.modules.getPath(child.id)!,
                        children: this.listTargetsInfoTree(
                            mode,
                            child.id,
                        ) as unknown as TINFO_TREE<'module'>,
                    });
                else
                    result.push({
                        isFolder: false,
                        target: this.getTarget('module', child.id)!.serialize(),
                    });
            });
        });
        return result as TINFO_TREE<T>;
    }
}
type TINFO_TREE<T extends TTARGETS> = {
    entity:
        | { isFolder: true; folder: IPathInfo; children: TINFO_TREE<T> }
        | {
              isFolder: false;
              target: IEntityInfo;
          };
    module:
        | { isFolder: true; folder: IPathInfo; children: TINFO_TREE<T> }
        | {
              isFolder: false;
              target: IModuleInfo;
          };
}[T][];

export { Targets, type TTARGETS, type TINFO_TREE };
