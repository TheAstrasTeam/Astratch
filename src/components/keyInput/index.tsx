// 此文件由 Ai 润色

import { Fragment, useState, useRef, type KeyboardEvent } from 'react';
import classNames from 'classnames';
import { t } from 'i18next';
import { getPlatfrom, ALL_PLATFORMS } from '../../utils/ash-navigator';
import styles from './index.module.scss';

const MOD_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

function keyToMousetrap(key: string): string {
    if (key === ' ') return 'space';
    return key.toLowerCase();
}

function mainKeyFromEvent(e: KeyboardEvent): string {
    const { code, key } = e;
    if (code.startsWith('Key')) return code.slice(3).toLowerCase();
    if (code.startsWith('Digit')) return code.slice(5);
    return keyToMousetrap(key);
}

function comboFromEvent(e: KeyboardEvent): string | null {
    if (MOD_KEYS.has(e.key)) return null;

    const parts: string[] = [];
    const isMac = getPlatfrom() === ALL_PLATFORMS.MAC;
    if (isMac) {
        if (e.metaKey) parts.push('mod');
        if (e.ctrlKey) parts.push('ctrl');
    } else {
        if (e.ctrlKey) parts.push('mod');
        if (e.metaKey) parts.push('meta');
    }
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    parts.push(mainKeyFromEvent(e));
    return parts.join('+');
}

function toDisplayParts(combo: string): string[] {
    if (!combo) return [];
    const isMac = getPlatfrom() === ALL_PLATFORMS.MAC;
    return combo.split('+').map(part => {
        if (part === 'mod') return isMac ? '⌘' : 'Ctrl';
        if (part === 'ctrl') return isMac ? '⌃' : 'Ctrl';
        if (part === 'meta') return isMac ? '⌘' : 'Meta';
        if (part === 'alt') return isMac ? '⌥' : 'Alt';
        if (part === 'shift') return isMac ? '⇧' : 'Shift';
        if (part.length === 1) return part.toUpperCase();
        return part;
    });
}

export interface KeyInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const KeyInput = ({ value, onChange, placeholder }: KeyInputProps) => {
    const [recording, setRecording] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const recordingText = placeholder ?? t('gui:keyInput.recording');
    const idleText = t('gui:keyInput.placeholder');
    const ariaLabel = t('gui:keyInput.ariaLabel');

    const handleKeyDown = (e: KeyboardEvent) => {
        if (recording) {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === 'Escape') {
                setRecording(false);
                ref.current?.blur();
                return;
            }
            const combo = comboFromEvent(e);
            if (combo) {
                onChange(combo);
                setRecording(false);
                ref.current?.blur();
            }
            return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setRecording(true);
        }
    };

    return (
        <div
            ref={ref}
            className={classNames(styles.keyInput, { [styles.recording]: recording })}
            tabIndex={0}
            role='textbox'
            aria-label={ariaLabel}
            onClick={() => {
                setRecording(true);
            }}
            onBlur={() => {
                setRecording(false);
            }}
            onKeyDown={handleKeyDown}
        >
            {recording ? (
                <span className={styles.hint}>{recordingText}</span>
            ) : value ? (
                <span className={styles.badges}>
                    {(() => {
                        const parts = toDisplayParts(value);
                        return parts.map((part, i) => (
                            <Fragment key={i}>
                                <kbd className={styles.kbd}>{part}</kbd>
                                {i !== parts.length - 1 && <span>+</span>}
                            </Fragment>
                        ));
                    })()}
                </span>
            ) : (
                <span className={styles.hint}>{idleText}</span>
            )}
        </div>
    );
};

export default KeyInput;
