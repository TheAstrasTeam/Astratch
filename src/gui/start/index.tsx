import styles from './index.module.scss';
import useSettingsStore from '../../stores/useSettingsStore';
import { guiInterface, guiThemes } from '../../types/gui';
import { t } from 'i18next';

import lightLogo from '../../assets/lightLogo.svg';
import darkLogo from '../../assets/darkLogo.svg';
import AddIcon from '../../assets/add.svg?react';
import LoadIcon from '../../assets/load.svg?react';
import { useGUIStore } from '../../stores/useGUIStore';

const Start = (): React.ReactNode => {
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
    return (
        <div className={styles.start}>
            <img src={settings === guiThemes.dark ? lightLogo : darkLogo} className={styles.logo} />
            <span className={styles.welcome}>{spawnWelcomeText()}</span>
            <div style={{ marginTop: '32px' }} />
            <button className={styles.button} onClick={handleCreateProject}>
                <AddIcon />
                {t('gui:start.createProject')}
            </button>
            <button className={styles.button}>
                <LoadIcon />
                {t('gui:start.loadProject')}
            </button>
        </div>
    );
};

export default Start;
