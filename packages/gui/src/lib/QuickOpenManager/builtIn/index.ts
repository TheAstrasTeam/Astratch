import { quickOpenManager, type IQuickOpenMode } from '..';

const builtIn_QuickOpen: Record<string, IQuickOpenMode> = import.meta.glob('./*/index.tsx', {
    eager: true,
    import: 'default',
});

export const loadBuiltInQuickOpen = () => {
    Object.values(builtIn_QuickOpen).forEach(item => {
        quickOpenManager.addMode(item);
    });
};
