import type { IQuickOpenMode } from "../..";

import TargetIcon from '@as/targets/target.svg?react';
import { QuickOpen_BuiltIn_TargetRenderer } from "./Renderer";

export default {
    translate: true,
    nameID: 'quickOpen_target',
    descriptionID: 'quickOpen_target_description',
    icon: TargetIcon,
    id: 'target',
    shortcut: [],
    prefix: '@',
    Renderer: QuickOpen_BuiltIn_TargetRenderer,
} satisfies IQuickOpenMode