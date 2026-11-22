import type { VM } from 'astratch-vm';
import type { commandManager } from './lib/CommandManager';
import type { DB } from './lib/DBManager';
import type { menubarManager } from './lib/MenubarManager';
import type { quickOpenManager } from './lib/QuickOpenManager';
import type { tabsManager } from './lib/TabsManager';
import type { themeManager } from './lib/ThemeManager';
import type { AsyncRemote } from './lib/vm';
import type { windowManager } from './lib/WindowManager';

declare global {
    interface Window {
        Astratch?: {
            themeManager: typeof themeManager;
            menubarManager: typeof menubarManager;
            DB: typeof DB;
            quickOpenManager: typeof quickOpenManager;
            commandManager: typeof commandManager;
            windowManager: typeof windowManager;
            tabsManager: typeof tabsManager;
            vm: AsyncRemote<VM>;
        };
    }
}
