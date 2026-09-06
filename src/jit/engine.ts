/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { inputBlock } from './state';
import { OPCODES } from '../types/vm/blocks';
import { compileScript, JitUnsupportedError } from './compiler';
import { interpretScript } from './interpret';
import { evalValue, toText } from './eval';
import type { IJitHost, TBlockState } from './types';

export interface IJitEngineOptions {
    /** 脚本尽量走 JIT；为 false 则强制解释器（用于对照测试） */
    preferJit?: boolean;
}

interface IBroadcastListener {
    root: TBlockState;
}

/** 引擎运行统计 */
export interface IJitStats {
    compiled: number;
    interpreted: number;
}

/**
 * JIT 引擎：把工作区里的 hat 脚本收集起来，运行期逐脚本选择
 * "编译后闭包(JIT)"或"树遍历解释器"，二者共享同一套语义，结果一致。
 */
export class JitEngine {
    readonly host: IJitHost;
    readonly stats: IJitStats = { compiled: 0, interpreted: 0 };

    private preferJit: boolean;
    private starts: TBlockState[] = [];
    private listeners: IBroadcastListener[] = [];
    private active = new Set<Promise<void>>();
    private disposed = false;

    constructor(host: IJitHost, options: IJitEngineOptions = {}) {
        this.host = host;
        this.preferJit = options.preferJit ?? true;
    }

    /** 载入工作区根块列表（每根都可能是一个脚本入口） */
    load(roots: readonly TBlockState[]): void {
        this.starts = [];
        this.listeners = [];
        for (const root of roots) {
            if (root.type === OPCODES.EVENT_LIFECYCLE_ONSTART) this.starts.push(root);
            else if (root.type === OPCODES.EVENT_BROADCAST_LISTEN) this.listeners.push({ root });
        }
    }

    private track(run: Promise<void>): void {
        this.active.add(run);
        void run.finally(() => {
            this.active.delete(run);
        });
    }

    /** 等待所有当前脚本（含广播派发的）结束 */
    async idle(): Promise<void> {
        await Promise.all([...this.active]);
    }

    /** 停止项目：中断所有脚本 */
    stop(): void {
        this.host.stopAll();
    }

    /** 开始项目：并发执行所有 onStart 脚本 */
    start(): Promise<void> {
        for (const root of this.starts) this.track(this.runRoot(root));
        return this.idle();
    }

    /** 发送广播：派发到频道匹配的监听者 */
    broadcast(channel: string, _data: unknown): Promise<void> {
        for (const listener of this.listeners) {
            if (this.evalListenChannel(listener.root) === channel) {
                this.track(this.runRoot(listener.root));
            }
        }
        return this.idle();
    }

    /** 当前是否注册了关注指定频道的广播监听者 */
    hasListener(channel: string): boolean {
        for (const listener of this.listeners) {
            if (this.evalListenChannel(listener.root) === channel) return true;
        }
        return false;
    }

    /** 求监听者关注的广播频道 */
    private evalListenChannel(root: TBlockState): string {
        const channelBlock = inputBlock(root, 'CHANNEL');
        if (!channelBlock) return '';
        return toText(evalValue(channelBlock, this.host));
    }

    /** 单脚本运行：JIT 优先，回退解释器 */
    private async runRoot(root: TBlockState): Promise<void> {
        if (this.disposed) return;
        if (this.preferJit) {
            try {
                const runner = compileScript(root);
                this.stats.compiled++;
                await runner(this.host);
                return;
            } catch (error) {
                if (!(error instanceof JitUnsupportedError)) throw error;
                // 该脚本含 JIT 不支持的结构，回退解释器
            }
        }
        this.stats.interpreted++;
        await interpretScript(root, this.host);
    }

    dispose(): void {
        this.disposed = true;
        this.stop();
        this.starts = [];
        this.listeners = [];
    }
}