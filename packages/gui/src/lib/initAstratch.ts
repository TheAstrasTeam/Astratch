/** @author AI */
import { commandManager } from './CommandManager';
import { DB } from './DBManager';
import { menubarManager } from './MenubarManager';
import { quickOpenManager } from './QuickOpenManager';
import { themeManager } from './ThemeManager';
import { windowManager } from './WindowManager';
import { childID, isChildWindow, parentWindow } from '../utils/window';

const Astratch = {
    themeManager,
    menubarManager,
    DB,
    quickOpenManager,
    commandManager,
    windowManager,
};
Object.assign(window, { Astratch });

if (isChildWindow && childID) {
    const id = childID;
    windowManager._readyToParent(id, window);

    window.addEventListener('pagehide', () => {
        windowManager.deleteWindow(id);
    });

    /**
     * 父窗口死掉了也关
     */
    const parentWatcher = window.setInterval(() => {
        if (parentWindow?.closed) {
            window.clearInterval(parentWatcher);
            window.close();
        }
    }, 1000);
}
