/** @author AI */
import { beforeEach, describe, expect, test } from 'vitest';
import { useModal } from '../src/lib/ModalManager';

const getState = () => useModal.getState();

describe('ModalManager', () => {
    beforeEach(() => {
        useModal.setState({ modalStorage: new Map() });
    });

    test('添加窗口并填充默认值', () => {
        const id = getState().addModal({
            renderer: <div />,
            width: 100,
            height: 100,
            name: 'test modal',
        });

        expect(id).toEqual(expect.any(String));
        const modal = getState().getModal(id)!;
        expect(modal).toMatchObject({
            id,
            name: 'test modal',
            x: 0.5,
            y: 0.5,
            width: 250,
            height: 300,
            canFullscreen: true,
            canMove: true,
            canResize: true,
            zIndex: 1,
        });
    });

    test('显式传入的值不会被默认值覆盖', () => {
        const id = getState().addModal({
            renderer: <div />,
            id: 'modal',
            x: 0.1,
            y: 0.2,
            width: 400,
            height: 500,
            name: 'test modal',
            canFullscreen: false,
            canMove: false,
            canResize: false,
            zIndex: 10,
        });

        expect(id).toBe('modal');
        expect(getState().getModal(id)).toMatchObject({
            x: 0.1,
            y: 0.2,
            width: 400,
            height: 500,
            canFullscreen: false,
            canMove: false,
            canResize: false,
            zIndex: 10,
        });
    });

    test('多个窗口的 zIndex 依次递增', () => {
        const first = getState().addModal({
            renderer: <div />,
            width: 250,
            height: 300,
            name: 'a',
        });
        const second = getState().addModal({
            renderer: <div />,
            width: 250,
            height: 300,
            name: 'b',
        });

        expect(getState().getModal(first)!.zIndex).toBe(1);
        expect(getState().getModal(second)!.zIndex).toBe(2);
        expect(getState().getMaxZIndex()).toBe(2);
    });

    test('删除窗口', () => {
        const id = getState().addModal({ renderer: <div />, width: 250, height: 300, name: 'a' });

        expect(getState().deleteModal(id)).toBe(true);
        expect(getState().getModal(id)).toBeUndefined();
        expect(getState().deleteModal(id)).toBe(false);
    });

    test('设置窗口大小与位置', () => {
        const id = getState().addModal({ renderer: <div />, width: 250, height: 300, name: 'a' });

        getState().setModalSize(id, 600, 700);
        getState().setModalPos(id, 0.3, 0.4);

        const modal = getState().getModal(id)!;
        expect(modal.width).toBe(600);
        expect(modal.height).toBe(700);
        expect(modal.x).toBe(0.3);
        expect(modal.y).toBe(0.4);

        // 不存在的窗口不会被修改，也不会报错
        getState().setModalSize('missing', 100, 100);
        expect(getState().getModal(id)!.width).toBe(600);
    });

    test('设置 zIndex 与置顶', () => {
        const first = getState().addModal({
            renderer: <div />,
            width: 250,
            height: 300,
            name: 'a',
        });
        const second = getState().addModal({
            renderer: <div />,
            width: 250,
            height: 300,
            name: 'b',
        });

        getState().setModalZIndex(first, 10);
        expect(getState().getMaxZIndex()).toBe(10);

        getState().bringToFront(second);
        expect(getState().getModal(second)!.zIndex).toBe(11);

        // 已经在最上层时不会变化
        getState().bringToFront(second);
        expect(getState().getModal(second)!.zIndex).toBe(11);

        // 不存在的窗口不会报错
        expect(() => {
            getState().bringToFront('missing');
        }).not.toThrow();
    });
});
