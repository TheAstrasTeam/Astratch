import type { TTheme } from '../..';

const light = {
    id: 'astratch-theme-ui-light',
    translate: true,
    translateID: 'astratch-theme-light',
    kind: 'ui',
    mixWithAccent: true,
    isDarkTheme: false,
    scheme: {
        primary: '#fff',
        secondary: '#f6f6f6',
        tertiary: '#eee',
        quaternary: '#dfdfdf',
        'primary-icon': '#111111',
        'secondary-icon': '#1a1a1a',
        'tertiary-icon': '#222222',
        'quaternary-icon': '#303030',
        'transparent-dark': '#eeeeee70',
        'transparent-light': '#11111170',
        text: '#111111',
        'svg-filter': 'invert(0)',
    },
} satisfies TTheme;

export default light;
