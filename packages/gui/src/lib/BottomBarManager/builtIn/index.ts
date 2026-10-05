import { bottomBarManager, type BottomBarSubmitItem } from '..';

const builtIn_BottomBarItems: Record<string, BottomBarSubmitItem> = import.meta.glob(
    './bottomBar/**/index.tsx',
    {
        eager: true,
        import: 'default',
    },
);

export const loadBuiltInBottomBarItems = () => {
    Object.values(builtIn_BottomBarItems).forEach(item => {
        bottomBarManager.addItem(item);
    });
};
