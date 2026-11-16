import type { IEvents } from 'astratch-core';
import type { IVMEventsType } from '../../vm';
import type { Targets, TTARGETS } from '.';

interface IPathInfo {
    /** 顶层为null */
    parent: string | null;
    children: { isPath: boolean; id: string }[];

    name: string;
    id: string;

    color: string;
}

interface IPathSubmitInfo {
    /** 顶层为null */
    parent?: string | null;
    children?: { isPath: boolean; id: string }[];

    name: string;
    id?: string;

    color?: string;
}

/** 关于管理目录的类 */
class Path {
    private emit: IEvents<IVMEventsType>['emit'];
    private Targets: Targets;
    pathsStorage: Map<
        // id
        string,
        IPathInfo
    >;
    mode: TTARGETS;

    constructor(Targets: Targets, emitMethod: IEvents<IVMEventsType>['emit'], mode: TTARGETS) {
        this.pathsStorage = new Map();
        this.emit = emitMethod;
        this.mode = mode;
        this.Targets = Targets;
    }

    addPath(info: IPathSubmitInfo): string {
        const id = info.id ?? crypto.randomUUID();
        const pathInfo = {
            ...info,
            id,
            parent: info.parent ?? null,
            children: info.children ?? [],
            color: info.color ?? '#ffffff',
        } satisfies IPathInfo;
        if (pathInfo.parent) {
            if (!this.getPath(pathInfo.parent))
                throw new Error(`[Path]"${pathInfo.parent}" is not found`);
            this.getPath(pathInfo.parent)!.children.push({ isPath: true, id });
        }

        this.pathsStorage.set(id, pathInfo);

        this.emit('ADD_PATH', {
            mode: this.mode,
            pathID: id,
        });
        return id;
    }

    getPath(id: string) {
        return this.pathsStorage.get(id);
    }

    /**
     * @param removeTargets 若为true，则会删除目录，否则会移动所有targets到自己的上层
     */
    deletePath(id: string, removeTargets = false) {
        const path = this.getPath(id);
        if (!path) return;

        path.children.forEach(child => {
            if (child.isPath) this.deletePath(child.id, removeTargets);
            else {
                if (removeTargets) this.Targets.removeTarget(this.mode, id);
                else
                    this.Targets.getTarget(this.mode, child.id)?.setParent(
                        this.getPath(id)?.parent ?? null,
                    );
            }
        });

        this.emit('DELETE_PATH', {
            pathID: id,
            mode: this.mode,
        });
    }
}

export { Path, type IPathSubmitInfo, type IPathInfo };
