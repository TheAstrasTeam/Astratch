import styles from './index.module.scss';
import { bottomBarManager, type BottomBarItem } from '../../../lib/BottomBarManager';
import React from 'react';
import { t } from 'astratch-i18n';

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
            <ul className={styles.left}>
                {bottomBarManager.listItem().map(item => (
                    <React.Fragment key={item[0]}>
                        {item[1].pos === 'left' && (
                            <li
                                aria-label={
                                    item[1].translate
                                        ? t(item[1].descriptionID)
                                        : item[1].description
                                }
                            >
                                <BottomBarItem key={item[0]} item={item} />
                            </li>
                        )}
                    </React.Fragment>
                ))}
            </ul>
            <ul className={styles.right}>
                {bottomBarManager.listItem().map(item => (
                    <React.Fragment key={item[0]}>
                        {item[1].pos === 'right' && (
                            <li
                                aria-label={
                                    item[1].translate
                                        ? t(item[1].descriptionID)
                                        : item[1].description
                                }
                            >
                                <BottomBarItem key={item[0]} item={item} />
                            </li>
                        )}
                    </React.Fragment>
                ))}
            </ul>
        </div>
    );
};
