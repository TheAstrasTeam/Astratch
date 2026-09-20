const BlocksColor = {
    position: {
        primary: '#4C97FF',
        secondary: '#4280D7',
        tertiary: '#3373CC',
        quaternary: '#3373CC',
    },
    scale: {
        primary: '#3D7DE0',
        secondary: '#3068C0',
        tertiary: '#2654A0',
        quaternary: '#2654A0',
    },
    direction: {
        primary: '#2A66CC',
        secondary: '#2355B0',
        tertiary: '#1C4494',
        quaternary: '#1C4494',
    },
    layer: {
        primary: '#1A4FA8',
        secondary: '#15408A',
        tertiary: '#10336E',
        quaternary: '#10336E',
    },
    Images: {
        primary: '#ff0044',
        secondary: '#e60013',
        tertiary: '#cc0025',
        quaternary: '#cc003a',
    },
    effects: {
        primary: '#CC2244',
        secondary: '#B31D3A',
        tertiary: '#991830',
        quaternary: '#801428',
    },
    collision: {
        primary: '#5CB1D6',
        secondary: '#4E9FC4',
        tertiary: '#3D8DB5',
        quaternary: '#3D8DA5',
    },
    lifecycle: {
        primary: '#4CAF50',
        secondary: '#3D9C42',
        tertiary: '#2E8A35',
        quaternary: '#207828',
    },
    audio: {
        primary: '#CF63CF',
        secondary: '#B855B8',
        tertiary: '#A04AA0',
        quaternary: '#A04A90',
    },
    resources: {
        primary: '#59C059',
        secondary: '#4AA84A',
        tertiary: '#3D963D',
        quaternary: '#3D963D',
    },
    event: {
        primary: '#FFBF00',
        secondary: '#E6AC00',
        tertiary: '#CC9900',
        quaternary: '#CC9900',
    },
    control: {
        primary: '#FFAB19',
        secondary: '#E69900',
        tertiary: '#CC8800',
        quaternary: '#CC8800',
    },
    operator: {
        primary: '#59C059',
        secondary: '#4AA84A',
        tertiary: '#3D963D',
        quaternary: '#3D963D',
    },
    data: {
        primary: '#FF8C1A',
        secondary: '#E67E00',
        tertiary: '#CC7000',
        quaternary: '#CC7000',
    },
    function: {
        primary: '#FF6680',
        secondary: '#E65570',
        tertiary: '#CC4560',
        quaternary: '#CC4550',
    },
    canvas: {
        primary: '#0fbd8c',
        secondary: '#0ca378',
        tertiary: '#137458',
        quaternary: '#0a644b',
    },
    debug: {
        primary: '#A0A0A0',
        secondary: '#8A8A8A',
        tertiary: '#757575',
        quaternary: '#757565',
    },
    text: '#FFFFFF',
    workspace: '#F9F9F9',
    toolboxHover: '#4C97FF',
    toolboxSelected: '#E9EEF2',
    toolboxText: '#575E75',
    toolbox: '#FFFFFF',
    blackText: '#575E75',
    flyout: '#F9F9F9',
    scrollbar: '#CECDCE',
    scrollbarHover: '#CECDCE',
    textField: '#FFFFFF',
    textFieldText: '#575E75',
    insertionMarker: '#000000',
    insertionMarkerOpacity: 0.2,
    dragShadowOpacity: 0.6,
    stackGlow: '#FFF200',
    stackGlowSize: 4,
    stackGlowOpacity: 1,
    replacementGlow: '#FFFFFF',
    replacementGlowSize: 2,
    replacementGlowOpacity: 1,
    colourPickerStroke: '#FFFFFF',
    // CSS colours: support RGBA
    fieldShadow: 'rgba(255, 255, 255, 0.3)',
    dropDownShadow: 'rgba(0, 0, 0, .3)',
    numPadBackground: '#547AB2',
    numPadBorder: '#435F91',
    numPadActiveBackground: '#435F91',
    numPadText: 'white', // Do not use hex here, it cannot be inlined with data-uri SVG
    valueReportBackground: '#FFFFFF',
    valueReportBorder: '#AAAAAA',
    valueReportForeground: '#000000',
    menuHover: 'rgba(0, 0, 0, 0.2)',
    contextMenuBackground: '#ffffff',
    contextMenuBorder: '#cccccc',
    contextMenuForeground: '#000000',
    contextMenuActiveBackground: '#d6e9f8',
    contextMenuDisabledForeground: '#cccccc',
    flyoutLabelColor: '#575E75',
    checkboxInactiveBackground: '#ffffff',
    checkboxInactiveBorder: '#c8c8c8',
    checkboxActiveBackground: '#4C97FF',
    checkboxActiveBorder: '#3373CC',
    checkboxCheck: '#ffffff',
    buttonBorder: '#c6c6c6',
    buttonActiveBackground: '#ffffff',
    buttonForeground: '#575E75',
    zoomIconFilter: 'none',
    gridColor: '#dddddd',
} as const;

interface IBlockColor {
    primary?: string;
    secondary?: string;
    tertiary?: string;
    quaternary?: string;
}

type IBlocksColor = typeof BlocksColor;

export {
    BlocksColor,
    type IBlocksColor,
    type IBlockColor
}