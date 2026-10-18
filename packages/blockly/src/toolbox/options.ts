/**
 * 多个大类都会用到的下拉选项。
 *
 * @author AI
 */
import { t } from 'astratch-i18n';

export const MOUSE_BUTTON_OPTIONS = [
    [t('blocks:option.mouseButton.left'), 'left'],
    [t('blocks:option.mouseButton.middle'), 'middle'],
    [t('blocks:option.mouseButton.right'), 'right'],
    [t('blocks:option.mouseButton.any'), 'ANY'],
];

export const KEY_STATE_OPTIONS = [
    [t('blocks:option.keyState.down'), 'down'],
    [t('blocks:option.keyState.up'), 'up'],
];

const KEY_NAMES = [
    'Control',
    'Shift',
    'Tab',
    'Alt',
    'Enter',
    'Delete',
    'End',
    'PageDown',
    'PageUp',
    'Home',
    'Insert',
    'ScrollLock',
    'Pause',
    'F2',
    'F6',
    'F8',
    'F9',
    'F10',
];

const KEY_CHARS = [
    '~',
    '`',
    '!',
    '@',
    '#',
    '$',
    '%',
    '^',
    '&',
    '*',
    '(',
    ')',
    '_',
    '+',
    '-',
    '=',
    '[',
    ']',
    '\\',
    ';',
    "'",
    ',',
    '/',
    '.',
    '<',
    '>',
    '?',
    ':',
    '"',
    '{',
    '}',
    '|',
];

/** 文档里 `keys` 列出的全部按键。 */
export const KEY_OPTIONS = [
    ...'0123456789'.split('').map((key) => [key, key]),
    ...'abcdefghijklmnopqrstuvwxyz'.split('').map((key) => [key, key]),
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((key) => [key, key]),
    ...KEY_CHARS.map((key) => [key, key]),
    ...KEY_NAMES.map((key) => [key, key]),
    [t('blocks:option.key.any'), 'ANY'],
];
