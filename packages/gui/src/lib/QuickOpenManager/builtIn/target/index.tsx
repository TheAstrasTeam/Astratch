import type { IQuickOpenMode } from '../..';

import TargetIcon from '@as/targets/target.svg?react';
import { QuickOpen_BuiltIn_TargetRenderer } from './Renderer';

export default {
    translate: true,
    nameID: 'quickOpen.target.name',
    descriptionID: 'quickOpen.target.description',
    icon: TargetIcon,
    id: 'target',
    shortcut: [],
    prefix: '@',
    Renderer: QuickOpen_BuiltIn_TargetRenderer,
} satisfies IQuickOpenMode;
