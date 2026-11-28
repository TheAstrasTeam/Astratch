/** @author AI */
import { beforeEach, describe, expect, test } from 'vitest';
import { windowManager } from '../src/lib/WindowManager';

const resetWindowManager = () => {
    windowManager.windowStorage = new Map();
};

describe('WindowManager', () => {
    beforeEach(resetWindowManager);

    test('未创建窗口时读取失败', () => {
        expect(windowManager.getWindow('missing')).toBeUndefined();
        expect(windowManager.deleteWindow('missing')).toBe(false);
    });

    test('子窗口就绪后保存并通知', () => {
        const events: string[] = [];
        const onCreate = (data: { id: string }) => events.push(`CREATE:${data.id}`);
        windowManager.on('CREATE_WINDOW', onCreate);

        windowManager._readyToParent('child', window);

        expect(windowManager.getWindow('child')).toBe(window);
        expect(events).toEqual(['CREATE:child']);

        windowManager.off('CREATE_WINDOW', onCreate);
    });

    test('删除窗口并通知', () => {
        const events: string[] = [];
        const onDelete = (data: { id: string }) => events.push(`DELETE:${data.id}`);
        windowManager.on('DELETE_WINDOW', onDelete);

        windowManager._readyToParent('child', window);
        expect(windowManager.deleteWindow('child')).toBe(true);
        expect(windowManager.getWindow('child')).toBeUndefined();
        expect(events).toEqual(['DELETE:child']);

        windowManager.off('DELETE_WINDOW', onDelete);
    });

    test('遍历其它窗口', () => {
        // 测试环境不是子窗口，因此所有子窗口都会被遍历
        windowManager._readyToParent('a', window);
        windowManager._readyToParent('b', window);

        const targets: Window[] = [];
        windowManager.forEachOther(target => targets.push(target));

        expect(targets).toHaveLength(2);
        expect(targets.every(target => target === window)).toBe(true);
    });
});
