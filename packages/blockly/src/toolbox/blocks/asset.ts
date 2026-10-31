import { Blockly, OPCODES } from '../..';
import { AssetHandler } from '../assetHandler';
import { blocklyAdapter } from '../../blockly';
import { returnConnections } from '../helps';
import { TOOLBOX_COLOR } from '../color';

export const initAssetBlocks = () => {
    interface IAssetSelector extends Blockly.Block {
        isInit: boolean;
        updateShape(): void;
        assetHandler: AssetHandler;
    }
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
    } as IAssetSelector;
};
