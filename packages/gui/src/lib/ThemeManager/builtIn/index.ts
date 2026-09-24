import type { TTheme } from '..';

const builtIn_UIThemes: Record<string, TTheme> = import.meta.glob('./ui/*.ts', {
    eager: true,
    import: 'default',
});

const builtIn_accentThemes: Record<string, TTheme> = import.meta.glob('./accent/*.ts', {
    eager: true,
    import: 'default',
});

const builtIn_themeIDs = [
    ...Object.values(builtIn_accentThemes).map(t => t.id),
    ...Object.values(builtIn_UIThemes).map(t => t.id),
];

/** @link [Dark](./ui/dark.ts)*/
const builtIn_defaultTheme_UI = 'astratch-theme-ui-dark' as const;

/** @link [Editor](./accent/editor.ts)*/
const builtIn_defaultTheme_accent = 'astratch-theme-accent-editor' as const;

export {
    builtIn_UIThemes,
    builtIn_accentThemes,
    builtIn_defaultTheme_UI,
    builtIn_defaultTheme_accent,
    builtIn_themeIDs,
};
