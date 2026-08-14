/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

declare module 'blockly' {
    interface Block {
        svgGroup: SVGGElement;
    }
    interface Workspace {
        getAbsoluteScale: () => number | null;
    }
}
