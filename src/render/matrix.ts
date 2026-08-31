/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 4x4 矩阵工具（列主序，`Float32Array`，长度 16）。
 *
 * 统一采用列主序以兼容 WebGL GLSL `mat4` 与 WebGPU WGSL `mat4x4<f32>`
 * （两者对 uniform 的默认排布都是列主序），因此两个后端可共享同一套数学。
 */

export type Mat4 = Float32Array & { readonly length: 16 };

const identityData = (): Float32Array =>
    new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/** 单位矩阵 */
export function identity(): Mat4 {
    return identityData() as Mat4;
}

/** `a * b`（先应用 b 再应用 a；遵循矩阵左乘语义） */
export function multiply(a: Mat4, b: Mat4): Mat4 {
    const out = new Float32Array(16) as Mat4;
    for (let col = 0; col < 4; col++) {
        const b0 = b[col * 4];
        const b1 = b[col * 4 + 1];
        const b2 = b[col * 4 + 2];
        const b3 = b[col * 4 + 3];
        out[col * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
        out[col * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
        out[col * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
        out[col * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return out;
}

/** 平移变换 */
export function translate(x: number, y: number, z = 0): Mat4 {
    const m = identity();
    m[12] = x;
    m[13] = y;
    m[14] = z;
    return m;
}

/** 绕 Z 轴旋转（角度，逆时针为正；屏幕坐标下表现为顺时针供精灵面朝方向使用） */
export function rotateZ(radians: number): Mat4 {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    const m = identity();
    m[0] = c;
    m[1] = s;
    m[4] = -s;
    m[5] = c;
    return m;
}

/** 缩放 */
export function scale(sx: number, sy: number, sz = 1): Mat4 {
    const m = identity();
    m[0] = sx;
    m[5] = sy;
    m[10] = sz;
    return m;
}

/**
 * 由精灵句柄绘制时的常用组合：缩放 → 旋转 → 平移。
 * 把原图中心对齐到 `(x, y)` 并应用方向与比例。
 */
export function composeModel(x: number, y: number, rotation: number, sizeScale: number): Mat4 {
    return multiply(translate(x, y), multiply(rotateZ(rotation), scale(sizeScale, sizeScale)));
}

/**
 * 舞台坐标（中心原点、y 向上、单位：阶段像素）→ 裁剪空间矩阵。
 *
 * 将 `pixelPerUnit = min(canvasW / stageW, canvasH / stageH)` 的逻辑舞台
 * 等比适配（letterbox）进 canvas，居中，并把 y 轴翻转成裁剪坐标
 * （WebGL/WebGPU 裁剪坐标 y 向下）。
 */
export function composeView(
    canvasWidth: number,
    canvasHeight: number,
    stageWidth: number,
    stageHeight: number,
): Mat4 {
    const pixelPerUnit = Math.min(canvasWidth / stageWidth, canvasHeight / stageHeight);
    const scaledW = stageWidth * pixelPerUnit;
    const scaledH = stageHeight * pixelPerUnit;
    const offsetX = (canvasWidth - scaledW) / 2;
    const offsetY = (canvasHeight - scaledH) / 2;
    // clip = T(2*offX/cw, 2*offY/ch) * S(2*pixelPerUnit/cw, -2*pixelPerUnit/ch)
    return multiply(
        translate((2 * offsetX) / canvasWidth, (2 * offsetY) / canvasHeight),
        scale((2 * pixelPerUnit) / canvasWidth, (-2 * pixelPerUnit) / canvasHeight),
    );
}
