import type * as Blockly from 'blockly/core';

const guiTheme = {
    'color-scheme': 'light',

    'ui-primary': '#ffffff',
    'ui-secondary': '#f7f7f7',
    'ui-tertiary': '#e0e0e0',

    'ui-modal-overlay': '#00000033',
    'ui-modal-background': '#ffffff',
    'ui-modal-foreground': '#111111',
    'ui-modal-header-background': '#f0f0f0',
    'ui-modal-header-foreground': '#111111',

    'ui-blockly-background': '#f2f2f2',
    'ui-blockly-foreground': 'var(--ui-modal-foreground)',
    'ui-blockly-border': '#555555',

    'ui-white': '#ffffff',

    'ui-black-transparent': '#00000026',

    'text-primary': '#111111',

    'input-background': '#ffffff',

    'svg-filter': 'invert(0)',
    'active-button': 'brightness(0.9)',
} as const;

const blocklyTheme: Blockly.Theme.ComponentStyle = {
    workspaceBackgroundColour: '#f7f7f7',
    toolboxBackgroundColour: '#ffffff',
    toolboxForegroundColour: '#111111',
    flyoutBackgroundColour: '#f9f9f9',
    flyoutForegroundColour: '#575e75',
    scrollbarColour: '#cecdce',
    insertionMarkerColour: '#000000',
    cursorColour: '#000000',
} as const;

export default {
    guiTheme,
    blocklyTheme,
};
