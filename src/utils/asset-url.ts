/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/** @author AI */

/**
 * blob URL 与 ArrayBuffer 生命周期绑定，缓存避免重复创建，无需手动 revoke
 */
const objectURLCache = new WeakMap<ArrayBuffer, string>();

/**
 * 从素材的 ArrayBuffer 创建（或读取缓存的）blob URL
 * @param blob 素材二进制内容
 * @param mimeType MIME 类型
 */
export const getAssetObjectURL = (blob: ArrayBuffer, mimeType: string): string => {
    let url = objectURLCache.get(blob);
    if (!url) {
        url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
        objectURLCache.set(blob, url);
    }
    return url;
};
