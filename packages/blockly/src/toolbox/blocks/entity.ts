import { t } from 'astratch-i18n';

import { TOOLBOX_COLOR } from '../color';
import {
    BlockIcon,
    TYPES,
    connections,
    objectInput,
    returnConnections,
} from '../helps';
import { OPCODES } from '../opcodes';
import { blocklyAdapter } from '../../blockly';
import * as Blockly from 'blockly';
import { TemplateHandler } from '../templateHandler';

import FunctionIcon from './assets/function.svg';

export const initEntityBlocks = () => {
    blocklyAdapter.Blockly.Blocks[OPCODES.getTemplate] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: '',
                colour: TOOLBOX_COLOR.entity,
                output: 'Object',
            });
            this.templateHandler = new TemplateHandler(this, this.updateShape.bind(this));
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
                this.templateHandler.addButtonForBlock();
            } finally {
                this.isInit = false;
            }
        },
        saveExtraState() {
            return this.templateHandler.getExtraState();
        },
        loadExtraState(state: { storageHandle?: string }) {
            this.templateHandler.loadExtraState(state);
            this.updateShape();
        },
    } as Blockly.Block & {
        isInit: boolean;
        updateShape(): void;
        templateHandler: TemplateHandler;
    };

    blocklyAdapter.Blockly.Blocks[OPCODES.createInstanceByTemplate] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.createInstanceByTemplate'),
                args0: [objectInput('TEMPLATE')],
                output: TYPES.OBJECT,
                colour: TOOLBOX_COLOR.entity,
            });
            this.addIcon(new BlockIcon(this, FunctionIcon));
            this.updateShape();
        },
        updateShape() {
            // TODO: 待类型系统完成后加入传值
            return;
        },
    } as Blockly.Block & {
        updateShape(): void;
    };

    blocklyAdapter.Blockly.Blocks[OPCODES.activeInstance] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.activeInstance'),
                args0: [objectInput('HANDLE')],
                colour: TOOLBOX_COLOR.entity,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.pauseInstance] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.pauseInstance'),
                args0: [objectInput('HANDLE')],
                colour: TOOLBOX_COLOR.entity,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.removeInstance] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.removeInstance'),
                args0: [objectInput('HANDLE')],
                colour: TOOLBOX_COLOR.entity,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.applyParentEntityAttr] = {
        init() {
            this.jsonInit({
                ...connections,
                message0: t('blocks:entity.applyParentEntityAttr'),
                colour: TOOLBOX_COLOR.entity,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.thisInstance] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.thisInstance'),
                output: 'Object',
                colour: TOOLBOX_COLOR.entity,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.getInstanceBasedTemplate] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.getInstanceBasedTemplate'),
                args0: [objectInput('TEMPLATE')],
                output: 'Array',
                colour: TOOLBOX_COLOR.entity,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.getAllInstance] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.getAllInstance'),
                output: 'Array',
                colour: TOOLBOX_COLOR.entity,
            });
        },
    } as Blockly.Block;

    blocklyAdapter.Blockly.Blocks[OPCODES.getInstanceAttr] = {
        init() {
            this.jsonInit({
                ...returnConnections,
                message0: t('blocks:entity.getInstanceAttr'),
                args0: [
                    objectInput('HANDLE'),
                    {
                        type: 'input_value',
                        name: 'ATTR_GETTER',
                        check: ['Getter', 'String', 'Number', 'Array', 'Object', null],
                    },
                ],
                output: null,
                colour: TOOLBOX_COLOR.entity,
            });
        },
    } as Blockly.Block;
};
