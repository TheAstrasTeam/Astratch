import { useEffect, useState } from 'react';
import { sidebar } from '../../lib/SidebarManager';
import styles from './index.module.scss';
import classNames from 'classnames';

export const Sidebar = ({ width }: { width: string }) => {
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [Renderer, setRenderer] = useState<ReturnType<
        NonNullable<ReturnType<typeof sidebar.getRenderer>>
    > | null>(null);
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
    }, []);
    return (
        <div className={styles.sidebar} style={{ width }}>
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
            <span className={styles.title}>{sidebar.storage.get(selectedItem ?? '')?.name}</span>
            <div className={styles.content}>
                {Renderer ? <Renderer.Node {...sidebar.readStorageFromID(selectedItem!)!} /> : null}
            </div>
            <div>Stage</div>
        </div>
    );
};
