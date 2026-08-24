/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由 AI 生成

/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */

/**
 * 作用域源积木（Scoped Source）
 *
 * 有一类积木需要向自己的内部作用域「发放」一个可以被反复取用的 reporter：
 *
 * - `遍历数组 [] 的每一项 (项)` —— 项
 * - `重复执行 [] 次，当前是第 (次数) 次` —— 次数
 * - `当接收到广播 [] (数据)` —— 数据
 * - `行内函数 (a) (b)` —— 参数
 *
 * 它们的交互完全一致：
 *
 * 1. 宿主积木上有一个**锁定插槽**，用户拖不进任何东西；
 * 2. 宿主自动在该插槽里放一个**源积木**，拖走后立刻长出新的（视觉上「无限拖出」）；
 * 3. 点击源积木可以改名，改名会同步到所有引用它的副本；
 * 4. 源积木通过 `ownerId` + `slotKey` 认亲，复制宿主时子孙会自动改绑到副本。
 *
 * 本文件把上述逻辑收敛为 {@link scopedSourceHost} 与 {@link scopedSourceBlock} 两个混入，
 * 宿主只需声明「有哪些插槽、默认叫什么」。
 */

import * as Blockly from 'blockly/core';
import type { AshConnection } from '../connectionRules';
import { isInFlyoutInsteadOfTrashCan, OPCODES } from './helpers';
import type { TAllCheckers } from '../../../types/blocks';
import type { IFunctionValueBlock } from '../../../components/modal_createFunction/functionPreview';

/** 源积木上显示名字的字段名。 */
const NAME_FIELD = 'NAME';

/** 会导致插槽可能空出来、需要重新补块的事件。 */
const RESYNC_EVENTS: readonly string[] = [
    Blockly.Events.BLOCK_CREATE,
    Blockly.Events.BLOCK_MOVE,
    Blockly.Events.BLOCK_DELETE,
    Blockly.Events.FINISHED_LOADING,
];

/** 一个作用域插槽的描述。 */
export interface IScopedSlot {
    /**
     * 插槽在宿主积木上的 input 名称，例如 `ITEM_NAME`、`PARAM_a1b2`。
     */
    inputName: string;
    /**
     * 稳定标识。单槽宿主可省略（默认取 `inputName`）；
     * 多槽宿主（如函数参数）必须显式给出，否则增删中间项会导致认亲错位。
     */
    key?: string;
    /** 该插槽发放的源积木默认显示名。 */
    defaultName: string;
}

/**
 * 动态槽宿主（如行内函数的参数表）需要额外实现的接口。
 *
 * 固定槽宿主（foreach / repeat / 广播）不需要实现这些。
 */
export interface IDynamicScopedHost extends IScopedSourceHost {
    /** 重建积木形状，由宿主自己实现（增删 input、摆放按钮）。 */
    updateShape(): void;
}

/** 宿主积木需要实现的接口。 */
export interface IScopedSourceHost extends Blockly.Block {
    /** 每个插槽当前的显示名，key 为 {@link IScopedSlot.key}。 */
    scopedNames?: Partial<Record<string, string>>;
    /** 是否允许用户点击源积木修改宿主插槽的名称。 */
    allowScopedRename?: boolean;
    /** 防重入：newBlock 自身会触发 BLOCK_CREATE。 */
    isFillingScopedSlots: boolean;
    /** 声明当前有哪些插槽；宿主形状可变时（函数参数）返回值随之变化。 */
    getScopedSlots(): IScopedSlot[];
    /** 给插槽打锁定标记，并安排首次填充。应在 `init` 末尾调用。 */
    initScopedHost(): void;
    /** 确保每个插槽里都有源积木，缺失则补上。 */
    ensureScopedBlocks(): void;
    /** 保证单个插槽里有正确归属的源积木。 */
    fillScopedSlot(slot: IScopedSlot): void;
    /** 把子孙中仍指向旧宿主的源积木改绑到自己。 */
    rebindDescendants(previousOwnerId: string): void;
    /** 把工作区内所有属于本宿主的源积木标签刷新一遍。 */
    updateScopedLabels(): void;
    /** 重命名某个插槽发放的源积木，并广播到所有副本。 */
    renameScoped(key: string, name: string): void;
    /** 读取某插槽的当前显示名。 */
    getScopedName(key: string): string;
    /**
     * 丢弃一个插槽：清掉它的名字，并销毁工作区里所有引用它的源积木。
     * 动态槽宿主（函数参数）删项时调用。
     */
    discardScopedSlot(key: string): void;
    /** 混入提供的存档/读档。 */
    saveExtraState(): { scopedNames: Partial<Record<string, string>> };
    loadExtraState(state: {
        scopedNames?: Partial<Record<string, string>>;
        itemName?: string;
        countName?: string;
    }): void;
}

