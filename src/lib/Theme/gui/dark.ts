import type * as Blockly from 'blockly/core';

const guiTheme = {
    'color-scheme': 'dark',

    'ui-primary': '#111111',
    'ui-secondary': '#1e1e1e',
    'ui-tertiary': '#2e2e2e',

    'ui-modal-overlay': '#333333aa',
    'ui-modal-background': '#111111',
    'ui-modal-foreground': '#eeeeee',
    'ui-modal-header-background': '#333333',
    'ui-modal-header-foreground': '#ffffff',

    'ui-blockly-background': '#151515',
    'ui-blockly-foreground': 'var(--ui-modal-foreground)',
    'ui-blockly-border': '#efefef',

    'ui-white': '#111111',

    'ui-black-transparent': '#ffffff26',

    'text-primary': '#eeeeee',

    'input-background': '#1e1e1e',

    'svg-filter': 'invert(1)',
    'active-button': 'brightness(0.5)',
} as const;

const blocklyTheme: Blockly.Theme.ComponentStyle = {
    workspaceBackgroundColour: '#1e1e1e',
    toolboxBackgroundColour: '#2e2e2e',
    toolboxForegroundColour: '#eeeeee',
    flyoutBackgroundColour: '#151515',
    flyoutForegroundColour: '#eeeeee',
    scrollbarColour: '#555555',
    insertionMarkerColour: '#ffffff',
    cursorColour: '#000000',
} as const;

export default {
    guiTheme,
    blocklyTheme,
};
