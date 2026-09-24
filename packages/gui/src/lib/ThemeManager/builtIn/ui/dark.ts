import type { TTheme } from '../..';

const dark = {
    id: 'astratch-theme-ui-dark',
    translate: true,
    translateID: 'astratch-theme-dark',
    kind: 'ui',
    mixWithAccent: false,
    isDarkTheme: true,
    scheme: {
        primary: '#111111',
        secondary: '#1a1a1a',
        tertiary: '#222222',
        quaternary: '#303030',
        'primary-icon': '#eeeeee',
        'secondary-icon': '#e5e5e5',
        'tertiary-icon': '#dddddd',
        'quaternary-icon': '#cfcfcf',
        'transparent-dark': '#11111170',
        'transparent-light': '#eeeeee70',
        text: '#eeeeee',
    },
} as TTheme;

export default dark;
