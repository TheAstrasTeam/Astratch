import { useCallback, useEffect, useRef, useState } from 'react';
import { sidebar } from '../../lib/SidebarManager';
import styles from './index.module.scss';
import classNames from 'classnames';
import { MenuHeader, MenuItem } from '@szhsin/react-menu';
import { Menu } from '../menus/renderer';

import MoreIcon from '@as/more.svg?react';
import { t } from 'astratch-i18n';

export const Sidebar = ({ hideSidebar }: { hideSidebar: (value: boolean) => void }) => {
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [Renderer, setRenderer] = useState<ReturnType<
        NonNullable<ReturnType<typeof sidebar.getRenderer>>
    > | null>(null);
    const [updateTimes, setUpdateTimes] = useState(0);

    const check = useCallback(() => {
        void (async () => {
            const selected = sidebar.storage.get(selectedItem ?? '');
            if (!selected) return;
            if (await selected.enable()) return;
            // 如果目前未启用，则切换到可用的
            for (const [_, item] of sidebar.storage) {
                if (await item.enable()) setSelectedItem(item.id);
            }
            // 如果都不可用，设空
            if (!(await selected.enable())) setSelectedItem(null);
        })();
    }, [selectedItem]);

    useEffect(() => {
        const update = () => {
            setUpdateTimes(value => value + 1);
            check();
        };
        sidebar.off('ADD_ITEM', update);
        sidebar.off('DELETE_ITEM', update);
        sidebar.on('ADD_ITEM', update);
        sidebar.on('DELETE_ITEM', update);
        return () => {
            sidebar.off('ADD_ITEM', update);
            sidebar.off('DELETE_ITEM', update);
        };
    }, [check]);
    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebarMenu}>
                <ul key={updateTimes} className={styles.sidebarItems}>
                    {sidebar.listItem().map(item => {
                        const Icon = item.Icon;
                        return (
                            <li key={item.id}>
                                <button
                                    className={classNames(styles.sidebarItem, {
                                        [styles.selected]: item.id === selectedItem,
                                    })}
                                    onMouseEnter={event => {
                                        const target = event.currentTarget;
                                        void (async () => {
                                            if (!(await item.enable()))
                                                target.style.cursor = 'not-allowed';
                                            else target.style.cursor = 'default';
                                        })();
                                    }}
                                    onClick={() => {
                                        void (async () => {
                                            if (!(await item.enable())) return;
                                            setSelectedItem(item.id);
                                            if (item.id)
                                                sidebar.setStorage(item.id, Renderer!.storage());
                                            setRenderer(sidebar.getRenderer(item.id)!);
                                        })();
                                    }}
                                >
                                    <Icon />
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <Menu
                    Button={
                        <button className={styles.sidebarTools}>
                            <MoreIcon />
                        </button>
                    }
                >
                    <MenuHeader>{t('gui:sidebar.panel.name')}</MenuHeader>
                    <MenuItem
                        onClick={() => {
                            hideSidebar(true);
                        }}
                    >
                        {t('gui:sidebar.hide.name')}
                    </MenuItem>
                </Menu>
            </div>
            <span className={styles.title}>{sidebar.storage.get(selectedItem ?? '')?.name}</span>
            <div className={styles.content}>
                {Renderer ? (
                    <Renderer.Node {...sidebar.readStorageFromID(selectedItem!)!} />
                ) : (
                    <div className={styles.empty}>{t('gui:workspace.empty.tip')}</div>
                )}
            </div>
        </div>
    );
};
