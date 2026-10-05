import styles from './index.module.scss';
import { bottomBarManager, type BottomBarItem } from '../../../lib/BottomBarManager';
import React from 'react';

const BottomBarItem = ({ item }: { item: [string, BottomBarItem] }) => {
    const Renderer = item[1].Renderer;
    return (
        <Renderer
            dispose={() => {
                bottomBarManager.deleteItem(item[0]);
            }}
        />
    );
};

export const BottomBar = () => {
    return (
        <div className={styles.main}>
            <div className={styles.left}>
                {bottomBarManager.listItem().map(item => (
                    <React.Fragment key={item[0]}>
                        {item[1].pos === 'left' && <BottomBarItem key={item[0]} item={item} />}
                    </React.Fragment>
                ))}
            </div>
            <div className={styles.right}>
                {bottomBarManager.listItem().map(item => (
                    <React.Fragment key={item[0]}>
                        {item[1].pos === 'right' && <BottomBarItem key={item[0]} item={item} />}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
