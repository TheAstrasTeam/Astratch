/** @author AI */
import { beforeEach, describe, expect, test } from 'vitest';
import { bottomBarManager, type BottomBarSubmitItem } from '../src/lib/BottomBarManager';

const Renderer = () => <div />;

const itemMeta: BottomBarSubmitItem = {
    translate: false,
    description: 'a test item',
    commandID: 'test.command',
    Renderer,
    pos: 'left',
};

describe('BottomBarManager', () => {
    beforeEach(() => {
        // 清除内置项，避免测试之间互相影响
        bottomBarManager.items = new Map();
    });

    test('添加并读取底栏项', () => {
        expect(bottomBarManager.addItem({ ...itemMeta, id: 'item' })).toEqual('item');

        const item = bottomBarManager.getItem('item');
        expect(item).toMatchObject({
            id: 'item',
            description: 'a test item',
            commandID: 'test.command',
            pos: 'left',
        });
        // 未提供 tip 时会得到一个空的文本提示
        expect(item!.tip()).toEqual({ tip: '', tipMode: 'text' });
    });

    test('未提供 id 时自动生成', () => {
        const id = bottomBarManager.addItem(itemMeta);
        expect(id).toEqual(expect.any(String));
        expect(bottomBarManager.getItem(id)).toBeDefined();
    });

    test('删除底栏项', () => {
        bottomBarManager.addItem({ ...itemMeta, id: 'item' });
        expect(bottomBarManager.deleteItem('item')).toBe(true);
        expect(bottomBarManager.getItem('item')).toBeUndefined();
        expect(bottomBarManager.deleteItem('item')).toBe(false);
    });

    test('列出底栏项', () => {
        bottomBarManager.addItem({ ...itemMeta, id: 'a' });
        bottomBarManager.addItem({ ...itemMeta, id: 'b', pos: 'right' });

        const list = bottomBarManager.listItem();
        expect(list.map(([id]) => id)).toEqual(['a', 'b']);
        expect(list[1][1].pos).toEqual('right');
    });

    test('事件', () => {
        const events: string[] = [];
        const onAdd = (data: { id: string }) => events.push(`ADD:${data.id}`);
        const onDelete = (data: { id: string }) => events.push(`DELETE:${data.id}`);
        bottomBarManager.on('ADD_BOTTOM_ITEM', onAdd);
        bottomBarManager.on('DELETE_BOTTOM_ITEM', onDelete);

        bottomBarManager.addItem({ ...itemMeta, id: 'item' });
        bottomBarManager.deleteItem('item');
        // 删除不存在的项不应发出事件
        bottomBarManager.deleteItem('item');

        expect(events).toEqual(['ADD:item', 'DELETE:item']);

        bottomBarManager.off('ADD_BOTTOM_ITEM', onAdd);
        bottomBarManager.off('DELETE_BOTTOM_ITEM', onDelete);
    });
});
