/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { BLOCKLY_CUSTOM_CSS } from './helpers';

export const registerBlocksCSS = () => {
    const css = document.createElement('style');
    css.className = BLOCKLY_CUSTOM_CSS;
    css.textContent = `
    .blockly-function-previewBlock-controlBar {
        position: absolute;
        z-index: 1;
    }
    .blockly-function-previewBlock-controlBar-content {
        display: flex;
        gap: 10px;
        width: 80px;
        height: 20px;
    }
    .blockly-function-previewBlock-controlBar-button {
        width: 20px;
        height: 20px;
        display: block;
        cursor: pointer
    }
    .blockly-function-value-shadow{
        font-style: italic !important;
    }
    .blockly-function-value-shadow-bg {
        fill: #ffffff1a;
    }
    `;

    document.head.appendChild(css);
};
