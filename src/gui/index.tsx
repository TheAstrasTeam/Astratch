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

const GUI = ({ vm }: { vm: IVM }): React.ReactNode => {
    // const [_language, setLanguage] = useState(i18next.language);
    const isLoading: boolean = useLoadingStore(state => state.loading);
    // const handleLanguageChanged = useCallback(
    //     async (e: React.ChangeEvent<HTMLSelectElement>) => {
    //         const value = e.target.value;
    //         setLanguage(value);
    //         localStorage.setItem(localStorageIDs.Language, value);

    //         try {
    //             await i18next.changeLanguage(value);
    //             await vm.runtime.blocks.init();
    //             await vm.runtime.blocks.restartWorkspace();
    //         } catch {
    //             // 待定
    //         }
    //     },
    //     [vm],
    // );
    return (
        <div className={styles.app}>
            {/* menubar 菜单栏 */}
            <MenuBar vm={vm} />
            {isLoading && <Loading />}
            <div className={styles.workspaceArea}>
                <WorkSpace vm={vm} />
            </div>
        </div>
    );
};

export default GUI;
