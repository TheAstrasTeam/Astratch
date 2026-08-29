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
    type TFlatBlocks,
    type TTargetInfo,
    type TTargetMode,
    type TViewportUpdateEvent,
} from '../../types/vm/vm';
import {
    OPCODES,
    type ICustomFunction,
    type IFunctionReference,
    type IWorkspaceState,
} from '../../types/vm/blocks';
import { spawnRandomString } from '../../utils/ash-data';
import { sendError } from '../../utils/debug';
import { t } from 'i18next';
import type * as Blockly from 'blockly/core';

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

    private isUsingCustomFunction(id: string): boolean {
        const blocks = this.flatBlocks();
        const blockMap = new Map(blocks.map(b => [b.id, b]));

        return blocks.some(block => {
            if (block.type !== OPCODES.FUNCTION_VALUE) return false;
            const functionRef = (
                block.extraState as { functionRef?: IFunctionReference } | null | undefined
            )?.functionRef;
            if (functionRef?.functionId !== id) return false;

            const parentBlock = blockMap.get(block.parentID ?? '');
            // 孤儿也是未使用，得有爸爸才不让删
            return parentBlock ? parentBlock.type !== OPCODES.FUNCTION_DEFINITION : false;
        });
    }

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
        // data / function 是 Map，JSON 序列化会变成 {} 导致数据丢失，这里存成数组
        json.data = Array.from(this.data.values());
        json.function = Array.from(this.function.values());
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
            id,
            targetID: this.id,
        });
        return true;
    }

    replaceCustomFunction(id: string, meta: ICustomFunction) {
        if (!this.function.has(id)) {
            sendError(t('vm:err.customFunction.inexistent'));
            return false;
        }
        this.function.set(id, meta);
        this.emit(events.UPDATE_PROJECT);
        this.emit(events.EDIT_CUSTOM_FUNCTION, {
            id,
            targetID: this.id,
        });
        return true;
    }

    removeCustomFunction(id: string) {
        if (!this.function.has(id)) {
            sendError(t('vm:err.customFunction.inexistent'));
            return false;
        }
        if (this.isUsingCustomFunction(id)) {
            sendError(t('vm:err.customFunction.using'), 'warn');
            return false;
        }
        this.function.delete(id);
        this.emit(events.UPDATE_PROJECT);
        this.emit(events.REMOVE_CUSTOM_FUNCTION, {
            id,
            targetID: this.id,
        });
        return true;
    }

    getFunction(id: string) {
        return this.function.get(id) ?? null;
    }

    listFunctions() {
        return [...this.function.values()] as readonly ICustomFunction[];
    }

    flatBlocks() {
        const result: TFlatBlocks[] = [];
        const flatBlock = (
            block: Partial<Blockly.serialization.blocks.State> & { parentID?: string },
        ) => {
            if (!block.type || !block.id) return;
            result.push(block as TFlatBlocks);
            if (block.inputs) {
                Object.values(block.inputs).forEach(input => {
                    flatBlock({ ...(input.block ?? {}), parentID: block.id ?? '' });
                });
            }
            if (block.next) {
                flatBlock({ ...block.next, parentID: block.id ?? '' });
            }
        };
        const blocks = this.blocks._workspace.blocks.blocks;
        blocks.forEach(blockGroup => {
            flatBlock(blockGroup);
        });
        return result;
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
        // 默认模板的 data / function 是序列化数组形式，排除掉，保留构造器初始化的空 Map
        const { data: _data, function: _function, ...defaultsRest } = structuredClone(defaults);
        void _data;
        void _function;
        Object.assign(target, defaultsRest, {
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
        // 保存时 data / function 以数组存储，这里还原为 Map；
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
        const customFunctions: unknown = json.function;
        if (customFunctions instanceof Map) {
            target.function = customFunctions as Map<string, ICustomFunction>;
        } else if (Array.isArray(customFunctions)) {
            const functions = customFunctions as ICustomFunction[];
            target.function = new Map(functions.map(fn => [fn.id, fn]));
        } else {
            target.function = new Map();
        }
        return target;
    }
}

export default Target;
