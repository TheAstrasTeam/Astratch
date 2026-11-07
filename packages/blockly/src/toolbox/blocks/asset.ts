import { Blockly, OPCODES } from '../..';
import { AssetHandler } from '../assetHandler';
import { blocklyAdapter } from '../../blockly';
import { dropdown, objectInput, returnConnections } from '../helps';
import { TOOLBOX_COLOR } from '../color';
import { t } from 'astratch-i18n';

export const initAssetBlocks = () => {
    blocklyAdapter.Blockly.Blocks[OPCODES.assetSelector] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: '',
                colour: TOOLBOX_COLOR.asset,
                output: 'Object',
            });
            this.assetHandler = new AssetHandler(this, 'text', this.updateShape.bind(this));
            this.isInit = false;
            this.updateShape();
            queueMicrotask(() => {
                if (!this.isShadow()) return;
                const parent = this.getParent();
                if (!parent) return;
                if (!parent.rendered) return;
                const parentBlockSvg = parent as unknown as Blockly.BlockSvg;

                this.setColour(parentBlockSvg.getColourSecondary());
            });
        },
        updateShape() {
            if (this.isInit) return;
            try {
                this.isInit = true;
                this.assetHandler.addButtonForBlock();
            } finally {
                this.isInit = false;
            }
        },
        saveExtraState() {
            return this.assetHandler.getExtraState();
        },
        loadExtraState(state: { storageHandle?: string }) {
            this.assetHandler.loadExtraState(state);
            this.updateShape();
        },
    } as Blockly.Block & {
        isInit: boolean;
        updateShape(): void;
        assetHandler: AssetHandler;
    };

    blocklyAdapter.Blockly.Blocks[OPCODES.allAssetsName] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:asset.allAssetsName'),
                colour: TOOLBOX_COLOR.asset,
                output: 'String',
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.getAssetHandle] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:asset.getAssetHandle'),
                args0: [objectInput('HANDLE')],
                colour: TOOLBOX_COLOR.asset,
                output: 'Object',
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.getTempAssetLength] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:asset.getTempAssetLength'),
                args0: [objectInput('HANDLE')],
                colour: TOOLBOX_COLOR.asset,
                output: 'Length',
            });
        },
    } as Blockly.Block;
    blocklyAdapter.Blockly.Blocks[OPCODES.getImageTempAssetLH] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:asset.getImageTempAssetLH'),
                args0: [
                    objectInput('HANDLE'),
                    dropdown('LH', [
                        [t('blocks:width'), 'width'],
                        [t('blocks:height'), 'height'],
                    ]),
                ],
                colour: TOOLBOX_COLOR.asset,
                output: 'Number',
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.getImageTempAssetMIME] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:asset.getImageTempAssetMIME'),
                args0: [objectInput('HANDLE')],
                colour: TOOLBOX_COLOR.asset,
                output: 'String',
            });
        },
    } as Blockly.Block;
    blocklyAdapter.Blockly.Blocks[OPCODES.getAudioTempAssetTotalTime] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:asset.getAudioTempAssetTotalTime'),
                args0: [objectInput('HANDLE')],
                colour: TOOLBOX_COLOR.asset,
                output: 'Number',
            });
        },
    } as Blockly.Block;
};
