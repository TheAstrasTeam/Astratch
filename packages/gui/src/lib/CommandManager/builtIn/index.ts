import { commandManager } from '..';

export const loadBuiltInCommands = () => {
    commandManager.addCommand({
        translate: false,
        name: '测试',
        author: 'The Astras Team',
        description: '一个测试命令',
        callback: () => {
            console.log('Hello World!');
        },
    });
};
