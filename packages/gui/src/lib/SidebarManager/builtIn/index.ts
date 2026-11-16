import { sidebar, type ISidebarSubmitItem } from '..';

const builtIn_Items: Record<string, ISidebarSubmitItem> = import.meta.glob('./items/**/index.tsx', {
    eager: true,
    import: 'default',
});

export const loadBuiltInSidebarItems = () => {
    Object.values(builtIn_Items).forEach(m => {
        sidebar.addItem(m);
    });
};
