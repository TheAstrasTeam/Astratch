// 此文件由AI生成
// 测试插件：启用时弹出问候，禁用时弹出告别

export default ctx => {
    ctx.toast.create({
        type: 'info',
        id: 'test_plugin_greet',
        text: ctx.t('addon_custom-test-plugin:greet'),
    });
    return () => {
        ctx.toast.create({
            type: 'info',
            id: 'test_plugin_bye',
            text: ctx.t('addon_custom-test-plugin:bye'),
        });
    };
};
