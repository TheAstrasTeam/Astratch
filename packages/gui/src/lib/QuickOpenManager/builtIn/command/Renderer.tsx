import type { FunctionComponent } from 'react';

import type { QuickOpenRendererProps } from '../..';
import { commandManager } from '../../../CommandManager';

import styles from './index.module.scss';
import classNames from 'classnames';

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
                    className={classNames(styles.command, {
                        [styles.isUnenable]: !meta.isEnable(),
                    })}
                    onClick={() => {
                        if (meta.isEnable()) runCommand(id);
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
