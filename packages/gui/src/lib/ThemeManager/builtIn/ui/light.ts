import type { TTheme } from '../..';

const light = {
    id: 'astratch-theme-ui-light',
    translate: true,
    translateID: 'astratch-theme-light',
    kind: 'ui',
    mixWithAccent: true,
    isDarkTheme: false,
    scheme: {
        primary: '#f5f5f5',
        secondary: '#e5e5e5',
        tertiary: '#dddddd',
        quaternary: '#cfcfcf',
        'primary-icon': '#111111',
        'secondary-icon': '#1a1a1a',
        'tertiary-icon': '#222222',
        'quaternary-icon': '#303030',
        'transparent-dark': '#eeeeee70',
        'transparent-light': '#11111170',
        text: '#111111',
    },
} satisfies TTheme;

export default light;
