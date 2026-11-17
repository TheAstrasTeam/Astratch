import { useEffect, useState } from 'react';
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
    useEffect(() => {
        const update = () => {
            setUpdateTimes(value => value + 1);
        };
        sidebar.off('ADD_ITEM', update);
        sidebar.off('DELETE_ITEM', update);
        sidebar.on('ADD_ITEM', update);
        sidebar.on('DELETE_ITEM', update);
        return () => {
            sidebar.off('ADD_ITEM', update);
            sidebar.off('DELETE_ITEM', update);
        };
    }, []);
    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebarMenu}>
                <ul key={updateTimes} className={styles.sidebarItems}>
                    {sidebar.listItem().map(item => {
                        const Icon = item.Icon;
                        return (
                            <li
                                onPointerDown={() => {
                                    setSelectedItem(item.id);
                                    if (selectedItem)
                                        sidebar.setStorage(selectedItem, Renderer!.storage());
                                    setRenderer(sidebar.getRenderer(item.id)!);
                                }}
                                key={item.id}
                            >
                                <button
                                    className={classNames(styles.sidebarItem, {
                                        [styles.selected]: item.id === selectedItem,
                                    })}
                                    onClick={() => {
                                        setSelectedItem(item.id);
                                        if (selectedItem)
                                            sidebar.setStorage(selectedItem, Renderer!.storage());
                                        setRenderer(sidebar.getRenderer(item.id)!);
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
                    <MenuHeader>{t('gui:sidebar')}</MenuHeader>
                    <MenuItem
                        onClick={() => {
                            hideSidebar(true);
                        }}
                    >
                        {t('gui:sidebar.hide')}
                    </MenuItem>
                </Menu>
            </div>
            <span className={styles.title}>{sidebar.storage.get(selectedItem ?? '')?.name}</span>
            <div className={styles.content}>
                {Renderer ? <Renderer.Node {...sidebar.readStorageFromID(selectedItem!)!} /> : null}
            </div>
            <div>Stage</div>
        </div>
    );
};
