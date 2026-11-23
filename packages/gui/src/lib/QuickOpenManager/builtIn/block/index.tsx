import type { IQuickOpenMode } from '../..';

import BlockIcon from '@as/blocks.svg?react';
import { QuickOpen_BuiltIn_BlockRenderer } from './Renderer';

export default {
    translate: true,
    nameID: 'quickOpen.block.name',
    descriptionID: 'quickOpen.block.description',
    icon: BlockIcon,
    id: 'block',
    shortcut: [],
    prefix: '#',
    Renderer: QuickOpen_BuiltIn_BlockRenderer,
} satisfies IQuickOpenMode;
