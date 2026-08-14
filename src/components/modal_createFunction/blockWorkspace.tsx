/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由 AI 生成
import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { type IVM } from '../../types/vm';
import { setupBlockly } from '../../lib/BlocklyAdapter';
import styles from './index.module.scss';
import { disposePreviewWorkspace, setupWorkspace } from './functionPreview';

const CreateFunctionWorkspace = ({ vm }: { vm: IVM }) => {
    const workspaceDiv = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const DOM = workspaceDiv.current;
        if (!DOM) return;

        let disposed = false;

        void setupBlockly(Blockly, vm).then(() => {
            if (disposed) return;

            setupWorkspace(
                Blockly.inject(DOM, {
                    ...vm.runtime.blocks.workspaceConfig,
                    toolbox: undefined,
                    trashcan: false,
                    zoom: {
                        controls: false,
                        wheel: false,
                        startScale: 1,
                        maxScale: 3,
                        minScale: 0.3,
                        scaleSpeed: 1.2,
                        pinch: false,
                    },
                }),
            );
        });

        return () => {
            disposed = true;
            disposePreviewWorkspace();
        };
    }, [vm]);

    return (
        <div className={styles.createPreview}>
            <div ref={workspaceDiv} className={styles.workspace} />
        </div>
    );
};

export { CreateFunctionWorkspace };
