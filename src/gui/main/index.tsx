// import i18next from 'i18next';
import type { IVM } from '../../types/vm';
import WorkSpace from '../blocks';
// import { useState, useCallback } from 'react';
// import { localStorageIDs } from '../../utils/localstorage';
// import { languageResources } from '../../i18n';

import styles from './index.module.scss';
import './public.scss';
import { useGUIStore, useLoadingStore } from '../../stores/useGUIStore';
import { guiInterface } from '../../types/gui';
import Start from '../start';
import CreateProject from '../createProjet';
import Loading from '../loading';
import MenuBar from '../menubar';

const GUI = ({ vm }: { vm: IVM }): React.ReactNode => {
    // const [_language, setLanguage] = useState(i18next.language);
    // 控制显示界面
    const nowGuiInterface = useGUIStore(state => state.guiInterface);
    const isLoading = useLoadingStore(state => state.loading);
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
            {nowGuiInterface === guiInterface.CREATE_PROJECT && <CreateProject vm={vm} />}
            {nowGuiInterface === guiInterface.START && <Start vm={vm} />}
            {nowGuiInterface === guiInterface.EDITOR && (
                <>
                    {/* <div className={styles.toolbar}>
                        <select onChange={void handleLanguageChanged} value={language}>
                            {Object.keys(languageResources).map(lan => (
                                <option value={lan} key={lan}>
                                    {lan}
                                </option>
                            ))}
                        </select>
                    </div> */}
                    <div className={styles.workspaceArea}>
                        {/* 这是一个测试，给工作区包一个容器 */}
                        <WorkSpace key='workspace' vm={vm} />
                    </div>
                </>
            )}
        </div>
    );
};

export default GUI;
