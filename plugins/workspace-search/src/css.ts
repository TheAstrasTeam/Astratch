/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * 由 AstrasTeam 修改于 2026/8/28:
 * - 修改CSS样式
 */

/**
 * @fileoverview Styling for workspace search.
 * @author aschmiedt@google.com (Abby Schmiedt)
 * @author kozbial@google.com (Monica Kozbial)
 */

/**
 * Base64 encoded data uri for close icon.
 */
const closeSvgDataUri =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC' +
    '9zdmciIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE0Ij48cGF0aC' +
    'BkPSJNMTkgNi40MUwxNy41OSA1IDEyIDEwLjU5IDYuNDEgNSA1IDYuNDEgMTAuNTkgMTIgNS' +
    'AxNy41OSA2LjQxIDE5IDEyIDEzLjQxIDE3LjU5IDE5IDE5IDE3LjU5IDEzLjQxIDEyeiIvPj' +
    'xwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';

/**
 * Base64 encoded data uri for keyboard arrow down icon.
 */
const arrowDownSvgDataUri =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC' +
    '9zdmciIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE0Ij48cGF0aC' +
    'BkPSJNNy40MSA4LjU5TDEyIDEzLjE3bDQuNTktNC41OEwxOCAxMGwtNiA2LTYtNiAxLjQxLT' +
    'EuNDF6Ii8+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PC9zdmc+';

/**
 * Base64 encoded data uri for keyboard arrow up icon.
 */
const arrowUpSvgDataUri =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC' +
    '9zdmciIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE0Ij48cGF0aC' +
    'BkPSJNNy40MSAxNS40MUwxMiAxMC44M2w0LjU5IDQuNThMMTggMTRsLTYtNi02IDZ6Ii8+PH' +
    'BhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==';

/**
 * CSS for workspace search.
 */
const cssContent = `
  @keyframes highlight {
    0% {
        filter: brightness(1);
    }
    25% {
        filter: brightness(1.4);
    }
    50% {
        filter: brightness(0.6);
    }
    100% {
        filter: brightness(1);
    }
  }
  .blockly-ws-search-position {
    padding: 0 10px;
  }
  path.blocklyPath.blockly-ws-search-highlight.blockly-ws-search-current {
    animation: highlight 3s ease forwards infinite;
    stroke-width: 3px
  }
  .blockly-ws-search-close-btn {
    background: url(${closeSvgDataUri}) no-repeat center center;
    background-size: cover;
  }
  .blockly-ws-search-next-btn {
    background: url(${arrowDownSvgDataUri}) no-repeat center center;
    background-size: cover;
  }
  .blockly-ws-search-previous-btn {
    background: url(${arrowUpSvgDataUri}) no-repeat center center;
    background-size: cover;
  }
  .blockly-ws-search {
    background: var(--ui-tertiary);
    border: 1px solid var(--ui-black-transparent);
    justify-content: center;
    padding: 0.25em;
    position: absolute;
    z-index: 70;
  }
  .blockly-ws-search-input input {
    border: none;
    background-color: var(--ui-secondary) !important;
  }
  .blockly-ws-search button {
    filter: var(--svg-filter) !important;
    border: 1px solid transparent;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px
  }
  .blockly-ws-search button:hover {
    border: color-mix(in srgb, var(--ui-tertiary) 30%, transparent 30%) 1px solid !important;
  }
  .blockly-ws-search-actions {
    display: flex;
    align-items: center
  }
  .blockly-ws-search-container {
    display: flex;
    align-items: center
  }
  .blockly-ws-search-content {
    display: flex;
    align-items: center
  }`;

/**
 * Injects CSS for workspace search.
 */
export const injectSearchCss = (function () {
    let executed = false;
    return function () {
        // Only inject the CSS once.
        if (executed) {
            return;
        }
        executed = true;
        // Inject CSS tag at start of head.
        const cssNode = document.createElement('style');
        cssNode.id = 'blockly-ws-search-style';
        const cssTextNode = document.createTextNode(cssContent);
        cssNode.appendChild(cssTextNode);
        document.head.insertBefore(cssNode, document.head.firstChild);
    };
})();
