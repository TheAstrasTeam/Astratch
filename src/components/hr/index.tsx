/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import styles from './index.module.scss';

const Hr = ({ label }: { label: string }) => {
    return (
        <div className={styles.hrContent}>
            <span>{label}</span>
            <hr />
        </div>
    );
};

export default Hr;
