import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly/core';
import toolbox from './toolbox';
import 'blockly/blocks';

// Todo: 移动到i18n，这里是在做测试
import * as en from 'blockly/msg/en';

// 这是什么？
// import('blockly/msg/en').then(m => console.log(m));

Blockly.setLocale(en);

const BlocklyWorkspace = () => {
    const workspaceDiv = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!workspaceDiv.current) return

        const workspace = Blockly.inject(workspaceDiv.current, {
            toolbox: toolbox, // 我很不道德地把我写的 Demo 里的工具箱拿来了
            // 给扣式咯把初始化搞好一点
            scrollbars: true,
            zoom: {
                controls: true,
                wheel: true,
                startScale: 0.9,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2,
                // 调整缩放的设置
            },
            trashcan: true, // 我认为回收站很重要喵
            move: {
                scrollbars: true,
                drag: true,
                wheel: true,
            },
            renderer: 'Zelos', 
            /* 
             * Zelos 渲染器，其实就是 Scratch 那种，
             * 但是有部分不是很像，比如头代码的圆弧，
             * 那个得改渲染器了，麻烦死了，等扣式咯自己改
             */
        });

        return () => {
            workspace.dispose(); // 正确渲染 Blockly 需要销毁原来的对象，不然会出现多个工作区容器
            // 扣式咯，他是头猪
        };
    }, [])

    /*
     * todo:
     * 我们需要解决工作区的某些BUG，并且接入 Continuous-Toolbox 插件
     * 我知道扣式咯看见这个注释的时候已经考完第二天的科目了
     * 所以这个东西留给扣式咯做
     */

    return (
        <div ref={workspaceDiv} style={{ width: '100%', height: '100%' }} />
    )
}

export default BlocklyWorkspace