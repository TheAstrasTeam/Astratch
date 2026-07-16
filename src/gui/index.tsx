// import i18next from 'i18next';
import type { IVM } from '../types/vm';
import WorkSpace from './workspace';
// import { useState, useCallback } from 'react';
// import { localStorageIDs } from '../../utils/localstorage';
// import { languageResources } from '../../i18n';

import styles from './index.module.scss';
import './public.scss';
import { useLoadingStore } from '../stores/useGUIStore';
import Loading from './loading';
import MenuBar from './menubar';
import { ContextMenuLayer } from './contextMenu';

const GUI = ({ vm }: { vm: IVM }): React.ReactNode => {
    const isLoading: boolean = useLoadingStore(state => state.loading);
    return (
        <div className={styles.app}>
            <MenuBar vm={vm} />
            {isLoading && <Loading />}
            <div className={styles.workspaceArea}>
                <WorkSpace vm={vm} />
            </div>
            <ContextMenuLayer />
        </div>
    );
};

export default GUI;
