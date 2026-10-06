/** 在Astratch运行时中获取的快照 */

export const dark = `
:root{color-scheme: dark;--ui-primary: #111111;--ui-secondary: #1a1a1a;--ui-tertiary: #222222;--ui-quaternary: #303030;--ui-primary-icon: #eeeeee;--ui-secondary-icon: #e5e5e5;--ui-tertiary-icon: #dddddd;--ui-quaternary-icon: #cfcfcf;--ui-transparent-dark: #11111170;--ui-transparent-light: #eeeeee70;--ui-text: #eeeeee;--ui-svg-filter: invert(1);}
:root{--accent-primary: #0099ff;--accent-secondary: #0066ff;--accent-tertiary: #0033aa;--accent-transparent: #0099ff55;--accent-highlight: #66ccff;}
`

export const light = `
:root{color-scheme: light;--ui-primary: color-mix(in srgb, #fff 95%, var(--accent-primary));--ui-secondary: color-mix(in srgb, #f6f6f6 95%, var(--accent-primary));--ui-tertiary: color-mix(in srgb, #eee 95%, var(--accent-primary));--ui-quaternary: color-mix(in srgb, #dfdfdf 95%, var(--accent-primary));--ui-primary-icon: color-mix(in srgb, #111111 95%, var(--accent-primary));--ui-secondary-icon: color-mix(in srgb, #1a1a1a 95%, var(--accent-primary));--ui-tertiary-icon: color-mix(in srgb, #222222 95%, var(--accent-primary));--ui-quaternary-icon: color-mix(in srgb, #303030 95%, var(--accent-primary));--ui-transparent-dark: color-mix(in srgb, #eeeeee70 95%, var(--accent-primary));--ui-transparent-light: color-mix(in srgb, #11111170 95%, var(--accent-primary));--ui-text: color-mix(in srgb, #111111 95%, var(--accent-primary));--ui-svg-filter: invert(0);}
:root{--accent-primary: #0099ff;--accent-secondary: #0066ff;--accent-tertiary: #0033aa;--accent-transparent: #0099ff55;--accent-highlight: #66ccff;}
`