import { beforeEach, describe, expect, test } from 'vitest';
import { quickOpenManager } from '../src/lib/QuickOpenManager';

import TestImage from '@as/blocks.svg?react';

const Renderer = () => <div></div>;

describe('QuickOpen', () => {
    beforeEach(() => {
        quickOpenManager.modes = new Map();
    });
    test('创建模式', () => {
        for (let i = 0; i <= 200; i += 1)
            expect(
                quickOpenManager.addMode({
                    translate: true,
                    nameID: 'a',
                    descriptionID: 'b',
                    icon: TestImage,
                    shortcut: [],
                    prefix: 'T',
                    id: crypto.randomUUID(),
                    Renderer,
                }),
            ).toEqual({
                dispose: expect.any(Function) as () => void,
                id: expect.any(String) as string,
            });
    });
    test('在有相同ID时报错', () => {
        const id = 'SAME ID!';
        expect(
            quickOpenManager.addMode({
                translate: true,
                nameID: 'a',
                descriptionID: 'b',
                icon: TestImage,
                shortcut: [],
                prefix: 'T',
                id,
                Renderer,
            }),
        ).toEqual({
            dispose: expect.any(Function) as () => void,
            id,
        });
        expect(() =>
            quickOpenManager.addMode({
                translate: true,
                nameID: 'a',
                descriptionID: 'b',
                icon: TestImage,
                shortcut: [],
                prefix: 'T',
                id,
                Renderer,
            }),
        ).toThrow(Error);
    });
    test('删除模式', () => {
        const id = 'hello';
        expect(
            quickOpenManager.addMode({
                translate: true,
                nameID: 'a',
                descriptionID: 'b',
                icon: TestImage,
                shortcut: [],
                prefix: 'T',
                id,
                Renderer,
            }),
        ).toEqual({
            dispose: expect.any(Function) as () => void,
            id,
        });
        quickOpenManager.deleteMode(id);
        expect(quickOpenManager.getMode(id)).toEqual(undefined);
    });
});
