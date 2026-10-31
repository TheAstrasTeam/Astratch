const TOOLBOX_COLOR = {
    render: '#3399ff',
    motion: '#3399ff',
    asset: '#608d00',
    event: '#ffbf00',
    flow: '#ffab19',
    branch: '#ffab19',
    sensing: '#5cb1d6',
    math: '#59c059',
    data: '#ff8c1a',
    function: '#ff6680',
    textField: '#FFFFFF',
    textFieldText: '#575E75',
    enable: '#11aa22',
    unenable: '#aa1212',
} as const;

type TDEFAULT_TOOLBOX_COLOR = (typeof TOOLBOX_COLOR)[keyof typeof TOOLBOX_COLOR];

export { TOOLBOX_COLOR, type TDEFAULT_TOOLBOX_COLOR };
