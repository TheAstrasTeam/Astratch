/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Blockly from 'blockly/core';

/** Astratch 的积木在运行期以 Blockly 序列化状态存在。 */
export type TBlockState = Blockly.serialization.blocks.State;

/** 解释器/JIT 可读取、可修改的"实体"最小状态。 */
export interface IPortalState {
    x: number;
    y: number;
    direction: number;
    size: number;
    visible: boolean;
}

/**
 * 宿主接口：把 JIT 引擎与 VM/实体/时钟解耦。
 * VM 侧用 adapter 实现它，src/jit 因此保持自包含。
 */
export interface IJitHost {
    /** 按 dataId 读取变量，不存在返回 undefined */
    readVariable(dataId: string): unknown;
    /** 写变量 */
    writeVariable(dataId: string, value: unknown): void;
    /** 读取实体状态 */
    readPortal(): IPortalState;
    /** 增量更新实体状态 */
    patchPortal(patch: Partial<IPortalState>): void;
    /** 判断一个广播频道当前是否有沉睡监听者（用于短路优化） */
    hasBroadcastListener(channel: string): boolean;
    /** 时钟源（可注入假时钟以便测试） */
    now(): number;
    /** 挂起当前脚本指定毫秒数（真实/假时钟由 wait 实现决定，引擎只在这里 await） */
    wait(ms: number): Promise<void>;
    /** 发送广播并（若有需立即响应者）等待其进入队列 */
    broadcast(channel: string, data: unknown): Promise<void>;
    /** 输出调试信息 */
    log(...args: unknown[]): void;
    /** 抛出当前脚本运行旗标（被 stopScript/事件唤醒打断） */
    shouldStop(): boolean;
    /** 停止整个项目（stopProject） */
    stopAll(): void;
    /** 读取"当前广播携带的数据"（由引擎在派发监听者前设置） */
    readBroadcastData(): unknown;
}

/**
 * 一个"脚本"：串起来的块在块图中从某个块开始（通常是 hat），
 * 由 `next` 串联；engine 把每个 hat 整理成一个 {@link IScript}。
 */
export interface IScript {
    /** 触发源块（hat）的类型 */
    hatOpcode: string;
    /** 触发后要执行的整棵块状态（含子输入） */
    root: TBlockState;
}