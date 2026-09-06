/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { OPCODES } from '../src/types/vm/blocks';
import {
    compileScript,
    interpretScript,
    JitEngine,
    type IJitHost,
    type IPortalState,
    type TBlockState,
} from '../src/jit';

/** 简化 Blockly 序列化状态构造 */
function stm(
    type: string,
    opts: {
        fields?: Record<string, unknown>;
        inputs?: Record<string, { block: TBlockState | null; shadow: TBlockState | null }>;
    } = {},
): TBlockState {
    return {
        id: 'b-' + Math.random().toString(36).slice(2),
        type,
        x: 0,
        y: 0,
        fields: opts.fields ?? {},
        inputs: opts.inputs ?? {},
        next: null,
    } as unknown as TBlockState;
}

function num(n: number): TBlockState {
    return stm(OPCODES.math_number, { fields: { NUM: n } });
}

function input(b: TBlockState | undefined): { block: TBlockState | null; shadow: TBlockState | null } {
    return { block: b ?? null, shadow: null };
}

/** 数值变量写照块，字段 NAME 存变量名（与 vm 适配一致） */
function varSet(name: string, value: TBlockState): TBlockState {
    return stm(OPCODES.DATA_VARIABLE_SET, { fields: { NAME: name }, inputs: { VALUE: input(value) } });
}

function moveStep(steps: TBlockState): TBlockState {
    return stm(OPCODES.ENTITY_TRANSFORM_POSITION_MOVESTEP, { inputs: { STEPS: input(steps) } });
}

function waitSec(secs: TBlockState): TBlockState {
    return stm(OPCODES.CONTROL_FLOW_WAIT, { inputs: { DURATION: input(secs) } });
}

/** 把一段语句串成 next 链，root 常为 hat */
function chain(root: TBlockState, ...body: TBlockState[]): TBlockState {
    let prev = root;
    for (const s of body) {
        (prev as { next: TBlockState | null }).next = s;
        prev = s;
    }
    return root;
}

class MockHost implements IJitHost {
    vars = new Map<string, unknown>();
    portal: IPortalState = { x: 0, y: 0, direction: 90, size: 100, visible: true };
    slept = 0;
    now(): number {
        return 0;
    }
    readVariable(id: string): unknown {
        return this.vars.get(id);
    }
    writeVariable(id: string, v: unknown): void {
        this.vars.set(id, v);
    }
    readPortal(): IPortalState {
        return { ...this.portal };
    }
    patchPortal(p: Partial<IPortalState>): void {
        Object.assign(this.portal, p);
    }
    hasBroadcastListener(_channel: string): boolean {
        return false;
    }
    wait(ms: number): Promise<void> {
        this.slept += ms;
        return Promise.resolve();
    }
    broadcast(_channel: string, _data: unknown): Promise<void> {
        return Promise.resolve();
    }
    log(..._args: unknown[]): void {}
    shouldStop(): boolean {
        return false;
    }
    stopAll(): void {}
    readBroadcastData(): unknown {
        return undefined;
    }
}

function buildSampleRoot(): TBlockState {
    const root = stm(OPCODES.EVENT_LIFECYCLE_ONSTART);
    return chain(root, varSet('counter', num(10)), moveStep(num(5)), waitSec(num(2)));
}

describe('JIT 与解释器共享语义', () => {
    it('解释器与 JIT 对同一脚本产出相同最终状态', async () => {
        const jitHost = new MockHost();
        const interpHost = new MockHost();
        await compileScript(buildSampleRoot())(jitHost);
        await interpretScript(buildSampleRoot(), interpHost);

        expect(jitHost.vars.get('counter')).toBe(10);
        expect(interpHost.vars.get('counter')).toBe(10);
        // 方向 90°：sin90°=1 → x 前进 5，y 不变
        expect(jitHost.portal.x).toBeCloseTo(5);
        expect(jitHost.portal.y).toBeCloseTo(0);
        expect(interpHost.portal.x).toBeCloseTo(5);
        expect(interpHost.portal.y).toBeCloseTo(0);
        expect(jitHost.slept).toBe(2000);
        expect(interpHost.slept).toBe(2000);
        expect(jitHost.portal).toEqual(interpHost.portal);
        expect(jitHost.vars).toEqual(interpHost.vars);
    });

    it('引擎遇 JIT 不支持的块时自动回退解释器', async () => {
        const host = new MockHost();
        const engine = new JitEngine(host, { preferJit: true });
        const root = chain(
            stm(OPCODES.EVENT_LIFECYCLE_ONSTART),
            varSet('a', num(1)),
            stm('custom_unsupported_block'),
        );
        engine.load([root]);
        await engine.start();

        expect(engine.stats.interpreted).toBe(1);
        expect(engine.stats.compiled).toBe(0);
        expect(host.vars.get('a')).toBe(1);
    });

    it('纯 JIT（避开 instanceof 子类）对受支持脚本直接编译执行', async () => {
        const host = new MockHost();
        const engine = new JitEngine(host, { preferJit: true });
        engine.load([buildSampleRoot()]);
        await engine.start();

        expect(engine.stats.compiled).toBe(1);
        expect(host.vars.get('counter')).toBe(10);
    });
});