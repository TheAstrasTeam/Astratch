import { t } from 'astratch-i18n';
import type * as Blockly from 'blockly/core';
import { DEFAULT_TOOLBOX_COLOR } from '../color';
import { OPCODES } from './opcodes';
import { initBlocks } from './blocks';

export const num = (v: string | number) => ({
    shadow: {
        type: OPCODES.number,
        fields: { NUM: v },
    },
});

export const getDefaultToolbox = (): Blockly.utils.toolbox.ToolboxInfo => {
    initBlocks();
    return {
        kind: 'categoryToolbox',
        contents: [
            {
                kind: 'category',
                id: 'render',
                name: t('blocks:category.render'),
                contents: [
                    {
                        kind: 'category',
                        name: t('blocks:category.motion'),
                        colour: DEFAULT_TOOLBOX_COLOR.motion,
                        contents: [
                            {
                                gap: 12,
                                kind: 'block',
                                type: OPCODES.forward,
                                inputs: { STEPS: num(10) },
                            },
                        ],
                    },
                ],
            },
        ],
    };
};
