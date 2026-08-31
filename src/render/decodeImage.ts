/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 把资源管理器里的二进制图片解码为 `ImageBitmap`。
 *
 * 放在渲染包内部，让两个后端（WebGL/WebGPU）都能拿到统一的位图源，
 * 也方便将来替换成 `createImageBitmap` 不可用时的降级路径。
 */
export async function decodeImageBitmap(blob: ArrayBuffer, mimeType: string): Promise<ImageBitmap> {
    const objectURL = URL.createObjectURL(new Blob([blob], { type: mimeType }));
    try {
        const image = new Image();
        image.src = objectURL;
        // Image 需显式指定跨域策略，否则绘制位图可能被污染（ToTaintCanvas）
        image.crossOrigin = 'anonymous';
        await image.decode();
        const bitmap = await createImageBitmap(image);
        return bitmap;
    } finally {
        URL.revokeObjectURL(objectURL);
    }
}
