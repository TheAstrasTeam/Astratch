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
    type: 'audio' | 'image' | 'text' | 'font' | 'binary';
    mimeType: TMIME_TYPES;
    blob: ArrayBuffer;
    hash: string;
}

export const MIME_TYPES = {
    TEXT: 'text/plain',
    JPG: 'image/jpeg',
    PNG: 'image/png',
    SVG: 'image/svg+xml',
    MP3: 'audio/mpeg',
    WAV: 'audio/wav',
    TTF: 'font/ttf',
    WOFF: 'font/woff',
    WOFF2: 'font/woff2',
    BINARY: 'application/octet-stream',
} as const;
export type TMIME_TYPES = (typeof MIME_TYPES)[keyof typeof MIME_TYPES];

export interface IAssetManager {
    vm: IVM;
    assets: Map<string, IAsset>;
    /**
     * 加载一个资源，并返回它的id
     * @param asset 资源
     * @param id ID
     */
    loadAsset(asset: PartialByKeys<IAsset, 'id'>, id?: string): Promise<string | undefined>;
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
