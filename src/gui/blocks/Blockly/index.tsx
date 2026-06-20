import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly/core';
import toolbox from './toolbox';
import 'blockly/blocks';

// Todo: 移动到i18n，这里是在做测试
import * as en from 'blockly/msg/en';
import('blockly/msg/en').then(m => console.log(m));

Blockly.setLocale(en.default);

const BlocklyWorkspace = () => {
    const workspaceDiv = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if(!workspaceDiv.current) return

        const workspace = Blockly.inject(workspaceDiv.current, {
            toolbox: toolbox,
        });
    }, [])


    return (
        <div ref={workspaceDiv} style={{ width: '100%', height: '100%' }} />
    )
}

export default BlocklyWorkspace