import styles from './index.module.scss';
import useSettingsStore from '../../utils/settings';
import { guiThemes } from '../../types/gui';
import { t } from 'i18next';

import lightLogo from '../../assets/lightLogo.svg';
import darkLogo from '../../assets/darkLogo.svg';
import AddIcon from '../../assets/add.svg?react';
import LoadIcon from '../../assets/load.svg?react';

const Start = (): React.ReactNode => {
    const settings = useSettingsStore(state => state.guiTheme);
    const userName = useSettingsStore(state => state.userName);
    const spawnWelcomeText = () => {
        // eslint-disable-next-line react-hooks/purity
        return t(`gui:welcomeText${Math.floor(Math.random() * 10).toString()}`, { name: userName });
    };
    return (
        <div className={styles.start}>
            <img src={settings === guiThemes.dark ? lightLogo : darkLogo} className={styles.logo} />
            <span className={styles.welcome}>{spawnWelcomeText()}</span>
            <div style={{ marginTop: '32px' }} />
            <button className={styles.button}>
                <AddIcon />
                Create a project
            </button>
            <button className={styles.button}>
                <LoadIcon />
                Load a project
            </button>
        </div>
    );
};

export default Start;
