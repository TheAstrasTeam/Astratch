/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IRenderCommand, IRenderer, IStageBackground, IStageGeometry } from '../types';
import { composeModel, composeView } from '../matrix';

/**
 * WGSL 着色器。与 WebGL 后端保持同一套数学约定：
 * 顶点用 `u.size` 把 unit quad 拉伸到像素尺寸并居中，
 * `u.model` 把像素坐标变换到舞台坐标，`u.view` 把舞台坐标映射到裁剪空间。
 *
 * 纹理纵向约定与 WebGL 端一致：quad 顶部对应图片顶部
 * （GL 端用 UNPACK_FLIP_Y，这里用 `uv.y = 1.0 - a_position.y`）。
 */
const WGSL_SOURCE = `
struct SpriteUniforms {
    model: mat4x4<f32>,
    view: mat4x4<f32>,
    size: vec2<f32>,
    tint: vec4<f32>,
    brightness: f32,
};

@group(0) @binding(0) var<uniform> u: SpriteUniforms;
@group(0) @binding(1) var tex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

struct VsOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@vertex
fn vs(@location(0) a_position: vec2<f32>) -> VsOut {
    var out: VsOut;
    let p = (a_position - vec2<f32>(0.5, 0.5)) * u.size;
    let world = u.model * vec4<f32>(p, 0.0, 1.0);
    out.pos = u.view * world;
    out.uv = vec2<f32>(a_position.x, 1.0 - a_position.y);
    return out;
};

@fragment
fn fs(in: VsOut) -> @location(0) vec4<f32> {
    let c = textureSample(tex, samp, in.uv);
    let b = u.brightness / 100.0;
    let rgb = clamp(c.rgb * u.tint.rgb + vec3<f32>(b, b, b), vec3<f32>(0.0, 0.0, 0.0), vec3<f32>(1.0, 1.0, 1.0));
    return vec4<f32>(rgb, c.a * u.tint.a);
};
`;

/**
 * SpriteUniforms 内存布局（uniform 地址空间，列主序）：
 *   model       offset  0  idx  0..15
 *   view        offset 64  idx 16..31
 *   size        offset128  idx 32..33
 *   tint(vec4)  offset144  idx 36..39   （vec4 对齐 16，跳过 idx 34/35）
 *   brightness  offset160  idx 40
 *   总大小 176（对齐到 16）
 */
const UNIFORM_BYTES = 176;

/** unit quad（与 WebGL 端一致），y 分量 0=顶部 */
const QUAD = new Float32Array([0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1]);

interface ITextureEntry {
    texture: GPUTexture;
    view: GPUTextureView;
}

const NULL_BACKGROUND: IStageBackground = { color: [0, 0, 0, 255] };

/**
 * WebGPU 渲染后端。设备与 canvas 上下文由工厂在异步探测完成后创建，
 * 因此本类构造时即已就绪（`mount` 同步）。
 */
export class WebGPURenderer implements IRenderer {
    readonly backend = 'webgpu' as const;

    private readonly device: GPUDevice;
    private readonly context: GPUCanvasContext;
    private readonly format: GPUTextureFormat;

    private pipeline: GPURenderPipeline | null = null;
    private sampler: GPUSampler | null = null;
    private vertexBuffer: GPUBuffer | null = null;
    private textures = new Map<string, ITextureEntry>();
    private uniformBuffers = new Map<string, GPUBuffer>();

    private background: IStageBackground = NULL_BACKGROUND;

    constructor(device: GPUDevice, context: GPUCanvasContext) {
        this.device = device;
        this.context = context;
        this.format = navigator.gpu.getPreferredCanvasFormat();
    }

