/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IRenderer, RendererBackend } from './types';
import { WebGLRenderer } from './backend/webglRenderer';
import { WebGPURenderer } from './backend/webgpuRenderer';

/** 当前浏览器是否暴露了 WebGPU 入口 */
function supportsGPU(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/** 是否可用 WebGL 上下文（WebGL2 或 WebGL1） */
function supportsWebGL(): boolean {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null;
}

/**
 * 探测本环境优先可用的后端。仅作展示/降级提示用；
 * 实际创建以 {@link createRenderer} 为准。
 */
export async function detectBackend(): Promise<RendererBackend> {
    if (supportsGPU()) {
        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (adapter) return 'webgpu';
        } catch {
            // adapter 异常，落到 WebGL
        }
    }
    if (supportsWebGL()) return 'webgl';
    return 'none';
}

/**
 * 创建渲染器。优先 WebGPU（Astratch 主打），失败自动降级到 WebGL，
 * 两者皆不可用时返回 `null`（调用方应给出降级提示）。
 *
 * @param canvas 最终承载绘图的 canvas
 */
export async function createRenderer(canvas: HTMLCanvasElement): Promise<IRenderer | null> {
    if (supportsGPU()) {
        try {
            // 用临时 canvas 探测，避免把真实 canvas 绑死在 WebGPU 后再想降级
            const probe = document.createElement('canvas').getContext('webgpu');
            if (probe) {
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter) {
                    const device = await adapter.requestDevice();
                    const context = canvas.getContext('webgpu');
                    if (context) {
                        context.configure({
                            device,
                            format: navigator.gpu.getPreferredCanvasFormat(),
                        });
                        return new WebGPURenderer(device, context);
                    }
                    device.destroy(); // 真实 canvas 拿不到 webgpu 上下文，放弃
                }
            }
        } catch {
            // WebGPU 初始化失败，正常降级
        }
    }

    if (supportsWebGL()) return new WebGLRenderer();
    return null;
}
