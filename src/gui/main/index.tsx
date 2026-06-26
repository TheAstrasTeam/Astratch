import i18next from 'i18next';
import type { IVM } from '../../types/vm';
import WorkSpace from '../blocks';
import './index.css';
import { useState } from 'react';
import { localStorageIDs } from '../../utils/localstorage';
import { languageResources } from '../../i18n';

const GUI = ({ vm }: { vm: IVM }): React.ReactNode => {
    const [language, setLanguage] = useState(i18next.language);
    console.log(i18next);
    const handleLanguageChanged = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value);
        localStorage.setItem(localStorageIDs.Language, e.target.value);
        await i18next.changeLanguage(e.target.value);
        await vm.Blocks.init();
        vm.Blocks.restartWorkspace();
    };
    return (
        <div className='app'>
            <div className='toolbar'>
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
            <div className='workspace-area'>
                {/* 这是一个测试，给工作区包一个容器 */}
                <WorkSpace key='workspace' vm={vm} />
            </div>
        </div>
    );
};

export default GUI;
