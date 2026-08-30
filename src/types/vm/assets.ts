/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PartialByKeys } from '../utils';
import type { IVM } from './vm';

export interface IAsset {
    id: string;
    name: string;
    /** 扩展名 */
    extension: string;
    type: TTYPES_ENUM;
    mimeType: TMIME_TYPES;
    blob: ArrayBuffer;
    hash: string;
}

export const MIME_TYPES = {
    TEXT: 'text/plain',
    JPG: 'image/jpeg',
    PNG: 'image/png',
    SVG: 'image/svg+xml',
    WEBP: 'image/webp',
    MP3: 'audio/mpeg',
    WAV: 'audio/wav',
    TTF: 'font/ttf',
    WOFF: 'font/woff',
    WOFF2: 'font/woff2',
    BINARY: 'application/octet-stream',
} as const;
export type TMIME_TYPES = (typeof MIME_TYPES)[keyof typeof MIME_TYPES];

export const TYPES_ENUM = {
    text: [MIME_TYPES.TEXT],
    image: [MIME_TYPES.JPG, MIME_TYPES.PNG, MIME_TYPES.SVG, MIME_TYPES.WEBP],
    audio: [MIME_TYPES.MP3, MIME_TYPES.WAV],
    font: [MIME_TYPES.TTF, MIME_TYPES.WOFF, MIME_TYPES.WOFF2],
    binary: [MIME_TYPES.BINARY],
} as const;
export type TTYPES_ENUM = keyof typeof TYPES_ENUM;

export interface IAssetManager {
    vm: IVM;
    assets: Map<string, IAsset>;
    /**
     * 加载一个资源，并返回它的id
     * @param asset 资源
     * @param id ID
     */
    loadAsset(
        asset: PartialByKeys<PartialByKeys<IAsset, 'id'>, 'hash'>,
        id?: string,
    ): Promise<string | undefined>;
    /**
     * 删除一个资源
     * @param id ID
     */
    removeAsset(id: string): boolean | undefined;
    /**
     * 获取一个资源
     * @param id ID
     */
    getAsset(id: string): IAsset | undefined;
    /** 列出所有资源 */
    listAssets(): IAsset[];
    /**
     * 生成资源的哈希
     * @param blob ArrayBuffer
     */
    spawnHash(blob: ArrayBuffer): Promise<string | undefined>;
}
