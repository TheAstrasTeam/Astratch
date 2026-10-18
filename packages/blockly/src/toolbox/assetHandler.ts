import { t } from 'astratch-i18n';
import { Blockly, blocklyAdapter } from '..';
import AssetFinder from './blocks/assets/assetsFinder.svg';
import type { TASSET_INFO, TASSET_TYPE } from '../blockly';
import { FieldImageText } from './helps';

export class AssetHandler {
    block: Blockly.Block;
    storageAssetHandle: string | null = null;
    storageName: string | null = null;
    type: TASSET_TYPE;
    onUpdateAsset: ((info: TASSET_INFO) => void) | undefined = undefined;

    constructor(
        block: Blockly.Block,
        type: TASSET_TYPE,
        onUpdateAsset: (info: TASSET_INFO) => void,
    ) {
        this.block = block;
        this.type = type;
        this.onUpdateAsset = onUpdateAsset;
    }

    getExtraState() {
        if (this.storageAssetHandle) return { storageHandle: this.storageAssetHandle };
        else return {};
    }

    loadExtraState(state: { storageHandle?: string }) {
        this.storageAssetHandle = state.storageHandle ?? null;
        if (!this.storageAssetHandle) return;
        this.handleGetAsset(this.storageAssetHandle);
    }

    private handleGetAssetInfo(info: TASSET_INFO) {
        this.storageName = info.name;
        this.onUpdateAsset?.(info);
    }

    private handleGetAsset(assetHandle: string) {
        this.storageAssetHandle = assetHandle;
        blocklyAdapter.emit(this.block, 'GET_ASSET_INFO', {
            assetHandle: assetHandle,
            handler: this.handleGetAssetInfo.bind(this),
        });
    }

    addButtonForBlock() {
        ['ASSET_FINDER', 'ASSET_NAME'].forEach(inputName => {
            this.block.removeInput(inputName, true);
        });
        const configImage = new FieldImageText(
            AssetFinder,
            25,
            25,
            this.storageName,
            t('blocks:openAssetFinder'),
            () => {
                blocklyAdapter.emit(this.block, 'GET_ASSET', {
                    type: this.type,
                    handler: this.handleGetAsset.bind(this),
                });
            },
            undefined,
            {
                showClickableBorder: false,
            },
        );
        this.block.appendDummyInput('ASSET_FINDER').appendField(configImage);
    }
}
