import i18next from 'i18next';
import type { IVM } from '../../types/vm';
import WorkSpace from '../blocks';
import { useState } from 'react';
import { localStorageIDs } from '../../utils/localstorage';
import { languageResources } from '../../i18n';

import styles from './index.module.scss';
import './public.scss';
import '../css/constants.scss';
import '../css/zIndex.scss';
import useGUIStore from '../../utils/gui/interface';
import { guiInterface } from '../../types/gui';
import Start from '../start';

const GUI = ({ vm }: { vm: IVM }): React.ReactNode => {
    const [language, setLanguage] = useState(i18next.language);
    // 控制显示界面
    const nowGuiInterface = useGUIStore(state => state.guiInterface);
    const handleLanguageChanged = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value);
        localStorage.setItem(localStorageIDs.Language, e.target.value);
        await i18next.changeLanguage(e.target.value);
        await vm.runtime.blocks.init();
        vm.runtime.blocks.restartWorkspace();
    };
    return (
        <div className={styles.app}>
            {nowGuiInterface === guiInterface.START && <Start />}
            {nowGuiInterface === guiInterface.EDITOR && (
                <>
                    <div className={styles.toolbar}>
                        {/* 我添加了一个工具栏用来保证布局 */}
                        <button
                            onClick={async () => {
                                await vm.selectProject();
                            }}
                        >
                            select a folder
                        </button>
                        <button
                            onClick={async () => {
                                await vm.initProject();
                            }}
                        >
                            init project
                        </button>
                        <select onChange={handleLanguageChanged} value={language}>
                            {Object.keys(languageResources).map(lan => (
                                <option value={lan} key={lan}>
                                    {lan}
                                </option>
                            ))}
                        </select>
                    </div>
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
