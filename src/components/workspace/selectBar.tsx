import React from 'react';
import styles from './selectBar.module.scss';

const SelectBar = ({ title, children }: { title: string; children: React.ReactNode }) => {
    return (
        <div className={styles.selectBar}>
            <div className={styles.selectBarTitleDiv}>
                <span className={styles.selectBarTitle}>{title}</span>
            </div>
            <div className={styles.selectBarContents}>{children}</div>
        </div>
    );
};

export default SelectBar;
