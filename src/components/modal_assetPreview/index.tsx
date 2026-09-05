/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

/** @author AI, KOSHINO */

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import styles from './index.module.scss';
import type { IAsset } from '../../types/vm/assets';
import { getAssetObjectURL } from '../../utils/asset-url';
import { t } from 'i18next';
import { useState } from 'react';
import classNames from 'classnames';

import BackgroundSwitcher from '../../assets/backgroundSwitcher.svg?react';

/** 预览衬底背景，循环切换的顺序 */
const BACKGROUND_MODES = ['dark', 'light', 'checkerboard'] as const;
type TBackgroundMode = (typeof BACKGROUND_MODES)[number];

export const AssetPreviewModal = ({ asset }: { asset: IAsset }) => {
    const { closeSelf } = useModalInstance();
    const [backgroundMode, setBackgroundMode] = useState<TBackgroundMode>('dark');

    const switchBackground = () => {
        setBackgroundMode(mode => {
            const next = BACKGROUND_MODES.indexOf(mode) + 1;
            return BACKGROUND_MODES[next % BACKGROUND_MODES.length];
        });
    };

    return (
        <Modal
            windowID={`assetPreview_${asset.id}`}
            fullScreen={false}
            close={closeSelf}
            title={asset.name}
            minWidth={320}
            minHeight={240}
        >
            <div className={classNames(styles.content, styles[backgroundMode])}>
                {asset.type === 'image' ? (
                    <>
                        <button
                            className={styles.switchBackground}
                            title={t('gui:assetPreview.switchBackground')}
                            onClick={switchBackground}
                        >
                            <BackgroundSwitcher />
                        </button>
                        <img
                            className={styles.image}
                            src={getAssetObjectURL(asset.blob, asset.mimeType)}
                            alt={asset.name}
                        />
                    </>
                ) : asset.type === 'audio' ? (
                    <audio src={getAssetObjectURL(asset.blob, asset.mimeType)} controls autoPlay />
                ) : (
                    <span className={styles.fileTip}>.{asset.extension}</span>
                )}
            </div>
        </Modal>
    );
};
