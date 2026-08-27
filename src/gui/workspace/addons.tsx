/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import { useState } from 'react';
import { t } from 'i18next';
import * as semver from 'semver';
import classNames from 'classnames';
import styles from './addons.module.scss';
import { addonManager, useAddonStore } from '../../addons';
import { openSettingsModal } from '../../utils/ash-gui';
import AddonDetail from './addonDetail';
import type { IVM } from '../../types/vm';

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
    astratchVersion,
    onDownload,
    onToggle,
    onSelectVersion,
    onOpenSettings,
    onRemove,
    onSelectAddon,
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
    astratchVersion?: string;
    onDownload: () => void;
    onToggle: () => void;
    onSelectVersion: (version: string) => void;
    onOpenSettings?: () => void;
    onRemove?: () => void;
    onSelectAddon?: () => void;
}) => {
    const actionText = downloading
        ? t('gui:addon.downloading')
        : !downloaded
          ? t('gui:addon.download')
          : enabled
            ? t('gui:addon.disable')
            : t('gui:addon.enable');
    const handleAction = downloading ? undefined : !downloaded ? onDownload : onToggle;
    const showVersionSelect = !isCustom && !enabled && versions.length > 1;
    const latestVersion = versions[versions.length - 1];
    const hasUpdate = !isCustom && version !== latestVersion;
    return (
        <div
            className={classNames(styles.card, {
                [styles.disabled]: !enabled && downloaded,
            })}
            onClick={onSelectAddon}
            role='button'
            tabIndex={0}
        >
            {icon && <img className={styles.cardIcon} src={icon} alt='' />}
            <div className={styles.cardInfo}>
                <span className={styles.cardName}>
                    <span className={styles.cardNameTitle}>{name}</span>
                    {isCustom && <span className={styles.cardBadge}>{t('gui:addon.custom')}</span>}
                    {!isCustom && !showVersionSelect && (
                        <span className={styles.cardBadge}>v{version}</span>
                    )}
                    {!isCustom && showVersionSelect && (
                        <select
                            className={styles.cardBadgeSelect}
                            value={version}
                            onClick={e => {
                                e.stopPropagation();
                            }}
                            onChange={event => {
                                onSelectVersion(event.target.value);
                            }}
                        >
                            {versions.map(item => (
                                <option key={item} value={item}>
                                    v{item}
                                </option>
                            ))}
                        </select>
                    )}
                    {hasUpdate && (
                        <span className={classNames(styles.cardBadge, styles.cardBadgeUpdate)}>
                            {t('gui:addon.oldVersion')}
                        </span>
                    )}
                </span>
                {description && <span className={styles.cardDesc}>{description}</span>}
                {author && <span className={styles.cardAuthor}>{author}</span>}
                {astratchVersion && !semver.satisfies(__APP_VERSION__, astratchVersion) && (
                    <span className={classNames(styles.cardMinVersion, styles.cardMinVersionWarn)}>
                        {t('gui:addon.astratchVersion', { range: astratchVersion })}
                    </span>
                )}
            </div>
            {isCustom && onRemove && (
                <button
                    className={styles.removeButton}
                    onClick={e => {
                        e.stopPropagation();
                        onRemove();
                    }}
                >
                    {t('gui:addon.removeCustom')}
                </button>
            )}
            <div
                className={styles.cardActions}
                onClick={e => {
                    e.stopPropagation();
                }}
            >
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

const AddonsPanel = ({ vm }: { vm: IVM }) => {
    const addons = useAddonStore(state => state.addons);
    const enabled = useAddonStore(state => state.enabled);
    const downloading = useAddonStore(state => state.downloading);
    const status = useAddonStore(state => state.status);
    const storeRefreshing: boolean = useAddonStore(state => state.refreshing);
    const [importing, setImporting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAddon, setSelectedAddon] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const canRefresh = status === 'ready' && !refreshing && !storeRefreshing && enabled.size === 0;

    const selected = selectedAddon ? (addons.find(a => a.id === selectedAddon) ?? null) : null;

    const filteredAddons = addons.filter(addon => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const name = t(`${addon.i18nNamespace}:@name`, {
            defaultValue: addon.name,
        }).toLowerCase();
        const description = t(`${addon.i18nNamespace}:@description`, {
            defaultValue: addon.description,
        }).toLowerCase();
        const id = addon.id.toLowerCase();
        return name.includes(query) || description.includes(query) || id.includes(query);
    });

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
            {selected ? (
                <AddonDetail
                    addon={selected}
                    onBack={() => {
                        setSelectedAddon(null);
                    }}
                    vm={vm}
                />
            ) : status !== 'ready' ? (
                <div className={styles.empty}>{t('gui:addon.loading')}</div>
            ) : storeRefreshing ? (
                <div className={styles.empty}>{t('gui:addon.refreshing')}</div>
            ) : addons.length === 0 ? (
                <div className={styles.empty}>{t('gui:addon.noAddons')}</div>
            ) : (
                <div className={styles.main}>
                    <input
                        className={styles.searchInput}
                        type='text'
                        placeholder={t('gui:addon.search')}
                        value={searchQuery}
                        onChange={e => {
                            setSearchQuery(e.target.value);
                        }}
                    />
                    <div className={styles.mainScroll}>
                        {filteredAddons.length === 0 ? (
                            <div className={styles.empty}>{t('gui:addon.noResults')}</div>
                        ) : (
                            filteredAddons.map(addon => (
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
                                    astratchVersion={addon.astratchVersion}
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
                                    onSelectAddon={() => {
                                        setSelectedAddon(addon.id);
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
            {!selected && (
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
            )}
        </div>
    );
};

export default AddonsPanel;