/** 源积木需要实现的接口。 */
export interface IScopedSourceBlock extends Blockly.Block {
    ownerId?: string;
    slotKey?: string;
    updateLabel(name: string): void;
}

/**
 * 取插槽连接并断言为携带锁定标记的连接。
 */
function getSlotConnection(block: Blockly.Block, inputName: string): AshConnection | null {
    return (block.getInput(inputName)?.connection as AshConnection | undefined) ?? null;
}

/**
 * 在解锁状态下执行一次连接操作，结束后立刻复位。
 *
 * 锁定插槽默认拒绝一切连接（见 `AshConnectionChecker.doTypeChecks`），
 * 宿主自己放置源积木时必须临时开锁。
 */
function withUnlocked<T>(connection: AshConnection, action: () => T): T {
    const previous = connection.allowScopedSource;
    connection.allowScopedSource = true;
    try {
        return action();
    } finally {
        connection.allowScopedSource = previous ?? false;
    }
}

/**
 * 把函数参数积木的输出对齐到宿主签名里对应字段的 checker。
 *
 * 参数积木的 init 跑在 ownerId / slotKey 赋值之前（newBlock 内部就会调
 * init），在那里读不到宿主；因此统一在宿主绑定时调用本函数。
 *
 * setCheck 会触发 onCheckChanged_ 复检现有连接，而锁定的作用域插槽
 * 在检查器里默认拒绝一切连接，所以必须在临时开锁下进行；
 * 且目标 check 与现状一致时绝不能动，否则每次重绑都会把参数拔下来，
 * 拔下又触发补块事件，陷入无限生成。
 */
function alignParamCheckerWithHost(
    source: IScopedSourceBlock,
    host: IScopedSourceHost,
    slotConnection: Blockly.Connection,
): void {
    if (source.type !== OPCODES.FUNCTION_PARAM) return;
    const fieldData = (host as unknown as Partial<IFunctionValueBlock>).previewData?.[
        Number(source.slotKey)
    ];
    if (!fieldData || fieldData.type === 'text') return;

    const wanted =
        fieldData.type === null || Array.isArray(fieldData.type)
            ? fieldData.type
            : [fieldData.type];
    const output = source.outputConnection;
    if (!output) return;
    const current = output.getCheck();
    const unchanged =
        wanted === null
            ? current === null
            : Array.isArray(wanted) &&
              Array.isArray(current) &&
              wanted.length === current.length &&
              wanted.every((check, index) => check === current[index]);
    if (unchanged) return;

    withUnlocked(slotConnection as AshConnection, () => {
        output.setCheck(wanted);
    });
}

/** {@link scopedSourceHost} 的配置。 */
export interface IScopedSourceHostOptions {
    /** 该宿主发放的源积木 opcode。 */
    sourceType: string;
    /** 声明插槽。传数组表示固定不变；传函数表示形状可变（如函数参数）。 */
    slots: IScopedSlot[] | ((host: IScopedSourceHost) => IScopedSlot[]);
}

/**
 * 宿主积木混入。
 *
 * 用法：
 *
 * ```ts
 * blockly.Blocks[OPCODES.CONTROL_LOOP_FOREACH] = {
 *     ...scopedSourceHost({
 *         sourceType: OPCODES.CONTROL_LOOP_FOREACH_ITEM,
 *         slots: () => [{ inputName: 'ITEM_NAME', defaultName: t('blocks:control.loop.item') }],
 *     }),
 *     init(this: IScopedSourceHost) {
 *         this.jsonInit({ ... });
 *         this.initScopedHost();
 *     },
 * } as IScopedSourceHost;
 * ```
 *
 * 混入不提供 `init`，由各积木自行定义并在末尾调用 `initScopedHost()`。
 */
