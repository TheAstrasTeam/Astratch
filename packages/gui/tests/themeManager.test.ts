import { describe, expect, test } from 'vitest';
import { themeManager } from '../src/lib/ThemeManager';
import {
    builtIn_defaultTheme_accent,
    builtIn_defaultTheme_UI,
} from '../src/lib/ThemeManager/builtIn';

describe('ThemeManager', () => {
    const themeUI = {
        id: 'HELLO!',
        kind: 'ui' as const,
        scheme: {
            primary: '',
            secondary: '',
            tertiary: '',
            quaternary: '',
            'primary-icon': '',
            'secondary-icon': '',
            'tertiary-icon': '',
            'quaternary-icon': '',
            'transparent-dark': '',
            'transparent-light': '',
            text: '',
        },
        translate: false as const,
        isDarkTheme: false as const,
        name: 'HELLO!',
        mixWithAccent: false as const,
    };

    test('初始化主题', async () => {
        // 构造时会自动初始化主题
        expect((await themeManager.getUsingTheme('accent')).id).toEqual(
            builtIn_defaultTheme_accent,
        );
        expect((await themeManager.getUsingTheme('ui')).id).toEqual(builtIn_defaultTheme_UI);
    });
    test('添加新主题', async () => {
        expect(await themeManager.addNewTheme(themeUI, false)).toEqual('HELLO!');
        expect(
            await themeManager.addNewTheme(
                {
                    id: 'HELLO!',
                    kind: 'accent',
                    scheme: {
                        primary: '',
                        secondary: '',
                        tertiary: '',
                        transparent: '',
                        highlight: '',
                    },
                    translate: false,
                    name: 'HELLO!',
                },
                false,
            ),
        ).toEqual('HELLO!');
    });
    test('更新主题', async () => {
        const themeUI_2 = { ...themeUI };
        themeUI_2.scheme.primary = '2';
        expect(await themeManager.addNewTheme(themeUI, true)).toEqual('HELLO!');
        expect(await themeManager.addNewTheme(themeUI_2, true)).toEqual('HELLO!');
        expect((await themeManager.getUsingTheme('ui')).scheme.primary).toEqual('2');
    });
    test('事件', async () => {
        const success = {
            event_added: false,
            event_applied: false,
        };
        const event_added = () => {
            success.event_added = true;
        };
        const event_applied = () => {
            success.event_applied = true;
        };
        themeManager.on('ADDED_THEME', event_added);
        themeManager.on('APPLIED_THEME', event_applied);
        expect(await themeManager.addNewTheme(themeUI, true)).toEqual('HELLO!');
        expect(success).toEqual({
            event_added: true,
            event_applied: true,
        });
    });
});
