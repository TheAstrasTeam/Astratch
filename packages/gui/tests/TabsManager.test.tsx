/** @author AI */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { tabsManager, type ITabGroupSubmit } from '../src/lib/TabsManager';

const RendererA = () => <div />;
const RendererB = () => <div />;
const element = (name: string) => ({ Renderer: RendererA, name });

const groupMeta = (overrides: Partial<ITabGroupSubmit> = {}): ITabGroupSubmit => ({
    parent: undefined,
    direction: 'horizontal',
    firstElement: element('first'),
    ...overrides,
});

const captureEvents = () => {
    const events: string[] = [];
    const onAdd = (data: { id: string }) => events.push(`ADD_GROUP:${data.id}`);
    const onDelete = (data: { id: string }) => events.push(`DELETE_GROUP:${data.id}`);
    const onWatching = (data: { id?: string }) =>
        events.push(`SET_WATCHING_GROUP:${data.id ?? 'undefined'}`);
    const onFocusing = (data: { id?: string; pos?: 'first' | 'second' }) =>
        events.push(`SET_FOCUSING_GROUP:${data.id ?? 'undefined'}:${data.pos ?? 'undefined'}`);
    const onHide = (data: { id: string }) => events.push(`HIDE_SECOND_ELEMENT:${data.id}`);

    tabsManager.on('ADD_GROUP', onAdd);
    tabsManager.on('DELETE_GROUP', onDelete);
    tabsManager.on('SET_WATCHING_GROUP', onWatching);
    tabsManager.on('SET_FOCUSING_GROUP', onFocusing);
    tabsManager.on('HIDE_SECOND_ELEMENT', onHide);

    return {
        events,
        dispose() {
            tabsManager.off('ADD_GROUP', onAdd);
            tabsManager.off('DELETE_GROUP', onDelete);
            tabsManager.off('SET_WATCHING_GROUP', onWatching);
            tabsManager.off('SET_FOCUSING_GROUP', onFocusing);
            tabsManager.off('HIDE_SECOND_ELEMENT', onHide);
        },
    };
};

let captured: ReturnType<typeof captureEvents>;

