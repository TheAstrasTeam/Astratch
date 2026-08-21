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
import { openSettingsModal } from '../../utils/ash-gui';

/** 简易 semver 比较：返回 -1 / 0 / 1 */
const compareSemver = (a: string, b: string): number => {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        const da = pa[i] ?? 0;
        const db = pb[i] ?? 0;
        if (da !== db) return da < db ? -1 : 1;
    }
    return 0;
};

const AddonCard = ({
    name,
    description,
    icon,
    author,
    isCustom,
    downloaded,
    downloading,
    enabled,
    hasSettings,
    version,
    versions,
    minVersion,
    onDownload,
    onToggle,
    onSelectVersion,
    onOpenSettings,
    onRemove,
}: {
    name: string;
    description: string;
    icon: string;
    author: string;
    isCustom: boolean;
    downloaded: boolean;
    downloading: boolean;
    enabled: boolean;
    hasSettings: boolean;
    version: string;
    versions: string[];
    minVersion?: string;
    onDownload: () => void;
    onToggle: () => void;
    onSelectVersion: (version: string) => void;
    onOpenSettings?: () => void;
    onRemove?: () => void;
}) => {
    const actionText = downloading
        ? t('gui:addon.downloading')
        : !downloaded
          ? t('gui:addon.download')
          : enabled
            ? t('gui:addon.disable')
            : t('gui:addon.enable');
    const handleAction = downloading ? undefined : !downloaded ? onDownload : onToggle;
    const showVersionSelect = !isCustom && versions.length > 1;
    return (
        <div className={styles.card}>
            {icon && <img className={styles.cardIcon} src={icon} alt='' />}
            <div className={styles.cardInfo}>
                <span className={styles.cardName}>
                    {name}
                    {isCustom && <span className={styles.cardBadge}>{t('gui:addon.custom')}</span>}
                    {!isCustom && <span className={styles.cardBadge}>{version}</span>}
                </span>
                {description && <span className={styles.cardDesc}>{description}</span>}
                {author && <span className={styles.cardAuthor}>{author}</span>}
                {minVersion && compareSemver(__APP_VERSION__, minVersion) < 0 && (
                    <span className={classNames(styles.cardMinVersion, styles.cardMinVersionWarn)}>
                        {t('gui:addon.minVersion', { version: minVersion })}
                    </span>
                )}
                {showVersionSelect && (
                    <span className={styles.versionRow}>
                        <label className={styles.versionLabel}>{t('gui:addon.version')}</label>
                        <select
                            className={styles.versionSelect}
                            value={version}
                            onChange={event => {
                                onSelectVersion(event.target.value);
                            }}
                        >
                            {versions.map(item => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </span>
                )}
            </div>
            {isCustom && onRemove && (
                <button className={styles.removeButton} onClick={onRemove}>
                    {t('gui:addon.removeCustom')}
                </button>
            )}
            <div className={styles.cardActions}>
                {enabled && hasSettings && onOpenSettings && (
                    <button
                        className={styles.settingsButton}
                        title={t('gui:addon.settings')}
                        onClick={onOpenSettings}
                    >
                        <svg width='12' height='12' viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' />
                        </svg>
                    </button>
                )}
                <button
                    className={classNames(styles.toggle, {
                        [styles.enabled]: enabled,
                    })}
                    disabled={downloading}
                    onClick={handleAction}
                >
                    {actionText}
                </button>
            </div>
        </div>
    );
};

const AddonsPanel = () => {
    const addons = useAddonStore(state => state.addons);
    const enabled = useAddonStore(state => state.enabled);
    const downloading = useAddonStore(state => state.downloading);
    const status = useAddonStore(state => state.status);
    const [importing, setImporting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const canRefresh = status === 'ready' && !refreshing;

    const handleImport = async () => {
        setImporting(true);
        try {
            await addonManager.installCustomAddon();
        } finally {
            setImporting(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await addonManager.refreshRemoteAddons();
        } finally {
            setRefreshing(false);
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
                            downloaded={addon.downloaded}
                            downloading={downloading.has(addon.id)}
                            enabled={enabled.has(addon.id)}
                            hasSettings={addon.settings.length > 0}
                            version={addon.version}
                            versions={addon.versions}
                            minVersion={addon.minVersion}
                            onDownload={() => {
                                void addonManager.download(addon.id);
                            }}
                            onToggle={() => {
                                addonManager.toggle(addon.id);
                            }}
                            onSelectVersion={version => {
                                void addonManager.selectVersion(addon.id, version);
                            }}
                            onOpenSettings={() => {
                                openSettingsModal({
                                    category: 'addons',
                                    focusGroup: `${addon.i18nNamespace}:@name`,
                                });
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
                    disabled={!canRefresh}
                    title={
                        !canRefresh && enabled.size > 0
                            ? t('gui:addon.refreshDisabledHint')
                            : undefined
                    }
                    onClick={() => {
                        void handleRefresh();
                    }}
                >
                    {refreshing ? t('gui:addon.refreshing') : t('gui:addon.refresh')}
                </button>
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
