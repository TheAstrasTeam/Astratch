import { useCallback, useEffect, useRef, useState, type FunctionComponent } from 'react';
import type { QuickOpenRendererProps } from '../..';
import { commandManager } from '../../../CommandManager';

import styles from './index.module.scss';
import classNames from 'classnames';
import { keydownHandler } from '../../../../components/quickOpen/api';

export const QuickOpen_BuiltIn_Command: FunctionComponent<QuickOpenRendererProps> = ({ close }) => {
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const runCommand = useCallback(
        (id: string) => {
            void commandManager.getCommandCallback(id)?.(undefined);
            close();
        },
        [close],
    );

    useEffect(() => {
        keydownHandler.registerQuickOpenKeydown(key => {
            if (key === 'ArrowDown') {
                setHighlightedIndex(index => Math.min(index + 1, commandManager.commands.size - 1));
            } else if (key === 'ArrowUp') {
                setHighlightedIndex(index => Math.max(index - 1, 0));
            } else {
                runCommand(Array.from(commandManager.commands)[highlightedIndex][1].id);
            }
        });
        return () => {
            keydownHandler.registerQuickOpenKeydown(null);
        };
    }, [close, highlightedIndex, runCommand]);

    useEffect(() => {
        itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }, [highlightedIndex]);

    return (
        <>
            {Array.from(commandManager.commands).map(([id, meta], index) => (
                <div
                    key={id}
                    ref={el => {
                        itemRefs.current[index] = el;
                    }}
                    className={classNames(styles.command, {
                        [styles.isUnenable]: !meta.isEnable(),
                        [styles.isHovering]: highlightedIndex === index,
                    })}
                    onClick={() => {
                        if (meta.isEnable()) runCommand(id);
                    }}
                    onMouseEnter={() => {
                        setHighlightedIndex(index);
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
