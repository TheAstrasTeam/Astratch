import { useEffect, useState } from 'react';
import { sidebar } from '../../lib/SidebarManager';
import styles from './index.module.scss';
import classNames from 'classnames';

export const Sidebar = () => {
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [updateTimes, setUpdateTimes] = useState(0);
    useEffect(() => {
        const update = () => {
            setUpdateTimes(value => value + 1);
        };
        sidebar.off('ADDED_ITEM', update);
        sidebar.off('DELETED_ITEM', update);
        sidebar.on('ADDED_ITEM', update);
        sidebar.on('DELETED_ITEM', update);
        return () => {
            sidebar.off('ADDED_ITEM', update);
            sidebar.off('DELETED_ITEM', update);
        };
    });
    return (
        <div className={styles.sidebar}>
            <ul key={updateTimes} className={styles.sidebarItems}>
                {sidebar.listItem().map(item => {
                    const Icon = item.Icon;
                    return (
                        <li
                            onPointerDown={() => {
                                setSelectedItem(item.id);
                            }}
                            key={item.id}
                            className={classNames(styles.sidebarItem, {
                                [styles.selected]: item.id === selectedItem,
                            })}
                        >
                            <Icon />
                        </li>
                    );
                })}
            </ul>
            <span className={styles.title}>{sidebar.storage.get(selectedItem ?? '')?.name}</span>
            <div style={{ flex: '1' }}>{sidebar.getRenderer(selectedItem ?? '')}</div>
            <div>Stage</div>
        </div>
    );
};
