// 此文件由AI生成
// 测试插件：启用时弹出问候，禁用时弹出告别

export default ctx => {
    const greeting = ctx.settings.get('greeting');
    const notifyOnDisable = ctx.settings.get('notifyOnDisable');
    ctx.toast.create({
        type: 'info',
        id: 'test_addon_greet',
        text: `${ctx.t('addon_custom-test-addon:greet')} (${greeting})`,
    });
    return () => {
        if (notifyOnDisable === true) {
            ctx.toast.create({
                type: 'info',
                id: 'test_addon_bye',
                text: ctx.t('addon_custom-test-addon:bye'),
            });
        }
    };
};
