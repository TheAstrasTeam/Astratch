/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { Settings, type ISettingDefinition } from '../../settings/SettingsRegistry';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './index.module.scss';
import KeyInput from '../keyInput';
import type { ShortcutIds } from '../../types/lib';
import { shortcutManager } from '../../lib/ShortcutManager';
import { t } from 'i18next';
import classNames from 'classnames';
import { onSettingsFocus } from '../../utils/ash-gui';

const SpawnSetting = ({ settings }: { settings: ISettingDefinition }) => {
    const { t } = useTranslation();
    const [nowValue, setNowValue] = useState(Settings.get(settings.key));

    const handleInputChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNowValue(e.target.value);
        Settings.set(settings.key, e.target.value);
    };
    const handleTextareaChanged = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
                    settings.allowLines ? (
                        <textarea
                            className={styles.settingsNodeTextarea}
                            defaultValue={nowValue as string}
                            onBlur={handleTextareaChanged}
                        />
                    ) : (
                        <input
                            className={styles.settingsNodeInput}
                            defaultValue={nowValue as string}
                            onBlur={handleInputChanged}
                        />
                    )
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
                ) : settings.type === 'number' ? (
                    <input
                        className={styles.settingsNodeInput}
                        type='number'
                        defaultValue={nowValue as number}
                        min={settings.min}
                        max={settings.max}
                        onBlur={e => {
                            let value = Number(e.target.value);
                            if (settings.min !== undefined && value < settings.min)
                                value = settings.min;
                            if (settings.max !== undefined && value > settings.max)
                                value = settings.max;
                            e.target.value = String(value);
                            setNowValue(value);
                            Settings.set(settings.key, value);
                        }}
                    />
                ) : settings.type === 'boolean' ? (
                    <input
                        className={styles.settingsNodeCheckbox}
                        type='checkbox'
                        checked={nowValue as boolean}
                        onChange={e => {
                            setNowValue(e.target.checked);
                            Settings.set(settings.key, e.target.checked);
                        }}
                    />
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

export const SettingsModal = ({
    category: initialCategory,
    focusGroup: initialFocusGroup,
}: {
    /** 打开时默认选中的分类（如 'addons'） */
    category?: string;
    /** 打开后需要滚动定位到的小节 group（如 'addon_example:@name'） */
    focusGroup?: string;
}) => {
    const { closeSelf } = useModalInstance();
    const categories = Settings.getDefinitionsByCategory();

    const [nowTab, setTab] = useState<string>(initialCategory ?? Object.keys(categories)[0]);
    const [focusGroup, setFocusGroup] = useState<string | undefined>(initialFocusGroup);

    const [isFullScreen, setFullScreen] = useState<boolean>(false);

    /** 打开后滚动定位到指定插件的设置小节 */
    useEffect(() => {
        if (!focusGroup || nowTab !== 'addons') return;
        const el = document.querySelector(`[data-group="${focusGroup}"]`);
        el?.scrollIntoView({ block: 'start' });
    }, [nowTab, focusGroup]);

    /** 设置窗口已打开时，接收来自外部（如插件页设置按钮）的跳转请求 */
    useEffect(() => {
        return onSettingsFocus(({ category, focusGroup }) => {
            if (category) setTab(category);
            if (focusGroup) setFocusGroup(focusGroup);
        });
    }, []);

    /** 按 group 给设置分小节（插件设置按插件名分组），group 变化时插入小标题 */
    const renderSettings = (defs: ISettingDefinition[]) => {
        const nodes: React.ReactNode[] = [];
        let lastGroup: string | undefined;
        for (const def of defs) {
            if (def.group !== lastGroup) {
                nodes.push(
                    <div
                        key={`group-${def.key}`}
                        className={styles.groupTitle}
                        data-group={def.group}
                    >
                        {def.group ? t(def.group, { defaultValue: def.group }) : ''}
                    </div>,
                );
                lastGroup = def.group;
            }
            nodes.push(<SpawnSetting key={def.key} settings={def} />);
        }
        return nodes;
    };

    return (
        <Modal
            windowID='settings'
            fullScreen={false}
            onFullScreen={setFullScreen}
            close={closeSelf}
            title={t('gui:settings.title')}
            description={t('gui:settings.description')}
            minWidth='30vw'
            minHeight={200}
        >
            <div
                className={classNames(styles.content, {
                    [styles.fullScreen]: isFullScreen,
                })}
            >
                <div className={styles.tabs}>
                    <span className={styles.tabsTitle}>{t('gui:settings.title')}</span>
                    {Object.entries(categories).map(tab => (
                        <button
                            onClick={() => {
                                setTab(tab[0]);
                            }}
                            key={tab[0]}
                        >
                            {t(`gui:settings.category.${tab[0]}`)}
                        </button>
                    ))}
                </div>
                <div className={styles.settings}>
                    <span className={styles.settingsTitle}>
                        {t(`gui:settings.category.${nowTab}`)}
                    </span>
                    <div className={styles.settingsContent}>
                        {renderSettings(categories[nowTab])}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
