/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { t } from 'i18next';
import i18next from 'i18next';
import styles from './addons.module.scss';
import type { IAddon } from '../../addons/types';
import { fetchAddonReadme } from '../../addons/loader';
import { renderMarkdown } from '../../utils/markdown';

const AddonDetail = ({ addon, onBack }: { addon: IAddon; onBack: () => void }) => {
    const [readme, setReadme] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setReadme(null);
        const locale = i18next.language || 'en';
        void fetchAddonReadme(addon.id, addon.version, locale).then(md => {
            if (!cancelled) {
                setReadme(md);
                setLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [addon.id, addon.version, i18next.language]);

    return (
        <div className={styles.detail}>
            <div className={styles.detailHeader}>
                <button className={styles.backButton} onClick={onBack}>
                    ← {t('gui:addon.back')}
                </button>
                <div className={styles.detailInfo}>
                    {addon.icon && <img className={styles.detailIcon} src={addon.icon} alt='' />}
                    <div className={styles.detailMeta}>
                        <span className={styles.detailName}>
                            {t(`${addon.i18nNamespace}:@name`, {
                                defaultValue: addon.name,
                            })}
                            <span className={styles.cardBadge}>v{addon.version}</span>
                        </span>
                        {addon.author && (
                            <span className={styles.detailAuthor}>{addon.author}</span>
                        )}
                        {addon.description && (
                            <span className={styles.detailDesc}>
                                {t(`${addon.i18nNamespace}:@description`, {
                                    defaultValue: addon.description,
                                })}
                            </span>
                        )}
                        {addon.readme && addon.readme.length > 0 && (
                            <span className={styles.detailMetaItem}>
                                {t('gui:addon.languages')}: {addon.readme.join(', ')}
                            </span>
                        )}
                        {addon.astratchVersion && (
                            <span className={styles.detailMetaItem}>
                                {t('gui:addon.compatibility')}: {addon.astratchVersion}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className={styles.detailReadme}>
                {loading ? (
                    <div className={styles.detailLoading}>{t('gui:addon.loadingReadme')}</div>
                ) : readme ? (
                    <div
                        className={styles.readmeContent}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(readme) }}
                    />
                ) : (
                    <div className={styles.detailNoReadme}>{t('gui:addon.noReadme')}</div>
                )}
            </div>
        </div>
    );
};

export default AddonDetail;