    mount(canvas: HTMLCanvasElement, geometry: IStageGeometry, background: IStageBackground): void {
        const device = this.device;
        void canvas;
        void geometry; // 渲染尺寸以每次 render 传入的 geometry 为准
        this.background = background;

        this.sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'nearest',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        });

        this.pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: device.createShaderModule({ code: WGSL_SOURCE }),
                entryPoint: 'vs',
                buffers: [
                    {
                        arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
                        attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
                    },
                ],
            },
            fragment: {
                module: device.createShaderModule({ code: WGSL_SOURCE }),
                entryPoint: 'fs',
                targets: [{ format: this.format, blend: straightBlend() }],
            },
            primitive: { topology: 'triangle-list' },
            multisample: { count: 1 },
        });

        this.vertexBuffer = device.createBuffer({
            size: QUAD.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.vertexBuffer, 0, QUAD);
    }

    createTexture(id: string, bitmap: ImageBitmap): unknown {
        const device = this.device;
        const old = this.textures.get(id);
        if (old) old.texture.destroy(); // 幂等替换，避免悬空纹理
        const texture = device.createTexture({
            size: { width: bitmap.width, height: bitmap.height },
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        device.queue.copyExternalImageToTexture(
            { source: bitmap },
            { texture },
            { width: bitmap.width, height: bitmap.height },
        );
        this.textures.set(id, { texture, view: texture.createView() });
        return id;
    }

    disposeTexture(id: string): void {
        const entry = this.textures.get(id);
        if (entry) {
            entry.texture.destroy();
            this.textures.delete(id);
        }
    }

    render(commands: readonly IRenderCommand[], geometry: IStageGeometry): void {
        const { device, context, pipeline, sampler, vertexBuffer } = this;
        if (!pipeline || !sampler || !vertexBuffer) return;

        const canvas = context.canvas as HTMLCanvasElement;
        const viewMatrix = composeView(
            canvas.width,
            canvas.height,
            geometry.width,
            geometry.height,
        );

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: context.getCurrentTexture().createView(),
                    clearValue: rgbaToGpu(this.background.color),
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        });
        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, vertexBuffer);

        const frames = new Float32Array(UNIFORM_BYTES / 4);
        for (const command of commands) {
            const entry = this.textures.get(command.textureId);
            if (!entry) continue;

            frames.set(composeModel(command.x, command.y, command.rotation, command.scale), 0);
            frames.set(viewMatrix, 16);
            frames[32] = command.width;
            frames[33] = command.height;
            frames[36] = 1; // tint.r
            frames[37] = 1; // tint.g
            frames[38] = 1; // tint.b
            frames[39] = command.alpha;
            frames[40] = command.brightness;

            let uniform = this.uniformBuffers.get(command.id);
            if (!uniform) {
                uniform = device.createBuffer({
                    size: UNIFORM_BYTES,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });
                this.uniformBuffers.set(command.id, uniform);
            }
            device.queue.writeBuffer(uniform, 0, frames);

            const bindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: uniform } },
                    { binding: 1, resource: entry.view },
                    { binding: 2, resource: sampler },
                ],
            });
            pass.setBindGroup(0, bindGroup);
            pass.draw(6, 1, 0, 0);
        }

        pass.end();
        device.queue.submit([encoder.finish()]);

        // 释放本帧已不存在的精灵缓存的 uniform buffer，避免无限增长
        for (const id of this.uniformBuffers.keys()) {
            if (!commands.some(c => c.id === id)) {
                this.uniformBuffers.get(id)?.destroy();
                this.uniformBuffers.delete(id);
            }
        }
    }

    resize(): void {
        const { device, context } = this;
        const canvas = context.canvas as HTMLCanvasElement;
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(1, Math.round((canvas.clientWidth || canvas.width) * dpr));
        const h = Math.max(1, Math.round((canvas.clientHeight || canvas.height) * dpr));
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            // canvas 尺寸变化后重配 swapchain
            context.configure({ device, format: this.format });
        }
    }

    dispose(): void {
        for (const entry of this.textures.values()) entry.texture.destroy();
        this.textures.clear();
        for (const buffer of this.uniformBuffers.values()) buffer.destroy();
        this.uniformBuffers.clear();
        this.pipeline = null;
        this.sampler = null;
        if (this.vertexBuffer) {
            this.vertexBuffer.destroy();
            this.vertexBuffer = null;
        }
        this.device.destroy();
    }
}

/** 直通 Alpha 混合，对齐 WebGL 端 blendFuncSeparate */
function straightBlend(): GPUBlendState {
    return {
        color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
        },
        alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
        },
    };
}

function rgbaToGpu(color: [number, number, number, number]): GPUColorDict {
    return {
        r: color[0] / 255,
        g: color[1] / 255,
        b: color[2] / 255,
        a: color[3] / 255,
    };
}
