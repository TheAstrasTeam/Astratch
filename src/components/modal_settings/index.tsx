import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import { Settings, type ISettingDefinition } from '../../settings/SettingsRegistry';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './index.module.scss';
import KeyInput from '../keyInput';
import type { ShortcutIds } from '../../types/lib';
import { shortcutManager } from '../../lib/ShortcutManager';

const SpawnSetting = ({ settings }: { settings: ISettingDefinition }) => {
    const { t } = useTranslation();
    const [nowValue, setNowValue] = useState(Settings.get(settings.key));

    const handleInputChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNowValue(e.target.value);
        Settings.set(settings.key, e.target.value);
    };
    const handleSelectChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setNowValue(e.target.value);
        Settings.set(settings.key, e.target.value);
    };
    const handleResetKey = () => {
        const id = settings.key as ShortcutIds;
        shortcutManager.resetHotKey(id);
        setNowValue(shortcutManager.getDefaultHotKey(id));
    };

    return (
        <div className={styles.settingContent}>
            <div className={styles.settingText}>
                <span className={styles.settingTextTitle}>{t(settings.label)}</span>
                {settings.description && (
                    <span className={styles.settingTextDesc}>{t(settings.description)}</span>
                )}
            </div>
            <div className={styles.settingNode}>
                {settings.type === 'text' ? (
                    <input
                        className={styles.settingsNodeInput}
                        defaultValue={nowValue as string}
                        onBlur={handleInputChanged}
                    />
                ) : settings.type === 'select' ? (
                    <select
                        className={styles.settingsNodeSelect}
                        defaultValue={nowValue as string}
                        onChange={handleSelectChanged}
                    >
                        {settings.options?.map(option => (
                            <option key={option.value} value={option.value}>
                                {t(option.label)}
                            </option>
                        ))}
                    </select>
                ) : settings.type === 'key' ? (
                    <>
                        {Settings.get(settings.key) !==
                            shortcutManager.getDefaultHotKey(settings.key as ShortcutIds) && (
                            <button onClick={handleResetKey}>Clear</button>
                        )}
                        <KeyInput
                            value={nowValue as string}
                            onChange={v => {
                                setNowValue(v);
                                shortcutManager.setHotKey(settings.key as ShortcutIds, v);
                            }}
                        />
                    </>
                ) : (
                    <></>
                )}
            </div>
        </div>
    );
};

export const SettingsModal = () => {
    const { t } = useTranslation();
    const { closeSelf } = useModalInstance();
    const categories = Settings.getDefinitionsByCategory();

    const [nowTab, setTab] = useState<string>(Object.keys(categories)[0]);

    return (
        <Modal
            fullScreen={false}
            close={closeSelf}
            title={t('gui:settings_title')}
            description={t('gui:settings_description')}
        >
            <div className={styles.content}>
                <div className={styles.tabs}>
                    <span className={styles.tabsTitle}>{t('gui:settings_title')}</span>
                    {Object.entries(categories).map(tab => (
                        <button
                            onClick={() => {
                                setTab(tab[0]);
                            }}
                        >
                            {t(`gui:settings_category.${tab[0]}`)}
                        </button>
                    ))}
                </div>
                <div className={styles.settings}>
                    <span className={styles.settingsTitle}>
                        {t(`gui:settings_category.${nowTab}`)}
                    </span>
                    <div className={styles.settingsContent}>
                        {categories[nowTab].map(settings => (
                            <SpawnSetting key={settings.key} settings={settings}></SpawnSetting>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
