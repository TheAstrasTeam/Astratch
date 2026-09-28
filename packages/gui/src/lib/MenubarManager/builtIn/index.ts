const builtIn_Menus: Record<string, () => void> = import.meta.glob('./menu/*.ts', {
    eager: true,
    import: 'default',
});

export const loadBuiltInMenus = () => {
    Object.values(builtIn_Menus).forEach(m => {
        m();
    });
};
