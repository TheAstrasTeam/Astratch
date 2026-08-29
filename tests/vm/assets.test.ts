// 此文件由AI生成
/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetManager } from '../../src/vm/runtime/data/assets';
import { MIME_TYPES, type IAsset } from '../../src/types/vm/assets';
import type { PartialByKeys } from '../../src/types/utils';
import type { IVM } from '../../src/types/vm/vm';
import { sendError } from '../../src/utils/debug';

// sendError 的默认类型是 'error' 会抛出，'warn' 只警告；
// 这里模拟同样的行为，避免测试依赖 Toast
vi.mock('../../src/utils/debug', () => ({
    sendError: vi.fn((error: unknown, type: 'error' | 'warn' = 'error') => {
        if (type === 'warn') return;
        throw error instanceof Error ? error : new Error(String(error));
    }),
}));

type TAssetInput = PartialByKeys<PartialByKeys<IAsset, 'id'>, 'hash'>;

function makeAsset(overrides: Partial<TAssetInput> = {}): TAssetInput {
    return {
        name: 'asset',
        extension: '.png',
        type: 'image',
        mimeType: MIME_TYPES.PNG,
        blob: new TextEncoder().encode('hello').buffer,
        ...overrides,
    };
}

function makeManager() {
    return new AssetManager({} as IVM);
}

describe('spawnHash', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('对已知内容返回正确的SHA-256十六进制哈希', async () => {
        const manager = makeManager();
        // SHA-256("") 的已知结果
        expect(await manager.spawnHash(new ArrayBuffer(0))).toBe(
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        );
        // SHA-256("hello") 的已知结果
        const hello = new TextEncoder().encode('hello').buffer;
        expect(await manager.spawnHash(hello)).toBe(
            '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        );
    });

    it('哈希长度为64个十六进制字符', async () => {
        const manager = makeManager();
        const hash = await manager.spawnHash(makeAsset().blob);
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('相同内容哈希一致，不同内容哈希不同', async () => {
        const manager = makeManager();
        const a1 = makeAsset().blob;
        const a2 = makeAsset().blob;
        const b = makeAsset({ blob: new TextEncoder().encode('world').buffer }).blob;
        expect(await manager.spawnHash(a1)).toBe(await manager.spawnHash(a2));
        expect(await manager.spawnHash(a1)).not.toBe(await manager.spawnHash(b));
    });
});

describe('loadAsset', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该加载资源并返回id，资源带有计算的哈希', async () => {
        const manager = makeManager();
        const input = makeAsset({ id: 'a' });
        const id = await manager.loadAsset(input);
        expect(id).toBe('a');
        expect(manager.assets.has('a')).toBe(true);

        const stored = manager.getAsset('a');
        expect(stored?.hash).toBe(await manager.spawnHash(input.blob));
        expect(stored?.name).toBe(input.name);
        expect(stored?.blob).toBe(input.blob);
    });

    it('未提供id与asset.id时应该自动生成id', async () => {
        const manager = makeManager();
        const id1 = await manager.loadAsset(makeAsset());
        const id2 = await manager.loadAsset(makeAsset());
        expect(id1).toBeTruthy();
        expect(id2).toBeTruthy();
        expect(id1).not.toBe(id2);
    });

    it('显式id参数应该优先于asset自带的id', async () => {
        const manager = makeManager();
        const id = await manager.loadAsset(makeAsset({ id: 'inner' }), 'outer');
        expect(id).toBe('outer');
        expect(manager.assets.has('outer')).toBe(true);
        expect(manager.assets.has('inner')).toBe(false);
    });

    it('id已存在时应该报错且不覆盖原资源', async () => {
        const manager = makeManager();
        await manager.loadAsset(makeAsset({ id: 'a', name: 'first' }));
        await expect(manager.loadAsset(makeAsset({ id: 'a', name: 'second' }))).rejects.toThrow();
        expect(sendError).toHaveBeenCalledWith({ text: 'vm:asset.existing' });
        expect(manager.getAsset('a')?.name).toBe('first');
    });

    it('哈希计算失败时应该报错且不存储资源', async () => {
        const manager = makeManager();
        vi.spyOn(manager, 'spawnHash').mockResolvedValue(undefined);
        await expect(manager.loadAsset(makeAsset())).rejects.toThrow();
        expect(sendError).toHaveBeenCalledWith({ text: 'vm:asset.spawnHashFailed' });
        expect(manager.listAssets()).toHaveLength(0);
    });

    it('相同内容不同id的资源哈希一致', async () => {
        const manager = makeManager();
        await manager.loadAsset(makeAsset({ id: 'a' }));
        await manager.loadAsset(makeAsset({ id: 'b' }));
        expect(manager.getAsset('a')?.hash).toBe(manager.getAsset('b')?.hash);
    });
});

describe('removeAsset', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该删除资源并返回true', async () => {
        const manager = makeManager();
        await manager.loadAsset(makeAsset({ id: 'a' }));
        expect(manager.removeAsset('a')).toBe(true);
        expect(manager.assets.has('a')).toBe(false);
    });

    it('删除不存在的资源应该报错并返回undefined', () => {
        const manager = makeManager();
        expect(() => manager.removeAsset('missing')).toThrow();
        expect(sendError).toHaveBeenCalledWith({ text: 'vm:asset.noExisting' });
    });
});

describe('getAsset', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('应该返回存储的资源', async () => {
        const manager = makeManager();
        await manager.loadAsset(makeAsset({ id: 'a' }));
        expect(manager.getAsset('a')?.id).toBe('a');
    });

    it('获取不存在的资源应该警告并返回undefined', () => {
        const manager = makeManager();
        expect(manager.getAsset('missing')).toBeUndefined();
        expect(sendError).toHaveBeenCalledWith({ text: 'vm:asset.noExisting' }, 'warn');
    });
});

describe('listAssets', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('没有资源时返回空数组', () => {
        const manager = makeManager();
        expect(manager.listAssets()).toEqual([]);
    });

    it('应该按加载顺序返回所有资源', async () => {
        const manager = makeManager();
        await manager.loadAsset(makeAsset({ id: 'a' }));
        await manager.loadAsset(makeAsset({ id: 'b' }));
        expect(manager.listAssets().map(asset => asset.id)).toEqual(['a', 'b']);
    });
});
