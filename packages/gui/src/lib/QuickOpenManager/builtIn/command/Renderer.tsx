import type { FunctionComponent } from 'react';

import type { QuickOpenRendererProps } from '../..';
import { commandManager } from '../../../CommandManager';

import styles from './index.module.scss';

export const QuickOpen_BuiltIn_Command: FunctionComponent<QuickOpenRendererProps> = ({ close }) => {
    const runCommand = (id: string) => {
        void commandManager.getCommandCallback(id)?.(undefined);
        close();
    };

    return (
        <>
            {Array.from(commandManager.commands).map(([id, meta]) => (
                <div
                    key={id}
                    className={styles.command}
                    onClick={() => {
                        runCommand(id);
                    }}
                >
                    <div className={styles.left}>
                        <span>{meta.name}</span>
                        <span className={styles.description}>{meta.description}</span>
                    </div>
                </div>
            ))}
        </>
    );
};
