/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type ComponentType, type SVGProps } from 'react';
import type { IVM, ITarget } from '../../types/vm';
import { events } from '../../types/vm';
import { t } from 'i18next';
import classNames from 'classnames';
import styles from './index.module.scss';

import ArrowIcon from '../../assets/arrow.svg?react';
import DirectionIcon from '../../assets/direction.svg?react';
import SizeIcon from '../../assets/magnifyingGlass.svg?react';

type TAttributeKey = 'x' | 'y' | 'direction' | 'size';

interface IAttributeConfig {
    key: TAttributeKey;
    label: string;
    step: number;
    min?: number;
    /** Y 轴箭头需要旋转 90° */
    rotatedIcon?: boolean;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const ATTRIBUTES: IAttributeConfig[] = [
    { key: 'x', label: 'gui:target.attr.x', step: 10, Icon: ArrowIcon },
    { key: 'y', label: 'gui:target.attr.y', step: 10, rotatedIcon: true, Icon: ArrowIcon },
    { key: 'direction', label: 'gui:target.attr.direction', step: 15, Icon: DirectionIcon },
    { key: 'size', label: 'gui:target.attr.size', step: 10, min: 0, Icon: SizeIcon },
];

const AttributeRow = ({
    vm,
    targetID,
    config,
}: {
    vm: IVM;
    targetID: string;
    config: IAttributeConfig;
}) => {
    const readValue = () => vm.runtime.getTargetByID(targetID)?.[config.key] ?? 0;

    const [draft, setDraft] = useState(() => String(readValue()));

    const commit = (raw: string) => {
        const target = vm.runtime.getTargetByID(targetID);
        if (!target) return;
        const value = Number(raw);
        if (Number.isNaN(value)) {
            setDraft(String(readValue()));
            return;
        }
        const clamped = config.min !== undefined ? Math.max(config.min, value) : value;
        target[config.key] = clamped;
        setDraft(String(clamped));
        vm.emit(events.UPDATE_PROJECT);
    };

    const Icon = config.Icon;

    return (
        <div className={styles.attributeRow}>
            <div className={styles.icons}>
                <Icon
                    className={classNames(styles.attributeIcon, {
                        [styles.rotated]: config.rotatedIcon,
                    })}
                    style={
                        config.key === 'direction'
                            ? {
                                  transform: `rotate(${draft}deg)`,
                              }
                            : {}
                    }
                />
                <span>{t(config.label)}</span>
            </div>
            <input
                className={styles.attributeInput}
                type='number'
                title={config.label}
                aria-label={config.label}
                value={draft}
                onChange={e => {
                    setDraft(e.target.value);
                }}
                onBlur={e => {
                    commit(e.target.value);
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
                }}
            />
        </div>
    );
};

export const TargetAttributes = ({ vm, target }: { vm: IVM; target: ITarget }) => {
    if (target.mode !== 'entity') return null;
    return (
        <div className={styles.attributes}>
            {ATTRIBUTES.map(attr => (
                <AttributeRow
                    key={`${target.id}-${attr.key}`}
                    vm={vm}
                    targetID={target.id}
                    config={attr}
                />
            ))}
        </div>
    );
};

export default TargetAttributes;
