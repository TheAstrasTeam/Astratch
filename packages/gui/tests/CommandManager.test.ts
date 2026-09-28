import { describe, expect, test } from 'vitest';
import { commandManager } from '../src/lib/CommandManager';

describe('command Manager', () => {
    const id = 'hi' as const;
    const testMeta = {
        id,
        author: 'me',
        callback: () => {
            return;
        },
        translate: false,
        description: 'a test',
        name: 'test',
    } as const;
    test('添加命令', () => {
        expect(commandManager.addCommand(testMeta)).toEqual({
            dispose: expect.any(Function) as () => void,
        });
    });
    test('添加命令然后销毁', () => {
        const command = commandManager.addCommand(testMeta);
        expect(command).toEqual({ dispose: expect.any(Function) as () => void });
        command.dispose();
        expect(commandManager.getCommandMeta(id)).toEqual(undefined);
    });
    test('删除命令', () => {
        const command = commandManager.addCommand(testMeta);
        expect(command).toEqual({ dispose: expect.any(Function) as () => void });
        commandManager.deleteCommand(id);
        expect(commandManager.getCommandMeta(id)).toEqual(undefined);
    });
    test('事件', () => {
        const success = {
            event_added: false,
            event_deleted: false,
        };
        const event_added = () => {
            success.event_added = true;
        };
        const event_deleted = () => {
            success.event_deleted = true;
        };
        commandManager.on('ADDED_COMMAND', event_added);
        commandManager.on('DELETED_COMMAND', event_deleted);
        commandManager.addCommand(testMeta);
        commandManager.deleteCommand(id);
        expect(success).toEqual({
            event_added: true,
            event_deleted: true,
        });
    });
});
