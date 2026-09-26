import { useEffect, useRef, useState } from 'react';

import styles from './index.module.scss';
import { useQuickOpen } from './api';
import { commandManager } from '../../lib/CommandManager';
import { Hr } from '../hr';

export const QuickOpen_coverLayer = () => {
    const { isOpenQuickOpen, closeQuickOpen } = useQuickOpen(state => state);
    const [commands, setCommands] = useState(commandManager.commands);
    const isTouchingMain = useRef(false);

    useEffect(() => {
        const handleUpdate = () => {
            setCommands(commandManager.commands);
        };
        const handleMouseUp = () => {
            if (!isTouchingMain.current) closeQuickOpen();
        };
        commandManager.off('DELETED_COMMAND', handleUpdate);
        commandManager.off('ADDED_COMMAND', handleUpdate);
        commandManager.on('DELETED_COMMAND', handleUpdate);
        commandManager.on('ADDED_COMMAND', handleUpdate);
        window.removeEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            commandManager.off('DELETED_COMMAND', handleUpdate);
            commandManager.off('ADDED_COMMAND', handleUpdate);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    });

    const handleEnteredMain = () => {
        isTouchingMain.current = true;
    };

    const handleLeavedMain = () => {
        isTouchingMain.current = false;
    };

    const runCommand = (id: string) => {
        void commandManager.getCommandCallback(id)?.(undefined);
        closeQuickOpen();
    };

    return (
        isOpenQuickOpen && (
            <div
                className={styles.main}
                onMouseEnter={handleEnteredMain}
                onMouseLeave={handleLeavedMain}
            >
                <input autoFocus />
                <Hr />
                {Array.from(commands).map(([id, meta]) => (
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
            </div>
        )
    );
};
