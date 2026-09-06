/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { JitEngine } from '../../jit';
import type { IJitHost, IPortalState } from '../../jit';
import type { ITarget, IVM, TEvents } from '../../types/vm/vm';

/** 简单的可中止等待：真实毫秒计时，abort 后立即返回 */
function sleep(ms: number, aborted: () => boolean): Promise<void> {
    return new Promise(resolve => {
        if (ms <= 0) {
            resolve();
            return;
        }
        const t0 = Date.now();
        const tick = () => {
            if (aborted() || Date.now() - t0 >= ms) resolve();
            else setTimeout(tick, Math.min(16, ms - (Date.now() - t0) || 16));
        };
        tick();
    });
}

/**
 * 项目执行器：把一个 VM 里的所有目标交给 JIT 引擎跑。
 * 它是"改的东西被真正调用"的入口——runProject 会真实加载并执行目标脚本。
 */
export class ProjectExecutor {
    private aborted = true;
    private engines: JitEngine[] = [];
    private visible = new Map<string, boolean>();
    private payload: unknown = undefined;
    private readonly vm: IVM;

    constructor(vm: IVM) {
        this.vm = vm;
    }

    get isRunning(): boolean {
        return !this.aborted;
    }

    /** 运行项目：为每个 target 建一个引擎（JIT 优先，自动回退解释器） */
    async start(): Promise<void> {
        this.aborted = false;
        this.visible.clear();
        this.engines = [];
        for (const target of this.vm.runtime.targets.values()) {
            const engine = new JitEngine(this.hostFor(target));
            engine.load(target.blocks._workspace.blocks.blocks);
            this.engines.push(engine);
        }
        // 通知 UI 开始执行
        this.vm.emit('execution_set_running' as TEvents, { running: true });
        await Promise.all(this.engines.map(engine => engine.start())).then(() => undefined);
    }

    /** 停止项目 */
    stop(): void {
        this.aborted = true;
        for (const engine of this.engines) engine.stop();
        this.vm.emit('execution_set_running' as TEvents, { running: false });
    }

    private hostFor(target: ITarget): IJitHost {
        return {
            readVariable: dataId => {
                const found = this.vm.runtime.getTargetByID(target.id)?.getData(dataId) ?? null;
                return found?.data;
            },
            writeVariable: (dataId, value) => {
                const current = this.vm.runtime.getTargetByID(target.id)?.getData(dataId);
                if (current) current.data = value;
            },
            readPortal: (): IPortalState => ({
                x: target.x ?? 0,
                y: target.y ?? 0,
                direction: target.direction ?? 90,
                size: target.size ?? 100,
                visible: this.visible.get(target.id) ?? true,
            }),
            patchPortal: patch => {
                if (patch.x !== undefined) target.x = patch.x;
                if (patch.y !== undefined) target.y = patch.y;
                if (patch.direction !== undefined) target.direction = patch.direction;
                if (patch.size !== undefined) target.size = patch.size;
                if (patch.visible !== undefined) this.visible.set(target.id, patch.visible);
            },
            now: () => Date.now(),
            wait: ms => sleep(ms, () => this.aborted),
            hasBroadcastListener: channel => this.engines.some(engine => engine.hasListener(channel)),
            broadcast: (channel, data) => {
                this.payload = data;
                return Promise.all(this.engines.map(engine => engine.broadcast(channel, data))).then(
                    () => undefined,
                );
            },
            log: (...args) => {
                // 统一走 UI 调试通道
                this.vm.emit('execution_log' as TEvents, { text: args.map(String).join(' ') });
            },
            shouldStop: () => this.aborted,
            stopAll: () => {
                this.stop();
            },
            readBroadcastData: () => this.payload,
        };
    }
}