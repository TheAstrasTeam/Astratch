import styles from './index.module.css';
import lightLogo from '../../assets/lightLogo.svg';
import darkLogo from '../../assets/darkLogo.svg';
import useSettingsStore from '../../utils/settings';
import { guiThemes } from '../../types/gui';
import { t } from 'i18next';

const Start = (): React.ReactNode => {
    const settings = useSettingsStore(state => state.guiTheme);
    const userName = useSettingsStore(state => state.userName);
    const spawnWelcomeText = () => {
        // eslint-disable-next-line react-hooks/purity
        return t(`gui:welcomeText${Math.floor(Math.random() * 10)}`, { name: userName });
    };
    return (
        <div className={styles.start}>
            <img src={settings === guiThemes.dark ? lightLogo : darkLogo} className={styles.logo} />
            <span className={styles.welcome}>{spawnWelcomeText()}</span>
            <div style={{ marginTop: '32px' }} />
            <button className={styles.button}>Create a project</button>
            <button className={styles.button}>Load a project</button>
        </div>
    );
};

export default Start;
