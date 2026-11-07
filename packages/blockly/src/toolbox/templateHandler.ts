import { t } from 'astratch-i18n';
import { Blockly, blocklyAdapter } from '..';
import TemplateFinder from './blocks/assets/entity.svg';
import type { ITEMPLATE_INFO } from '../blockly';
import { FieldImageText } from './helps';

export class TemplateHandler {
    block: Blockly.Block;
    storageTemplateHandle: string | null = null;
    storageName: string | null = null;
    onUpdateTemplate: ((info: ITEMPLATE_INFO) => void) | undefined = undefined;

    constructor(
        block: Blockly.Block,
        onUpdateTemplate: (info: ITEMPLATE_INFO) => void,
    ) {
        this.block = block;
        this.onUpdateTemplate = onUpdateTemplate;
    }

    getExtraState() {
        if (this.storageTemplateHandle) return { storageHandle: this.storageTemplateHandle };
        else return {};
    }

    loadExtraState(state: { storageHandle?: string }) {
        this.storageTemplateHandle = state.storageHandle ?? null;
        if (!this.storageTemplateHandle) return;
        this.handleGetTemplate(this.storageTemplateHandle);
    }

    private handleGetTemplateInfo(info: ITEMPLATE_INFO) {
        this.storageName = info.name;
        this.onUpdateTemplate?.(info);
    }

    private handleGetTemplate(templateHandle: string) {
        this.storageTemplateHandle = templateHandle;
        blocklyAdapter.emit(this.block, 'GET_TEMPLATE_INFO', {
            templateHandle: templateHandle,
            handler: this.handleGetTemplateInfo.bind(this),
        });
    }

    addButtonForBlock() {
        ['TEMPLATE_FINDER', 'TEMPLATE_NAME'].forEach(inputName => {
            this.block.removeInput(inputName, true);
        });
        const configImage = new FieldImageText(
            TemplateFinder,
            25,
            25,
            this.storageName,
            t('blocks:openTemplateFinder'),
            () => {
                blocklyAdapter.emit(this.block, 'GET_TEMPLATE', {
                    handler: this.handleGetTemplate.bind(this),
                });
            },
            undefined,
            {
                showClickableBorder: false,
            },
        );
        this.block.appendDummyInput('TEMPLATE_FINDER').appendField(configImage);
    }
}
