import type { IQuickOpenMode } from '../..';
import CommandIcon from '@as/command.svg?react';

import { QuickOpen_BuiltIn_Command } from './Renderer';

export default {
    translate: true,
    nameID: 'quickOpen.command.name',
    descriptionID: 'quickOpen.command.description',
    icon: CommandIcon,
    id: 'command',
    shortcut: [],
    prefix: '>',
    Renderer: QuickOpen_BuiltIn_Command,
} satisfies IQuickOpenMode;