describe('TabsManager', () => {
    beforeEach(() => {
        tabsManager.groupStorage = new Map();
        tabsManager.watchingGroup = undefined;
        tabsManager.focusingGroup = undefined;
        tabsManager.focusingPos = undefined;
        captured = captureEvents();
    });

    afterEach(() => {
        captured.dispose();
    });

    describe('基础增删', () => {
        test('添加组时填充默认值', () => {
            const { id, group } = tabsManager.addGroup(groupMeta({ id: 'g' }), false, false);

            expect(id).toBe('g');
            expect(group).toMatchObject({
                id: 'g',
                parent: undefined,
                direction: 'horizontal',
                minFirstElementSize: 20,
                minSecondElementSize: 20,
                defaultSize: 0,
                _showSecondElement: true,
            });
            expect(group.secondElement).toBeUndefined();
            expect(tabsManager.getGroup('g')).toBe(group);
            expect(tabsManager.watchingGroup).toBeUndefined();
            expect(tabsManager.focusingGroup).toBeUndefined();
            expect(tabsManager.focusingPos).toBeUndefined();
        });

        test('使用传入的尺寸', () => {
            tabsManager.addGroup(
                groupMeta({
                    id: 'sized',
                    minFirstElementSize: 30,
                    minSecondElementSize: 40,
                    defaultSize: 50,
                }),
                false,
                false,
            );

            expect(tabsManager.getGroup('sized')).toMatchObject({
                minFirstElementSize: 30,
                minSecondElementSize: 40,
                defaultSize: 50,
            });
        });

        test('未提供 id 时自动生成，并可同时设为查看组和聚焦组', () => {
            const { id } = tabsManager.addGroup(groupMeta(), true, true);

            expect(id).toEqual(expect.any(String));
            expect(tabsManager.watchingGroup).toBe(id);
            expect(tabsManager.focusingGroup).toBe(id);
            expect(tabsManager.focusingPos).toBe('first');
            expect(captured.events).toEqual([
                `ADD_GROUP:${id}`,
                `SET_WATCHING_GROUP:${id}`,
                `SET_FOCUSING_GROUP:${id}:first`,
            ]);
        });

        test('设置查看组与聚焦组', () => {
            tabsManager.addGroup(groupMeta({ id: 'g' }), false, false);
            captured.events.length = 0;

            tabsManager.setWatchingGroup('g');
            expect(tabsManager.watchingGroup).toBe('g');

            tabsManager.setFocusingGroup('g', 'second');
            expect(tabsManager.focusingGroup).toBe('g');
            expect(tabsManager.focusingPos).toBe('second');

            tabsManager.setWatchingGroup(undefined);
            expect(tabsManager.watchingGroup).toBeUndefined();

            expect(captured.events).toEqual([
                'SET_WATCHING_GROUP:g',
                'SET_FOCUSING_GROUP:g:second',
                'SET_WATCHING_GROUP:undefined',
            ]);
        });

        test('删除不存在的组返回 false 且不发事件', () => {
            expect(tabsManager.deleteGroup('missing')).toBe(false);
            expect(captured.events).toEqual([]);
        });

        test('删除组时会递归删除以它为父组的组', () => {
            tabsManager.addGroup(groupMeta({ id: 'parent', firstElement: 'child' }), false, false);
            tabsManager.addGroup(groupMeta({ id: 'child', parent: 'parent' }), false, false);
            captured.events.length = 0;

            expect(tabsManager.deleteGroup('parent')).toBe(true);
            expect(tabsManager.groupStorage.size).toBe(0);
            expect(captured.events).toEqual(['DELETE_GROUP:child', 'DELETE_GROUP:parent']);
        });

        test('删除组时删除以它为第一元素的组', () => {
            tabsManager.addGroup(groupMeta({ id: 'parent', firstElement: 'target' }), false, false);
            tabsManager.addGroup(groupMeta({ id: 'target' }), false, false);

            tabsManager.deleteGroup('target');
            expect(tabsManager.getGroup('parent')).toBeUndefined();
            expect(tabsManager.groupStorage.size).toBe(0);
        });

        test('删除组时用第二元素替代被引用的第一元素', () => {
            const second = element('second');
            tabsManager.addGroup(
                groupMeta({ id: 'parent', firstElement: 'target', secondElement: second }),
                false,
                false,
            );
            tabsManager.addGroup(groupMeta({ id: 'target' }), false, false);

            tabsManager.deleteGroup('target');

            const parent = tabsManager.getGroup('parent')!;
            expect(parent.firstElement).toBe(second);
            expect(parent.secondElement).toBeUndefined();
        });

        test('删除组时清除以它为第二元素的引用', () => {
            tabsManager.addGroup(
                groupMeta({ id: 'parent', secondElement: 'target' }),
                false,
                false,
            );
            tabsManager.addGroup(groupMeta({ id: 'target' }), false, false);

            tabsManager.deleteGroup('target');

            const parent = tabsManager.getGroup('parent')!;
            expect(parent.secondElement).toBeUndefined();
        });

        test('删除组时查看组会跟随到父组', () => {
            tabsManager.addGroup(groupMeta({ id: 'parent' }), false, false);
            tabsManager.addGroup(groupMeta({ id: 'child', parent: 'parent' }), false, false);
            tabsManager.setWatchingGroup('child');

            tabsManager.deleteGroup('child');
            expect(tabsManager.watchingGroup).toBe('parent');
        });

        test('删除组时替换父组和子元素的指向', () => {
            tabsManager.addGroup(
                groupMeta({ id: 'parent', firstElement: 'target', secondElement: element('p2') }),
                false,
                false,
            );
            tabsManager.addGroup(groupMeta({ id: 'target', parent: 'parent' }), false, false);
            tabsManager.addGroup(groupMeta({ id: 'child', parent: 'target' }), false, false);
            tabsManager.addGroup(
                groupMeta({ id: 'sibling', secondElement: 'target' }),
                false,
                false,
            );
            tabsManager.setWatchingGroup('target');

            const result = tabsManager.addAndReplaceGroup(
                'target',
                groupMeta({ id: 'replacement', parent: 'parent' }),
            );

            expect(result?.id).toBe('replacement');
            expect(tabsManager.getGroup('target')).toBeUndefined();
            expect(tabsManager.getGroup('parent')!.firstElement).toBe('replacement');
            expect(tabsManager.getGroup('child')!.parent).toBe('replacement');
            expect(tabsManager.getGroup('sibling')!.secondElement).toBe('replacement');
            expect(tabsManager.watchingGroup).toBe('replacement');
        });

        test('替换不存在的组返回 undefined 且不添加新组', () => {
            expect(
                tabsManager.addAndReplaceGroup('missing', groupMeta({ id: 'new' })),
            ).toBeUndefined();
            expect(tabsManager.groupStorage.size).toBe(0);
            expect(captured.events).toEqual([]);
        });

        test('没有聚焦组时替换聚焦组不做任何事', () => {
            expect(tabsManager.addAndReplaceFocusingGroup(groupMeta())).toBeUndefined();
            expect(tabsManager.groupStorage.size).toBe(0);
        });

        test('替换聚焦组', () => {
            tabsManager.addGroup(groupMeta({ id: 'old' }), false, true);

            expect(tabsManager.addAndReplaceFocusingGroup(groupMeta({ id: 'new' }))?.id).toBe(
                'new',
            );
            expect(tabsManager.getGroup('old')).toBeUndefined();
            expect(tabsManager.getGroup('new')).toBeDefined();
            expect(tabsManager.focusingGroup).toBe('new');
        });
    });

    describe('删除组内元素', () => {
        test('删除第二元素', () => {
            const first = element('first');
            tabsManager.addGroup(
                groupMeta({ id: 'g', firstElement: first, secondElement: element('second') }),
                false,
                false,
            );

            tabsManager.deleteElementOfGroup('g', 'second');

            const group = tabsManager.getGroup('g')!;
            expect(group.firstElement).toBe(first);
            expect(group.secondElement).toBeUndefined();
        });

        test('删除第一元素时提升第二元素', () => {
            const second = element('second');
            tabsManager.addGroup(
                groupMeta({ id: 'g', firstElement: element('first'), secondElement: second }),
                false,
                false,
            );

            tabsManager.deleteElementOfGroup('g', 'first');

            const group = tabsManager.getGroup('g')!;
            expect(group.firstElement).toBe(second);
            expect(group.secondElement).toBeUndefined();
        });

        test('删除没有第二元素的第一元素时删除整个组', () => {
            tabsManager.addGroup(groupMeta({ id: 'g' }), false, false);

            tabsManager.deleteElementOfGroup('g', 'first');

            expect(tabsManager.getGroup('g')).toBeUndefined();
        });

        test('对不存在的组不做任何事', () => {
            expect(() => {
                tabsManager.deleteElementOfGroup('missing', 'second');
            }).not.toThrow();
            expect(captured.events).toEqual([]);
        });
    });

    describe('隐藏与清理', () => {
        test('切换第二元素的显示状态', () => {
            tabsManager.addGroup(groupMeta({ id: 'g' }), false, false);
            captured.events.length = 0;

            tabsManager.hideGroupSecondElement('g');
            expect(tabsManager.getGroup('g')!._showSecondElement).toBe(false);
            expect(captured.events).toEqual(['HIDE_SECOND_ELEMENT:g']);

            tabsManager.hideGroupSecondElement('g');
            expect(tabsManager.getGroup('g')!._showSecondElement).toBe(true);
            expect(captured.events).toEqual(['HIDE_SECOND_ELEMENT:g', 'HIDE_SECOND_ELEMENT:g']);

            tabsManager.hideGroupSecondElement('missing');
            expect(captured.events).toHaveLength(2);
        });

        test('清理无意义的组并修正指向', () => {
            tabsManager.addGroup(groupMeta({ id: 'wrapper', firstElement: 'real' }), false, false);
            tabsManager.addGroup(groupMeta({ id: 'real' }), false, false);
            tabsManager.addGroup(
                groupMeta({ id: 'child', parent: 'wrapper', firstElement: element('child') }),
                false,
                false,
            );
            tabsManager.addGroup(
                groupMeta({
                    id: 'holder',
                    firstElement: element('holder'),
                    secondElement: 'wrapper',
                }),
                false,
                false,
            );
            tabsManager.setWatchingGroup('wrapper');
            captured.events.length = 0;

            tabsManager.sweepGroup();

            expect(tabsManager.getGroup('wrapper')).toBeUndefined();
            expect(tabsManager.getGroup('child')!.parent).toBe('real');
            expect(tabsManager.getGroup('holder')!.secondElement).toBe('real');
            expect(tabsManager.watchingGroup).toBe('real');
            expect(captured.events).toEqual(['SET_WATCHING_GROUP:real', 'DELETE_GROUP:wrapper']);
        });

        test('不会清理聚焦组', () => {
            tabsManager.addGroup(groupMeta({ id: 'wrapper', firstElement: 'real' }), false, true);
            tabsManager.addGroup(groupMeta({ id: 'real' }), false, false);

            tabsManager.sweepGroup();

            expect(tabsManager.getGroup('wrapper')).toBeDefined();
            expect(tabsManager.getGroup('real')).toBeDefined();
        });
    });

    describe('插入元素', () => {
        test('没有查看组时创建一个新的查看组', () => {
            const inserted = element('inserted');
            tabsManager.insertElementToFocusingGroup(inserted);

            const id = tabsManager.watchingGroup!;
            expect(id).toEqual(expect.any(String));
            expect(tabsManager.focusingGroup).toBe(id);

            const group = tabsManager.getGroup(id)!;
            expect(group.firstElement).toBe(inserted);
            expect(group.secondElement).toBeUndefined();
            expect(group.parent).toBeUndefined();
        });

        test('没有聚焦组时直接填入查看组的第二元素', () => {
            const first = element('first');
            tabsManager.addGroup(groupMeta({ id: 'watching', firstElement: first }), true, false);

            const inserted = element('inserted');
            tabsManager.insertElementToFocusingGroup(inserted);

            const group = tabsManager.getGroup('watching')!;
            expect(group.firstElement).toBe(first);
            expect(group.secondElement).toBe(inserted);
            expect(tabsManager.watchingGroup).toBe('watching');
        });

        test('没有聚焦组且已有第二元素时移动到新的子组', () => {
            const oldSecond = element('old second');
            tabsManager.addGroup(
                groupMeta({
                    id: 'watching',
                    firstElement: element('first'),
                    secondElement: oldSecond,
                }),
                true,
                false,
            );

            const inserted = element('inserted');
            tabsManager.insertElementToFocusingGroup(inserted);

            const group = tabsManager.getGroup('watching')!;
            expect(typeof group.secondElement).toBe('string');

            const nested = tabsManager.getGroup(group.secondElement as string)!;
            expect(nested).not.toBe(group);
            expect(nested.parent).toBe('watching');
            expect(nested.firstElement).toBe(oldSecond);
            expect(nested.secondElement).toBe(inserted);
        });

        test('聚焦组没有第二元素时直接填入', () => {
            const first = element('first');
            tabsManager.addGroup(groupMeta({ id: 'focusing', firstElement: first }), true, true);

            const inserted = element('inserted');
            tabsManager.insertElementToFocusingGroup(inserted);

            const group = tabsManager.getGroup('focusing')!;
            expect(group.firstElement).toBe(first);
            expect(group.secondElement).toBe(inserted);
        });

        test('聚焦第一元素且已有第二元素时移动到新的子组', () => {
            const first = element('first');
            const second = element('second');
            tabsManager.addGroup(
                groupMeta({ id: 'focusing', firstElement: first, secondElement: second }),
                true,
                true,
            );

            const inserted = element('inserted');
            tabsManager.insertElementToFocusingGroup(inserted);

            const group = tabsManager.getGroup('focusing')!;
            expect(typeof group.firstElement).toBe('string');
            expect(group.secondElement).toBe(second);

            const nested = tabsManager.getGroup(group.firstElement as string)!;
            expect(nested.parent).toBe('focusing');
            expect(nested.firstElement).toBe(first);
            expect(nested.secondElement).toBe(inserted);
        });

        test('聚焦第二元素且已有第二元素时移动到新的子组', () => {
            const first = element('first');
            const second = element('second');
            tabsManager.addGroup(
                groupMeta({ id: 'focusing', firstElement: first, secondElement: second }),
                true,
                true,
            );
            tabsManager.setFocusingGroup('focusing', 'second');

            const inserted = element('inserted');
            tabsManager.insertElementToFocusingGroup(inserted);

            const group = tabsManager.getGroup('focusing')!;
            expect(group.firstElement).toBe(first);
            expect(typeof group.secondElement).toBe('string');

            const nested = tabsManager.getGroup(group.secondElement as string)!;
            expect(nested.parent).toBe('focusing');
            expect(nested.firstElement).toBe(second);
            expect(nested.secondElement).toBe(inserted);
        });
    });

    describe('切换元素', () => {
        test('替换第一元素与第二元素', () => {
            const first = element('first');
            const second = element('second');
            tabsManager.addGroup(
                groupMeta({ id: 'g', firstElement: first, secondElement: second }),
                false,
                false,
            );

            tabsManager.changeElement('g', 'first', RendererB, 'new first');

            let group = tabsManager.getGroup('g')!;
            expect(group.id).toBe('g');
            expect(group.firstElement).toEqual({ Renderer: RendererB, name: 'new first' });
            expect(group.secondElement).toBe(second);

            tabsManager.changeElement('g', 'second', RendererA, 'new second');

            group = tabsManager.getGroup('g')!;
            expect(group.secondElement).toEqual({ Renderer: RendererA, name: 'new second' });
        });

        test('对不存在的组不做任何事', () => {
            expect(() => {
                tabsManager.changeElement('missing', 'first', RendererB, 'new');
            }).not.toThrow();
            expect(tabsManager.groupStorage.size).toBe(0);
        });
    });
});
