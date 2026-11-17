import LogoIconDark from '@as/logo/darkLogo.svg?react';
import LogoIconLight from '@as/logo/lightLogo.svg?react';
import { useEffect, useState } from 'react';
import { themeManager } from '../../lib/ThemeManager';

export const Logo = () => {
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const update = () => {
            void (async () => {
                setIsDark((await themeManager.getUsingTheme('ui')).isDarkTheme);
            })();
        };
        update();
        themeManager.off('APPLY_THEME', update);
        themeManager.on('APPLY_THEME', update);
        return () => {
            themeManager.off('APPLY_THEME', update);
        };
    }, []);
    return <>{isDark ? <LogoIconLight /> : <LogoIconDark />}</>;
};
