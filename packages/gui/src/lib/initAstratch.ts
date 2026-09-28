// 初始化部分模块并绑window上
// 为什么要绑？要调试的嘛，所以开发者模式才会绑上去

import { themeManager } from './ThemeManager';

if (import.meta.env.DEV) {
    Object.assign(window, {
        themeManager,
    });
}
