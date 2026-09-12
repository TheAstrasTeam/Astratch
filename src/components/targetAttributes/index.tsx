/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import type { IVM, ITarget } from '../../types/vm/vm';
import { events } from '../../types/vm/vm';
import { t } from 'i18next';
// import classNames from 'classnames';
import styles from './index.module.scss';

import ArrowIcon from '../../assets/arrow.svg?react';
import DirectionIcon from '../../assets/direction.svg?react';
import SizeIcon from '../../assets/magnifyingGlass.svg?react';
import SpriteIcon from '../../assets/sprite.svg?react';
import ModuleIcon from '../../assets/module.svg?react';
// import BackIcon from '../../assets/back.svg?react';
import { getAssetObjectURL } from '../../utils/asset-url';

const SpawnTargetIcon = ({
    vm,
    targetInfo,
    className,
}: {
    vm: IVM;
    targetInfo: ITarget | undefined;
    className: string;
}) => {
    if (!targetInfo) return;
    const target = vm.runtime.assets.getAsset(targetInfo.currentCostumeID ?? '');
    if (!target)
        return targetInfo.mode === 'entity' ? (
            <SpriteIcon className={className} />
        ) : (
            <ModuleIcon className={className} />
        );
    return <img className={className} src={getAssetObjectURL(target.blob, target.mimeType)} />;
};

const TargetAttributes = ({ vm, targetID }: { vm: IVM; targetID: string }) => {
    const [targetInfo, setTargetInfo] = useState(vm.runtime.getTargetByID(targetID));
    const [, forceUpdate] = useState(0);

    const updateMeta = (callback: (target: ITarget) => void) => {
        const target = vm.runtime.getTargetByID(targetID);
        if (!target) return;
        callback(target);
        setTargetInfo(() => target);
        forceUpdate(v => v + 1);
    };

    const handleXChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateMeta(target => {
            target.setPosition(Number(e.target.value), target.y ?? 0);
        });
    };

    const handleYChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateMeta(target => {
            target.setPosition(target.x ?? 0, Number(e.target.value));
        });
    };

    const handleSizeChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateMeta(target => {
            target.setSize(Number(e.target.value));
        });
    };

    const handleDirectionChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateMeta(target => {
            target.setDirection(Number(e.target.value));
        });
    };

    useEffect(() => {
        const handleUpdate = () => {
            setTargetInfo(() => vm.runtime.getTargetByID(targetID));
            forceUpdate(v => v + 1);
        };
        vm.off(events.UPDATE_PROJECT, handleUpdate);
        vm.off(events.SWITCH_TARGET, handleUpdate);
        vm.off(events.UPDATE_TARGET_STRUCTURE, handleUpdate);
        vm.on(events.UPDATE_PROJECT, handleUpdate);
        vm.on(events.SWITCH_TARGET, handleUpdate);
        vm.on(events.UPDATE_TARGET_STRUCTURE, handleUpdate);
        return () => {
            vm.off(events.UPDATE_PROJECT, handleUpdate);
            vm.off(events.SWITCH_TARGET, handleUpdate);
            vm.off(events.UPDATE_TARGET_STRUCTURE, handleUpdate);
        };
    });
    return (
        <div className={styles.targetAttributes}>
            <div className={styles.left}>
                <SpawnTargetIcon vm={vm} targetInfo={targetInfo} className={styles.targetIcon} />
                <div
                    className={styles.bottom}
                    title={t(
                        targetInfo?.mode === 'entity' ? 'gui:target.entity' : 'gui:target.module',
                    )}
                >
                    {targetInfo?.mode === 'entity' ? (
                        <SpriteIcon className={styles.targetIcon} />
                    ) : (
                        <ModuleIcon className={styles.targetIcon} />
                    )}
                    <span>{targetInfo?.name}</span>
                </div>
            </div>
            {targetInfo?.mode === 'entity' && (
                <div className={styles.right}>
                    <div className={styles.attrBox}>
                        <div className={styles.icon}>
                            <ArrowIcon />
                            <span>{t('gui:target.attr.x')}</span>
                        </div>
                        <input type='number' value={targetInfo.x} onChange={handleXChanged} />
                    </div>
                    <div className={styles.attrBox}>
                        <div className={styles.icon}>
                            <ArrowIcon
                                style={{
                                    transform: 'rotate(90deg)',
                                }}
                            />
                            <span>{t('gui:target.attr.y')}</span>
                        </div>
                        <input type='number' value={targetInfo.y} onChange={handleYChanged} />
                    </div>
                    <div className={styles.attrBox}>
                        <div className={styles.icon}>
                            <SizeIcon />
                            <span>{t('gui:target.attr.size')}</span>
                        </div>
                        <input
                            type='number'
                            value={targetInfo.size}
                            onChange={handleSizeChanged}
                        />
                    </div>
                    <div className={styles.attrBox}>
                        <div className={styles.icon}>
                            <DirectionIcon
                                style={{
                                    transform: `rotate(${String(targetInfo.direction ?? 0)}deg)`,
                                }}
                            />
                            <span>{t('gui:target.attr.direction')}</span>
                        </div>
                        <input
                            type='number'
                            value={targetInfo.direction}
                            onChange={handleDirectionChanged}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export { TargetAttributes };
