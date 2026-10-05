import { EventBus } from 'astratch-core';
import { isChildWindow, parentWindow } from '../../utils/window';

interface IWindowManagerEventTypes {
    CREATE_WINDOW: {
        id: string;
    };
    DELETED_WINDOW: {
        id: string;
    };
}

const CHILD_READY_TIMEOUT = 10000;

class WindowManager extends EventBus<IWindowManagerEventTypes> {
    windowStorage = new Map<string, Window>();

    /** 已 open，还没加载完的新窗口 */
    private readonly readyWaiters = new Map<string, (id: string) => void>();

    /**
     * 新建一个子窗口，要在鼠标点击事件里调用
     */
    async newWindow(): Promise<string> {
        const id = crypto.randomUUID();
        const target = window.open(window.location.href, id, 'popup');
        if (!target) throw new Error('Create new window failed.');

        return await new Promise<string>((resolve, reject) => {
            const timer = window.setTimeout(() => {
                this.readyWaiters.delete(id);
                try {
                    target.close();
                } catch {
                    // 忽略
                }
                reject(new Error(`Create window timeout`));
            }, CHILD_READY_TIMEOUT);

            this.readyWaiters.set(id, value => {
                window.clearTimeout(timer);
                resolve(value);
            });
        });
    }

    _readyToParent(id: string, childWindow: Window): void {
        this.windowStorage.set(id, childWindow);
        this.readyWaiters.get(id)?.(id);
        this.readyWaiters.delete(id);
        this.emit('CREATE_WINDOW', { id });
    }

    deleteWindow(id: string): boolean {
        if (!this.windowStorage.delete(id)) return false;
        this.emit('DELETED_WINDOW', { id });
        return true;
    }

    getWindow(id: string): Window | undefined {
        return this.windowStorage.get(id);
    }

    forEachOther(callback: (target: Window) => void): void {
        if (isChildWindow) {
            windowManager.windowStorage.forEach(childWindow => {
                if (childWindow.name !== window.name) callback(childWindow);
            });
            // 总会存在
            callback(parentWindow!.parent);
        } else {
            windowManager.windowStorage.forEach(childWindow => {
                callback(childWindow);
            });
        }
    }
}

const windowManager: WindowManager = parentWindow?.Astratch?.windowManager ?? new WindowManager();

export { windowManager, type IWindowManagerEventTypes };