export function scopedSourceHost(options: IScopedSourceHostOptions) {
    const { sourceType } = options;

    return {
        getScopedSlots(this: IScopedSourceHost): IScopedSlot[] {
            return typeof options.slots === 'function' ? options.slots(this) : options.slots;
        },

        getScopedName(this: IScopedSourceHost, key: string): string {
            const slot = this.getScopedSlots().find(item => (item.key ?? item.inputName) === key);
            return this.scopedNames?.[key] ?? slot?.defaultName ?? '';
        },

        initScopedHost(this: IScopedSourceHost): void {
            this.scopedNames ??= {};
            this.isFillingScopedSlots = false;

            for (const slot of this.getScopedSlots()) {
                const connection = getSlotConnection(this, slot.inputName);
                if (!connection) continue;
                connection.isScopedSourceSlot = true;
                // 同步反序列化紧接着就要恢复子积木，此刻必须放行；
                // 下面的 queueMicrotask 会在其完成后立刻上锁。
                connection.allowScopedSource = true;
            }

            // 从工具箱之外的途径创建积木时（复制、粘贴、代码创建），
            // 也要补上可拖出的源积木。
            queueMicrotask(() => {
                if (this.isDeadOrDying()) return;
                for (const slot of this.getScopedSlots()) {
                    const connection = getSlotConnection(this, slot.inputName);
                    if (connection) connection.allowScopedSource = false;
                }
                this.ensureScopedBlocks();
            });
        },

        onchange(this: IScopedSourceHost, event: Blockly.Events.Abstract): void {
            if (RESYNC_EVENTS.includes(event.type)) this.ensureScopedBlocks();
        },

        ensureScopedBlocks(this: IScopedSourceHost): void {
            if (
                this.isFillingScopedSlots ||
                isInFlyoutInsteadOfTrashCan(this) ||
                this.isDeadOrDying() ||
                this.isInsertionMarker()
            )
                return;

            this.isFillingScopedSlots = true;
            try {
                for (const slot of this.getScopedSlots()) {
                    this.fillScopedSlot(slot);
                }
            } finally {
                this.isFillingScopedSlots = false;
            }
        },

        /**
         * 保证单个插槽里有正确归属的源积木。
         * 已有则重新绑定归属，空缺则新建。
         */
        fillScopedSlot(this: IScopedSourceHost, slot: IScopedSlot): void {
            const connection = getSlotConnection(this, slot.inputName);
            if (!connection) return;

            const key = slot.key ?? slot.inputName;
            const name = this.getScopedName(key);
            const current = connection.targetBlock() as IScopedSourceBlock | null;

            if (current?.type === sourceType) {
                connection.allowScopedSource = false;
                const previousOwnerId = current.ownerId;
                current.ownerId = this.id;
                current.slotKey = key;
                current.updateLabel(name);
                alignParamCheckerWithHost(current, this, connection);

                // 复制整个宿主时，副本内部的源积木仍指向旧宿主，需一并改绑。
                if (previousOwnerId && previousOwnerId !== this.id) {
                    this.rebindDescendants(previousOwnerId);
                }
                return;
            }

            connection.allowScopedSource = false;
            if (current) connection.disconnect();

            const source = this.workspace.newBlock(sourceType) as IScopedSourceBlock;
            source.ownerId = this.id;
            source.slotKey = key;
            source.updateLabel(name);
            alignParamCheckerWithHost(source, this, connection);

            if (this.workspace.rendered) (source as unknown as Blockly.BlockSvg).initSvg();

            const sourceConnection = source.outputConnection;
            if (!sourceConnection) return;

            withUnlocked(connection, () => {
                connection.connect(sourceConnection);
            });

            if (this.workspace.rendered) (source as unknown as Blockly.BlockSvg).render();
        },

        /** 把子孙中仍指向旧宿主的源积木改绑到自己。 */
        rebindDescendants(this: IScopedSourceHost, previousOwnerId: string): void {
            for (const block of this.getDescendants(false)) {
                const source = block as unknown as IScopedSourceBlock;
                if (source.type === sourceType && source.ownerId === previousOwnerId) {
                    source.ownerId = this.id;
                    if (source.slotKey) source.updateLabel(this.getScopedName(source.slotKey));
                }
            }
        },

        updateScopedLabels(this: IScopedSourceHost): void {
            for (const block of this.workspace.getAllBlocks(false)) {
                const source = block as unknown as IScopedSourceBlock;
                if (source.type === sourceType && source.ownerId === this.id && source.slotKey) {
                    source.updateLabel(this.getScopedName(source.slotKey));
                }
            }
        },

        renameScoped(this: IScopedSourceHost, key: string, name: string): void {
            const nextName = name.trim();
            if (!nextName || nextName === this.getScopedName(key) || this.isDeadOrDying()) return;

            const oldState = JSON.stringify(this.saveExtraState());
            this.scopedNames = { ...this.scopedNames, [key]: nextName };
            this.updateScopedLabels();
            const newState = JSON.stringify(this.saveExtraState());

            // 手动补事件，否则 Ctrl+Z 无法撤销重命名。
            if (oldState !== newState) {
                Blockly.Events.fire(
                    new Blockly.Events.BlockChange(this, 'mutation', null, oldState, newState),
                );
            }
        },

        discardScopedSlot(this: IScopedSourceHost, key: string): void {
            // 删掉参数后，散落在函数体里引用它的积木会变成悬空引用，
            // 留着只会让用户困惑，直接销毁。
            for (const block of this.workspace.getAllBlocks(false)) {
                const source = block as unknown as IScopedSourceBlock;
                if (source.type === sourceType && source.ownerId === this.id) {
                    if (source.slotKey === key) source.dispose(false);
                }
            }

            if (this.scopedNames && key in this.scopedNames) {
                const next = { ...this.scopedNames };
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete next[key];
                this.scopedNames = next;
            }
        },

        saveExtraState(this: IScopedSourceHost): {
            scopedNames: Partial<Record<string, string>>;
        } {
            return { scopedNames: this.scopedNames ?? {} };
        },

        loadExtraState(
            this: IScopedSourceHost,
            state: {
                scopedNames?: Partial<Record<string, string>>;
                itemName?: string;
                countName?: string;
            },
        ): void {
            // itemName / countName 是旧版存档字段，读入后归一到 scopedNames。
            const legacy = state.itemName ?? state.countName;
            const slots = this.getScopedSlots();
            this.scopedNames = {
                ...state.scopedNames,
                ...(legacy !== undefined && slots.length === 1
                    ? { [slots[0].key ?? slots[0].inputName]: legacy }
                    : {}),
            };
            this.updateScopedLabels();
        },
    };
}

