import styles from './index.module.scss';
import useSettingsStore from '../../stores/useSettingsStore';
import { guiInterface, guiThemes } from '../../types/gui';
import { t } from 'i18next';

import lightLogo from '../../assets/lightLogo.svg';
import darkLogo from '../../assets/darkLogo.svg';
import AddIcon from '../../assets/add.svg?react';
import LoadIcon from '../../assets/load.svg?react';

import DebugIcon from '../../assets/bug.svg?react';

import { useGUIStore } from '../../stores/useGUIStore';
import { debug } from '../../utils/debug';
import { type IVM } from '../../types/vm';

const Start = ({ vm }: { vm: IVM }): React.ReactNode => {
    const settings = useSettingsStore(state => state.guiTheme);
    const userName = useSettingsStore(state => state.userName);
    const setInterface = useGUIStore(state => state.setInterface);
    const spawnWelcomeText = () => {
        // eslint-disable-next-line react-hooks/purity
        return t(`gui:welcomeText${Math.floor(Math.random() * 10).toString()}`, { name: userName });
    };
    const handleCreateProject = () => {
        // 开始创建项目
        setInterface(guiInterface.CREATE_PROJECT);
    };
    const handleLoadProject = async () => {
        const loadedProject = await vm.loadProject();
        if (loadedProject) setInterface(guiInterface.EDITOR);
    };
    return (
        <div className={styles.start}>
            <img
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                src={settings.gui === guiThemes.dark ? lightLogo : darkLogo}
                className={styles.logo}
            />
            <span className={styles.welcome}>{spawnWelcomeText()}</span>
            <div style={{ marginTop: '32px' }} />
            <button className={styles.button} onClick={handleCreateProject}>
                <AddIcon />
                {t('gui:start.createProject')}
            </button>
            <button className={styles.button} onClick={() => void handleLoadProject()}>
                <LoadIcon />
                {t('gui:start.loadProject')}
            </button>

            {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
            {debug && (
                <>
                    <h4>DEBUG TOOLS</h4>
                    <button
                        className={styles.button}
                        onClick={() => {
                            setInterface(guiInterface.EDITOR);
                        }}
                    >
                        <DebugIcon />
                        DEBUG: 跳转到编辑器
                    </button>
                </>
            )}
        </div>
    );
};

export default Start;
