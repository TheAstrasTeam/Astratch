/** @author AI */
import { beforeEach, describe, expect, test, vi } from 'vitest';

// 侧边栏的内置项会引入使用 SharedWorker 的 vm，测试环境里用空模块代替
vi.mock('../src/lib/vm/vm', () => ({ vm: {}, proxyVM: {} }));

import { sidebar, type ISidebarSubmitItem } from '../src/lib/SidebarManager';

const Renderer = () => ({
    Node: () => <div />,
    storage: () => ({}),
});
const Icon = () => <svg />;

const itemMeta: ISidebarSubmitItem = {
    Renderer,
    Icon,
    name: 'a test item',
    enable: () => true,
};

describe('SidebarManager', () => {
    beforeEach(() => {
        // 清除内置项，避免测试之间互相影响
        sidebar.storage = new Map();
    });

    test('添加并读取侧边栏项', () => {
        expect(sidebar.addItem({ ...itemMeta, id: 'item', alt: 'alt' })).toBe('item');

        const item = sidebar.listItem()[0];
        expect(item).toMatchObject({
            id: 'item',
            alt: 'alt',
            name: 'a test item',
            latestStorage: {},
        });
        expect(sidebar.getRenderer('item')).toBe(Renderer);
    });

    test('未提供 id 和 alt 时使用默认值', () => {
        const id = sidebar.addItem(itemMeta);
        expect(id).toEqual(expect.any(String));
        expect(sidebar.listItem()[0].alt).toEqual('');
    });

    test('删除侧边栏项', () => {
        sidebar.addItem({ ...itemMeta, id: 'item' });
        expect(sidebar.removeItem('item')).toBe(true);
        expect(sidebar.getRenderer('item')).toBeUndefined();
        expect(sidebar.removeItem('item')).toBe(false);
    });

    test('移动项到底部和顶部', () => {
        sidebar.addItem({ ...itemMeta, id: 'a' });
        sidebar.addItem({ ...itemMeta, id: 'b' });
        sidebar.addItem({ ...itemMeta, id: 'c' });

        sidebar.moveItemToLast('a');
        expect([...sidebar.storage.keys()]).toEqual(['b', 'c', 'a']);

        sidebar.moveItemToTop('a');
        expect([...sidebar.storage.keys()]).toEqual(['a', 'b', 'c']);

        // 不存在的 id 不会改变顺序
        sidebar.moveItemToTop('missing');
        sidebar.moveItemToLast('missing');
        expect([...sidebar.storage.keys()]).toEqual(['a', 'b', 'c']);
    });

    test('读写组件的存储', () => {
        sidebar.addItem({ ...itemMeta, id: 'item' });
        sidebar.setStorage('item', { hello: 'world' });

        expect(sidebar.readStorageFromID('item')).toEqual({ hello: 'world' });
        expect(sidebar.readStorageFromID('missing')).toBeUndefined();
    });

    test('事件', () => {
        const events: string[] = [];
        const onAdd = (data: { id: string }) => events.push(`ADD:${data.id}`);
        const onDelete = (data: { id: string }) => events.push(`DELETE:${data.id}`);
        sidebar.on('ADD_ITEM', onAdd);
        sidebar.on('DELETE_ITEM', onDelete);

        sidebar.addItem({ ...itemMeta, id: 'item' });
        sidebar.removeItem('item');
        // 删除不存在的项不应发出事件
        sidebar.removeItem('item');

        expect(events).toEqual(['ADD:item', 'DELETE:item']);

        sidebar.off('ADD_ITEM', onAdd);
        sidebar.off('DELETE_ITEM', onDelete);
    });
});
