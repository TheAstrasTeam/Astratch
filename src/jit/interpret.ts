/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { extraState, fieldString, inputBlock } from './state';
import { OPCODES } from '../types/vm/blocks';
import { evalInput, evalValue, toBoolean, toNumber, toText, applyBinary, cyclic } from './eval';
import type { IJitHost, TBlockState } from './types';

/** 一次脚本运行时的私有状态（stopScript 只影响当前脚本） */
interface IRunState {
    host: IJitHost;
    /** 当前脚本被 stopScript 置真 */
    stopped: boolean;
}

/** 从块的字段/extraState 解析变量 id */
function resolveDataId(block: TBlockState): string {
    const name = fieldString(block, 'NAME');
    return name || (extraState(block).dataId ?? '');
}

/**
 * 递归执行一条 `next` 链：从 start 开始沿 `.next` 依次执行。
 * 子栈（if 分支、循环体）内部再调 `runChain`，wait/stop 能正确嵌套。
 */
async function runChain(start: TBlockState | undefined, run: IRunState): Promise<void> {
    let cur = start;
    while (cur) {
        await runStatement(cur, run);
        if (run.stopped) break;
        cur = cur.next as TBlockState | undefined;
    }
}

/** 执行一个语句块 */
async function runStatement(block: TBlockState, run: IRunState): Promise<void> {
    const host = run.host;
    switch (block.type) {
        // ---- 控制：流程 ----
        case OPCODES.CONTROL_FLOW_WAIT:
            await host.wait(toNumber(evalInput(block, 'DURATION', host)) * 1000);
            break;
        case OPCODES.CONTROL_FLOW_STOPSCRIPT:
            run.stopped = true;
            break;
        case OPCODES.CONTROL_FLOW_STOPPROJECT:
            run.stopped = true;
            host.stopAll();
            break;

        // ---- 控制：条件 ----
        case OPCODES.CONTROL_CONDITION_IF: {
            const es = extraState(block);
            const elseIfCount = es.elseIfCount ?? 0;
            const hasElse = es.hasElse === true;
            if (toBoolean(evalInput(block, 'CONDITION', host))) {
                await runChain(inputBlock(block, 'DO'), run);
                break;
            }
            let matched = false;
            for (let i = 0; i < elseIfCount; i++) {
                const cond = inputBlock(block, 'ELSE_IF_CONDITION_' + String(i));
                if (cond && toBoolean(evalValue(cond, host))) {
                    await runChain(inputBlock(block, 'ELSE_IF_DO_' + String(i)), run);
                    matched = true;
                    break;
                }
            }
            if (!matched && hasElse) await runChain(inputBlock(block, 'ELSE_DO'), run);
            break;
        }

        // ---- 控制：循环 ----
        case OPCODES.CONTROL_LOOP_REPEAT: {
            const times = toNumber(evalInput(block, 'TIMES', host));
            for (let i = 0; i < times; i++) {
                if (run.host.shouldStop() || run.stopped) break;
                await runChain(inputBlock(block, 'DO'), run);
            }
            break;
        }
        case OPCODES.CONTROL_LOOP_WHILE:
            while (toBoolean(evalInput(block, 'CONDITION', host))) {
                if (run.host.shouldStop() || run.stopped) break;
                await runChain(inputBlock(block, 'DO'), run);
            }
            break;

        // ---- 事件：广播 ----
        case OPCODES.EVENT_BROADCAST_SEND:
            await host.broadcast(
                toText(evalInput(block, 'CHANNEL', host)),
                evalInput(block, 'DATA', host),
            );
            break;

        // ---- 实体：变换 ----
        case OPCODES.ENTITY_TRANSFORM_POSITION_MOVESTEP: {
            const steps = toNumber(evalInput(block, 'STEPS', host));
            const portal = host.readPortal();
            const rad = (cyclic(portal.direction, 360) * Math.PI) / 180;
            host.patchPortal({
                x: portal.x + Math.sin(rad) * steps,
                y: portal.y + Math.cos(rad) * steps,
            });
            break;
        }
        case OPCODES.ENTITY_TRANSFORM_DIRECTION_SETDIRECTION:
            host.patchPortal({ direction: cyclic(toNumber(evalInput(block, 'UNIT', host)), 360) });
            break;
        case OPCODES.ENTITY_TRANSFORM_SCALE_SETSCALE:
            host.patchPortal({ size: toNumber(evalInput(block, 'UNIT', host)) });
            break;
        case OPCODES.ENTITY_APPEARANCE_VISIBILITY_SET:
            host.patchPortal({ visible: toText(evalInput(block, 'VISIBILITY', host)) === '_SHOW_' });
            break;

        // ---- 数据：变量 ----
        case OPCODES.DATA_VARIABLE_SET:
            host.writeVariable(resolveDataId(block), evalInput(block, 'VALUE', host));
            break;
        case OPCODES.DATA_VARIABLE_ADD: {
            const dataId = resolveDataId(block);
            host.writeVariable(dataId, toNumber(host.readVariable(dataId)) + toNumber(evalInput(block, 'VALUE', host)));
            break;
        }
        case OPCODES.DATA_VARIABLE_COMPUTE: {
            const dataId = resolveDataId(block);
            const current = toNumber(host.readVariable(dataId));
            const incoming = toNumber(evalInput(block, 'VALUE', host));
            const operand = toText(evalInput(block, 'OPERATOR', host));
            host.writeVariable(dataId, applyBinary(operand, current, incoming));
            break;
        }

        // 帽子 / 其它：不产生行为，安全跳过
        default:
            break;
    }
}

/**
 * 解释器入口：运行一个脚本（root 常为 hat）。
 * hat 自身不产生行为，从其 `next` 开始执行。
 */
export async function interpretScript(root: TBlockState, host: IJitHost): Promise<void> {
    const run: IRunState = { host, stopped: false };
    const isHat = root.type === OPCODES.EVENT_LIFECYCLE_ONSTART || root.type === OPCODES.EVENT_BROADCAST_LISTEN;
    await runChain(isHat ? (root.next as TBlockState | undefined) : root, run);
}