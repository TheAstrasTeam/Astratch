/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 渲染后端能力检测。
 *
 * `webgpu` 优先（Astratch 主打 WebGPU 渲染），其次 `webgl`，
 * 都不支持时为 `none`。分辨不出后端时外部应给出兜底提示而非硬崩。
 */
export type RendererBackend = 'webgl' | 'webgpu' | 'none';

/**
 * 舞台逻辑坐标系（单位：像素）。
 *
 * 原点在舞台中心，y 轴向上（与 Scratch 舞台一致）：
 * - x: 向右增大
 * - y: 向上增大
 */
export interface IStageGeometry {
    /** 舞台逻辑宽度（像素） */
    width: number;
    /** 舞台逻辑高度（像素） */
    height: number;
}

/**
 * 舞台背景。
 * 背景用纯色填充；将来多背景/向量背景可以在此扩展。
 */
export interface IStageBackground {
    /** RGBA 颜色，色值 0-255 */
    color: [number, number, number, number];
}

/**
 * 一条待绘制的精灵（实体）绘制指令。
 *
 * `rotation` 为屏幕空间顺时针旋转角（弧度）。配合 `x/y` 居中定位精灵，
 * `scale` 为相对原图尺寸的缩放（1 为原大小）。`effects.ghost` 折算进
 * `alpha`，`effects.brightness` 折算进 `brightness`（Scratch 语义，
 * -100~100，默认 0 表示不变）。
 */
export interface IRenderCommand {
    /** 实体 id，用于调试 */
    id: string;
    /** 纹理 id，指向 `IRenderer.createTexture` 时使用的 id */
    textureId: string;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    /** 原图像素宽度（决定单位 quad 被拉伸成的大小） */
    width: number;
    /** 原图像素高度 */
    height: number;
    /** 不透明度 0-1 */
    alpha: number;
    /** 亮度偏移 -100~100，默认 0 */
    brightness: number;
}

/**
 * 渲染器统一接口。WebGL / WebGPU 两个后端都实现它，
 * 上层（舞台）只依赖此抽象，不感知具体 API。
 */
export interface IRenderer {
    readonly backend: Exclude<RendererBackend, 'none'>;

    /**
     * 挂载到 canvas 上。绘制后装进 canvas，纹理可重复使用。
     * @param canvas 目标 canvas
     * @param geometry 舞台逻辑坐标
     * @param background 背景色
     */
    mount(canvas: HTMLCanvasElement, geometry: IStageGeometry, background: IStageBackground): void;

    /**
     * 上传一张图片作为纹理。同一 id 重复上传会替换旧纹理。
     * 返回可在 `IRenderCommand.textureId` 中引用的不透明句柄。
     */
    createTexture(id: string, bitmap: ImageBitmap): unknown;

    /** 释放指定 id 的纹理资源 */
    disposeTexture(id: string): void;

    /** 清空画布并绘制给定指令集。调用方负责每帧或状态变更时重绘。 */
    render(commands: readonly IRenderCommand[], geometry: IStageGeometry): void;

    /** 在容器尺寸/CSS 变化后重新适配高清缩放 */
    resize(): void;

    /** 反初始化，释放 GPU 资源 */
    dispose(): void;
}


