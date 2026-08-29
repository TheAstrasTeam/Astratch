/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PartialByKeys } from '../../../types/utils';
import type { IAsset, IAssetManager } from '../../../types/vm/assets';
import type { IVM } from '../../../types/vm/vm';
import { spawnRandomString } from '../../../utils/ash-data';
import { sendError } from '../../../utils/debug';

export class AssetManager implements IAssetManager {
    vm: IVM;
    assets: Map<string, IAsset>;
    constructor(vm: IVM) {
        this.vm = vm;
        this.assets = new Map();
    }

    async loadAsset(
        asset: PartialByKeys<PartialByKeys<IAsset, 'id'>, 'hash'>,
        id?: string,
    ): Promise<string | undefined> {
        const joinID = id ?? asset.id ?? spawnRandomString();
        if (this.assets.has(joinID)) {
            sendError('vm:asset.existing');
            return undefined;
        }
        const hash = await this.spawnHash(asset.blob);
        if (!hash) {
            sendError('vm:asset.spawnHashFailed');
            return undefined;
        }
        const joinAsset: IAsset = {
            ...asset,
            id: joinID,
            hash,
        };
        this.assets.set(joinID, joinAsset);
        return joinID;
    }

    removeAsset(id: string): boolean | undefined {
        if (!this.assets.has(id)) {
            sendError('vm:asset.noExisting');
            return undefined;
        }
        this.assets.delete(id);
        return true;
    }

    getAsset(id: string): IAsset | undefined {
        if (!this.assets.has(id)) {
            sendError('vm:asset.noExisting', 'warn');
            return undefined;
        }
        return this.assets.get(id);
    }

    listAssets(): IAsset[] {
        return Array.from(this.assets.values());
    }

    async spawnHash(blob: ArrayBuffer): Promise<string | undefined> {
        const hashBuffer = await crypto.subtle.digest('SHA-256', blob);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}