/** {@link scopedSourceBlock} 的配置。 */
export interface IScopedSourceBlockOptions {
    /** 积木颜色。 */
    colour: string;
    /** 输出类型；`null` 表示万能 reporter。 */
    output?: TAllCheckers | null;
    /**
     * 初始显示名。
     */
    defaultLabel: () => string;
    /** 允许作为宿主的 opcode 列表，用于校验 `ownerId` 指向的积木。 */
    hostTypes: string[];
    /** 弹出重命名对话框；不传则源积木不可改名。 */
    openRenamePrompt?: (context: { currentName: string; commit: (name: string) => void }) => void;
}

/**
 * 源积木混入。
 *
 * 用法：
 *
 * ```ts
 * blockly.Blocks[OPCODES.CONTROL_LOOP_FOREACH_ITEM] = scopedSourceBlock({
 *     colour: BlocksColor.control.tertiary,
 *     hostTypes: [OPCODES.CONTROL_LOOP_FOREACH],
 *     openRenamePrompt: ({ currentName, commit }) => {
 *         void modal.open(PromptModal, {
 *             message: t('blocks:rename.foreachItem.prompt', { message: currentName }),
 *             defaultValue: currentName,
 *             callback: commit,
 *         });
 *     },
 * });
 * ```
 */
export function scopedSourceBlock(options: IScopedSourceBlockOptions) {
    const { colour, output = null, defaultLabel, hostTypes, openRenamePrompt } = options;

    return {
        init(this: IScopedSourceBlock): void {
            this.appendDummyInput().appendField(defaultLabel(), NAME_FIELD);
            this.setOutput(true, output ?? undefined);
            this.setColour(colour);
        },

        updateLabel(this: IScopedSourceBlock, name: string): void {
            // 空名会让积木变成空白，退回默认文本。
            this.getField(NAME_FIELD)?.setValue(name || defaultLabel());
        },

        onchange(this: IScopedSourceBlock, event: Blockly.Events.Abstract): void {
            if (!openRenamePrompt) return;
            if (event.type !== Blockly.Events.CLICK) return;

            const click = event as Blockly.Events.Click;
            if (click.targetType !== Blockly.Events.ClickTarget.BLOCK || click.blockId !== this.id)
                return;

            const owner = this.ownerId
                ? (this.workspace.getBlockById(this.ownerId) as IScopedSourceHost | null)
                : null;
            if (!owner || !hostTypes.includes(owner.type)) return;
            if (owner.allowScopedRename === false) return;

            const key = this.slotKey;
            if (!key) return;

            openRenamePrompt({
                currentName: owner.getScopedName(key),
                commit: name => {
                    owner.renameScoped(key, name);
                },
            });
        },

        saveExtraState(this: IScopedSourceBlock): { ownerId?: string; slotKey?: string } {
            return { ownerId: this.ownerId, slotKey: this.slotKey };
        },

        loadExtraState(
            this: IScopedSourceBlock,
            state: { ownerId?: string; slotKey?: string },
        ): void {
            this.ownerId = state.ownerId;
            this.slotKey = state.slotKey;
        },
    };
}
