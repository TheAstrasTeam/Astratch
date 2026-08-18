export default ctx => {
    ctx.toast.create({
        type: 'info',
        id: 'addon_example_greet',
        text: ctx.t('addon_example:greet'),
    });
};
