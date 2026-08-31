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
import Markdown from 'react-markdown';

import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

import { events, type IUpdateThemeEvent, type IVM } from '../../types/vm/vm';
import { useSettings } from '../../settings/SettingsRegistry';
import type { TGuiTheme } from '../../types/gui';

const AddonDetail = ({ addon, onBack, vm }: { addon: IAddon; onBack: () => void; vm: IVM }) => {
    const [readme, setReadme] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const themeMode = useSettings(state => state.guiThemeMode);

    useEffect(() => {
        const handleThemeChanged = (theme: IUpdateThemeEvent | null = null) => {
            const correctTheme: TGuiTheme = theme?.guiThemeMode ?? (themeMode as TGuiTheme);
            void (async function () {
                document.querySelectorAll('.ash-addons-readme-markdown').forEach(ele => {
                    ele.remove();
                });
                const style = document.createElement('style');
                style.className = 'ash-addons-readme-markdown';

                if (correctTheme === 'dark')
                    style.textContent = (
                        await import('highlight.js/styles/github-dark.css?inline')
                    ).default;
                else
                    style.textContent = (
                        await import('highlight.js/styles/github.css?inline')
                    ).default;

                document.head.appendChild(style);
            })();
        };
        handleThemeChanged();
        // @ts-expect-error 它会传递正确的数据
        vm.on(events.UPDATE_THEME, handleThemeChanged);

        let cancelled = false;
        const locale = i18next.language || 'en';
        void fetchAddonReadme(addon.id, addon.version, locale).then(md => {
            if (!cancelled) {
                setReadme(md);
                setLoading(false);
            }
        });
        return () => {
            cancelled = true;
            // @ts-expect-error 这里不会运行所以不需要
            vm.off(events.UPDATE_THEME, handleThemeChanged);
        };
    }, [addon.id, addon.version, themeMode, vm]);

    return (
        <div className={styles.detail}>
            <div className={styles.detailHeader}>
                <button className={styles.backButton} onClick={onBack}>
                    ← {t('gui:addon.back')}
                </button>
                <div className={styles.detailInfo}>
                    {addon.icon && <img className={styles.detailIcon} src={addon.icon} alt='' />}
                    <div className={styles.detailNameAuthor}>
                        <span className={styles.detailName}>
                            {t(`${addon.i18nNamespace}:@name`, {
                                defaultValue: addon.name,
                            })}
                            <span className={styles.cardBadge}>v{addon.version}</span>
                        </span>
                        {addon.author && (
                            <span className={styles.detailAuthor}>{addon.author}</span>
                        )}
                    </div>
                </div>
                {addon.description && (
                    <span className={styles.detailDesc}>
                        {t(`${addon.i18nNamespace}:@description`, {
                            defaultValue: addon.description,
                        })}
                    </span>
                )}
                <div className={styles.detailMetaTags}>
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
            <div className={styles.detailReadme}>
                {loading ? (
                    <div className={styles.detailLoading}>{t('gui:addon.loadingReadme')}</div>
                ) : readme ? (
                    <div className={styles.readmeContent}>
                        <Markdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                        >
                            {readme}
                        </Markdown>
                    </div>
                ) : (
                    <div className={styles.detailNoReadme}>{t('gui:addon.noReadme')}</div>
                )}
            </div>
        </div>
    );
};

export default AddonDetail;
