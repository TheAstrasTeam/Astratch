const DEFAULT_TOOLBOX_COLOR = {
    motion: '#3399ff',
    textField: '#FFFFFF',
    textFieldText: '#575E75',
} as const;

type TDEFAULT_TOOLBOX_COLOR = (typeof DEFAULT_TOOLBOX_COLOR)[keyof typeof DEFAULT_TOOLBOX_COLOR];

export { DEFAULT_TOOLBOX_COLOR, type TDEFAULT_TOOLBOX_COLOR };
