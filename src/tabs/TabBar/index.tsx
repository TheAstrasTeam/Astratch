import { t } from 'i18next';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useTabsStore } from '../../stores/useTabsStore';
import { TargetModes } from '../../types/vm';
import CloseIcon from '../../assets/close.svg?react';
import SpriteIcon from '../../assets/sprite.svg?react';
import ModuleIcon from '../../assets/module.svg?react';

const TabBar = (): React.ReactNode => {
    const tabs = useTabsStore(state => state.tabs);
    const tabOrder = useTabsStore(state => state.tabOrder);
    const activeTabId = useTabsStore(state => state.activeTabId);
    const setActiveTab = useTabsStore(state => state.setActiveTab);
    const closeTab = useTabsStore(state => state.closeTab);
    const orderedTabs = tabOrder
        .map(id => tabs.find(tab => tab.id === id))
        .filter((tab): tab is NonNullable<typeof tab> => tab !== undefined);

    return (
        <div className={styles.tabBar}>
            {orderedTabs.map(tab => (
                <div
                    key={tab.id}
                    className={classNames(styles.tabItem, {
                        [styles.isActive]: tab.id === activeTabId,
                    })}
                    onClick={() => {
                        setActiveTab(tab.id);
                    }}
                >
                    {tab.mode === TargetModes.ENTITY ? (
                        <SpriteIcon className={styles.tabIcon} />
                    ) : (
                        <ModuleIcon className={styles.tabIcon} />
                    )}
                    <span className={styles.tabTitle} title={tab.title}>
                        {tab.title}
                    </span>
                    <button
                        className={styles.closeButton}
                        title={t('gui:tab.close')}
                        onClick={e => {
                            e.stopPropagation();
                            closeTab(tab.id);
                        }}
                    >
                        <CloseIcon />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default TabBar;
