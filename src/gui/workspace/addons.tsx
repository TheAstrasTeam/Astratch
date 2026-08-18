/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import { useState } from 'react';
import { t } from 'i18next';
import classNames from 'classnames';
import styles from './addons.module.scss';
import { addonManager, useAddonStore } from '../../addons';

const AddonCard = ({
    name,
    description,
    icon,
    author,
    isCustom,
    enabled,
    onToggle,
    onRemove,
}: {
    name: string;
    description: string;
    icon: string;
    author: string;
    isCustom: boolean;
    enabled: boolean;
    onToggle: () => void;
    onRemove?: () => void;
}) => {
    return (
        <div className={styles.card}>
            {icon && <img className={styles.cardIcon} src={icon} alt='' />}
            <div className={styles.cardInfo}>
                <span className={styles.cardName}>
                    {name}
                    {isCustom && <span className={styles.cardBadge}>{t('gui:addon.custom')}</span>}
                </span>
                {description && <span className={styles.cardDesc}>{description}</span>}
                {author && <span className={styles.cardAuthor}>{author}</span>}
            </div>
            {isCustom && onRemove && (
                <button className={styles.removeButton} onClick={onRemove}>
                    {t('gui:addon.removeCustom')}
                </button>
            )}
            <button
                className={classNames(styles.toggle, {
                    [styles.enabled]: enabled,
                })}
                onClick={onToggle}
            >
                {enabled ? t('gui:addon.disable') : t('gui:addon.enable')}
            </button>
        </div>
    );
};

const AddonsPanel = () => {
    const addons = useAddonStore(state => state.addons);
    const enabled = useAddonStore(state => state.enabled);
    const status = useAddonStore(state => state.status);
    const [importing, setImporting] = useState(false);

    const handleImport = async () => {
        setImporting(true);
        try {
            await addonManager.installCustomAddon();
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className={styles.panel}>
            {status !== 'ready' ? (
                <div className={styles.empty}>{t('gui:addon.loading')}</div>
            ) : addons.length === 0 ? (
                <div className={styles.empty}>{t('gui:addon.noAddons')}</div>
            ) : (
                <div className={styles.main}>
                    {addons.map(addon => (
                        <AddonCard
                            key={addon.id}
                            name={t(`${addon.i18nNamespace}:@name`, {
                                defaultValue: addon.name,
                            })}
                            description={t(`${addon.i18nNamespace}:@description`, {
                                defaultValue: addon.description,
                            })}
                            icon={addon.icon}
                            author={addon.author}
                            isCustom={addon.isCustom}
                            enabled={enabled.has(addon.id)}
                            onToggle={() => {
                                addonManager.toggle(addon.id);
                            }}
                            onRemove={
                                addon.isCustom
                                    ? () => {
                                          void addonManager.uninstallCustomAddon(addon.id);
                                      }
                                    : undefined
                            }
                        />
                    ))}
                </div>
            )}
            <div className={styles.footer}>
                <button
                    className={styles.importButton}
                    disabled={importing}
                    onClick={() => {
                        void handleImport();
                    }}
                >
                    {importing ? t('gui:addon.importing') : t('gui:addon.importCustom')}
                </button>
            </div>
        </div>
    );
};

export default AddonsPanel;
