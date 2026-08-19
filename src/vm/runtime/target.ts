/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    events,
    type IEntityInfo,
    type ITarget,
    type ITargetMeta,
    type IVariable,
    type TEmit,
    type TTargetInfo,
    type TTargetMode,
    type TViewportUpdateEvent,
} from '../../types/vm';
import type { ICustomFunction, IWorkspaceState } from '../../types/blocks';
import { spawnRandomString } from '../../utils/ash-data';
import { sendError } from '../../utils/debug';
import { t } from 'i18next';

/**
 * 目标
 */
class Target implements ITarget {
    name: string;
    id: string;
    blocks: ITarget['blocks'];
    comments: ITarget['comments'];
    size?: number;
    direction?: number;
    currentCostume?: number;
    effects?: ITarget['effects'];
    volume?: number;
    x?: number;
    y?: number;
    parentID: string | null;
    mode: TTargetMode;
    viewX: number;
    viewY: number;
    viewScale: number;
    links: string[];
    data: Map<string, IVariable>;
    function: Map<string, ICustomFunction>;

    private emit: TEmit;

    constructor(emit: TEmit) {
        this.emit = emit;
        this.name = '';
        this.id = '';
        this.blocks = {
            _workspace: {
                blocks: {
                    languageVersion: 0,
                    blocks: [],
                },
            },
            _script: [],
        };
        this.comments = {};
        this.parentID = null;
        this.mode = 'entity';
        this.viewX = 0;
        this.viewY = 0;
        this.viewScale = 1;
        this.links = [];
        this.data = new Map();
        this.function = new Map();
    }

    rename(name: string) {
        this.name = name;
        this.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    setParent(parentID: string | null) {
        this.parentID = parentID;
        this.emit(events.UPDATE_TARGET_STRUCTURE);
    }

    addLink(linkTargetID: string): boolean {
        if (linkTargetID === this.id) {
            sendError(t('vm:err.link.linkSelf'), 'warn');
            return false;
        }
        this.links.push(linkTargetID);
        this.emit(events.UPDATE_PROJECT);
        return true;
    }

    removeLink(linkTargetID: string) {
        this.links = this.links.filter(id => id !== linkTargetID);
        this.emit(events.UPDATE_PROJECT);
    }

    setBlocks(state: IWorkspaceState) {
        this.blocks._workspace = state;
        this.emit(events.UPDATE_PROJECT);
    }

    setViewport(data: TViewportUpdateEvent) {
        if (data.changed === 'position') {
            this.viewX = data.x;
            this.viewY = data.y;
        } else {
            this.viewScale = data.scale;
        }
    }

    createData(name: string, data: unknown, isPrivate = false, isConst = false): string {
        this.data.forEach(targetData => {
            if (targetData.name === name) sendError(t('vm:err.variable.nameExisting'));
        });
        const id = spawnRandomString();
        this.data.set(id, {
            id,
            name,
            data,
            isPrivate,
            isConst,
        });
        this.emit(events.UPDATE_PROJECT);
        this.emit(events.CREATE_DATA, {
            targetID: this.id,
            dataID: id,
        });
        return id;
    }

    getData(dataID: string) {
        return this.data.get(dataID) ?? null;
    }

    cloneAsNode() {
        return Object.assign(Object.create(Target.prototype), this, {
            type: 'target',
        }) as ITarget & { type: 'target' };
    }

    toJSON() {
        const json = Object.fromEntries(Object.entries(this).filter(([key]) => key !== 'blocks'));
        // data 是 Map，JSON 序列化会变成 {} 导致数据丢失，这里存成数组
        json.data = Array.from(this.data.values());
        return json as TTargetInfo;
    }

    addCustomFunction(id: string, meta: ICustomFunction) {
        if (this.function.has(id)) {
            sendError(t('vm:err.customFunction.existing'));
            return false;
        }
        this.function.set(id, meta);
        this.emit(events.UPDATE_PROJECT);
        this.emit(events.CREATE_CUSTOM_FUNCTION, {
            id
        });
        return true;
    }

    static fromMeta(
        meta: ITargetMeta,
        defaults: TTargetInfo,
        entityInfo: IEntityInfo,
        emit: TEmit,
    ): Target {
        const id = meta.id ?? crypto.randomUUID();
        const mode = meta.mode ?? defaults.mode;
        const target = new Target(emit);
        Object.assign(target, structuredClone(defaults), {
            id,
            name: meta.name ?? defaults.name,
            parentID: meta.parent ?? defaults.parentID,
            mode,
        });
        if (mode === 'entity') Object.assign(target, structuredClone(entityInfo));
        return target;
    }

    static fromJSON(json: TTargetInfo, emit: TEmit): Target {
        const target = new Target(emit);
        Object.assign(target, json);
        // 保存时 data 以数组存储，这里还原为 Map；
        // 兼容旧版本：可能是 Map，也可能是 JSON 序列化丢失后的 {}
        const data: unknown = json.data;
        if (data instanceof Map) {
            target.data = data as Map<string, IVariable>;
        } else if (Array.isArray(data)) {
            const variables = data as IVariable[];
            target.data = new Map(variables.map(variable => [variable.id, variable]));
        } else {
            target.data = new Map();
        }
        return target;
    }
}

export default Target;
