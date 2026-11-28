/** @author AI */
import { beforeEach, describe, expect, test } from 'vitest';
import {
    menubarManager,
    MenubarManagerPositions,
    type TMenubarManagerPositions,
} from '../src/lib/MenubarManager';

const resetMenubar = () => {
    for (const pos of MenubarManagerPositions) {
        menubarManager.menubarStorage.set(pos, new Map());
    }
};

const addTestCategory = (pos: TMenubarManagerPositions = 'project', id = 'category') =>
    menubarManager.addCategory(pos, { translate: false, name: 'test category', id });

describe('MenubarManager', () => {
    beforeEach(resetMenubar);

    test('添加并读取菜单类别', () => {
        const id = addTestCategory();

        expect(id).toBe('category');
        expect(menubarManager.getCategory('project', id)).toEqual({
            meta: { translate: false, name: 'test category', id },
            children: [],
        });
        expect(menubarManager.listPosition('project').size).toBe(1);
    });

    test('未提供类别 id 时自动生成', () => {
        const id = menubarManager.addCategory('project', { translate: false, name: 'test' });
        expect(id).toEqual(expect.any(String));
        expect(menubarManager.getCategory('project', id)).toBeDefined();
    });

    test('向不存在的类别添加菜单项时报错', () => {
        expect(() => {
            menubarManager.addValue('project', 'missing', { isDivider: true });
        }).toThrow(Error);
    });

    test('添加普通菜单项并填充默认值', () => {
        addTestCategory();
        menubarManager.addValue('project', 'category', {
            translate: false,
            name: 'value',
            commandID: 'test.command',
            id: 'value',
        });

        const value = menubarManager.getValue('project', 'value');
        expect(value).toMatchObject({
            id: 'value',
            translate: false,
            name: 'value',
            commandID: 'test.command',
            isDivider: false,
        });
        if (!value || value.isDivider) throw new Error('value should not be a divider');

        expect(value.isEnable()).toBe(true);
        expect(value.isVisible()).toBe(true);
    });

    test('添加分割线', () => {
        addTestCategory();
        menubarManager.addValue('project', 'category', { isDivider: true });

        const values = menubarManager.getCategory('project', 'category')!.children;
        expect(values).toHaveLength(1);
        expect(values[0].isDivider).toBe(true);
        expect(values[0].id).toEqual(expect.any(String));
    });

    test('递归解析子菜单项', () => {
        addTestCategory();
        menubarManager.addValue('project', 'category', {
            translate: false,
            name: 'parent',
            children: [
                { isDivider: true },
                { translate: false, name: 'child', commandID: 'test.command' },
            ],
        });

        const value = menubarManager.getCategory('project', 'category')!.children[0];
        if (value.isDivider) throw new Error('value should not be a divider');
        const children = value.children;
        if (!children) throw new Error('value should have children');

        expect(children).toHaveLength(2);
        expect(children[0].isDivider).toBe(true);

        const child = children[1];
        if (child.isDivider || child.translate) throw new Error('invalid child');
        expect(child.name).toBe('child');
        expect(child.id).toEqual(expect.any(String));
        expect(child.isEnable()).toBe(true);
        expect(child.isVisible()).toBe(true);
    });

    test('删除菜单项（包括嵌套项）', () => {
        addTestCategory();
        menubarManager.addValue('project', 'category', {
            translate: false,
            name: 'parent',
            id: 'parent',
            children: [{ translate: false, name: 'child', commandID: 'test.command', id: 'child' }],
        });

        expect(menubarManager.deleteValue('project', 'child')).toBe(true);
        const parent = menubarManager.getCategory('project', 'category')!.children[0];
        if (parent.isDivider) throw new Error('parent should not be a divider');
        expect(parent.children).toHaveLength(0);

        expect(menubarManager.deleteValue('project', 'parent')).toBe(true);
        expect(menubarManager.getValue('project', 'parent')).toBeUndefined();
        expect(menubarManager.deleteValue('project', 'missing')).toBe(false);
    });

    test('删除菜单类别', () => {
        addTestCategory();
        expect(menubarManager.deleteCategory('project', 'category')).toBe(true);
        expect(menubarManager.getCategory('project', 'category')).toBeUndefined();
        expect(menubarManager.deleteCategory('project', 'category')).toBe(false);
    });

    test('调整类别顺序', () => {
        addTestCategory('project', 'a');
        addTestCategory('project', 'b');
        addTestCategory('project', 'c');
        expect([...menubarManager.listPosition('project').keys()]).toEqual(['a', 'b', 'c']);

        menubarManager.moveCategoryLayerToLast('project', 'a');
        expect([...menubarManager.listPosition('project').keys()]).toEqual(['b', 'c', 'a']);

        menubarManager.moveCategoryLayerToTop('project', 'a');
        expect([...menubarManager.listPosition('project').keys()]).toEqual(['a', 'b', 'c']);

        // 不存在的类别不会改变顺序
        menubarManager.moveCategoryLayerToTop('project', 'missing');
        menubarManager.moveCategoryLayerToLast('project', 'missing');
        expect([...menubarManager.listPosition('project').keys()]).toEqual(['a', 'b', 'c']);
    });

    test('事件', () => {
        const events: string[] = [];
        const onAddCategory = (data: { id: string }) => events.push(`ADD_CATEGORY:${data.id}`);
        const onAddValue = (data: { id: string }) => events.push(`ADD_VALUE:${data.id}`);
        const onDeleteValue = (data: { id: string }) => events.push(`DELETE_VALUE:${data.id}`);
        const onDeleteCategory = (data: { id: string }) =>
            events.push(`DELETE_CATEGORY:${data.id}`);
        const onEditCategory = () => events.push('EDIT_CATEGORY');

        menubarManager.on('ADD_CATEGORY', onAddCategory);
        menubarManager.on('ADD_VALUE', onAddValue);
        menubarManager.on('DELETE_VALUE', onDeleteValue);
        menubarManager.on('DELETE_CATEGORY', onDeleteCategory);
        menubarManager.on('EDIT_CATEGORY', onEditCategory);

        addTestCategory();
        menubarManager.addValue('project', 'category', {
            translate: false,
            name: 'value',
            commandID: 'test.command',
            id: 'value',
        });
        menubarManager.deleteValue('project', 'value');
        menubarManager.deleteCategory('project', 'category');

        expect(events).toEqual([
            'ADD_CATEGORY:category',
            'EDIT_CATEGORY',
            'ADD_VALUE:value',
            'DELETE_VALUE:value',
            'EDIT_CATEGORY',
            'DELETE_CATEGORY:category',
            'EDIT_CATEGORY',
        ]);

        menubarManager.off('ADD_CATEGORY', onAddCategory);
        menubarManager.off('ADD_VALUE', onAddValue);
        menubarManager.off('DELETE_VALUE', onDeleteValue);
        menubarManager.off('DELETE_CATEGORY', onDeleteCategory);
        menubarManager.off('EDIT_CATEGORY', onEditCategory);
    });
});
