/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

// 此文件由AI生成

import { t } from 'i18next';
import classNames from 'classnames';
import styles from './addons.module.scss';
import { addonManager, useAddonStore } from '../../addons';

const AddonCard = ({
    name,
    description,
    icon,
    author,
    enabled,
    onToggle,
}: {
    name: string;
    description: string;
    icon: string;
    author: string;
    enabled: boolean;
    onToggle: () => void;
}) => {
    return (
        <div className={styles.card}>
            {icon && <img className={styles.cardIcon} src={icon} alt='' />}
            <div className={styles.cardInfo}>
                <span className={styles.cardName}>{name}</span>
                {description && <span className={styles.cardDesc}>{description}</span>}
                {author && <span className={styles.cardAuthor}>{author}</span>}
            </div>
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

    if (addons.length === 0) return <div className={styles.empty}>{t('gui:addon.noAddons')}</div>;

    return (
        <div className={styles.main}>
            {addons.map(addon => (
                <AddonCard
                    key={addon.id}
                    name={addon.name}
                    description={addon.description}
                    icon={addon.icon}
                    author={addon.author}
                    enabled={enabled.has(addon.id)}
                    onToggle={() => {
                        addonManager.toggle(addon.id);
                    }}
                />
            ))}
        </div>
    );
};

export default AddonsPanel;
