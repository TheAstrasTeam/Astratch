import { t } from 'astratch-i18n';
import type { ICreateProjectData } from '.';
import styles from './index.module.scss';
import { Hr } from '../../hr';
import { PROJECT_CONFIG_KEYS } from 'astratch-vm';

export const Validate = ({ data }: { data: ICreateProjectData }) => {
    return (
        <div className={styles.validate}>
            <h2>{t('gui:tab.createProject.validate.title')}</h2>
            <br />
            <ul>
                <li>
                    <h3>{t('gui:tab.createProject.name.title')}:</h3>
                    <span>{data.name}</span>
                </li>

                <li>
                    <Hr />
                </li>
                <li>
                    <h3>{t('gui:tab.createProject.path.title')}:</h3>
                    <span>
                        {data.path.bySingleFile
                            ? t('gui:tab.createProject.path.useFile')
                            : data.path.pathHandle.name}
                    </span>
                </li>

                <li>
                    <Hr />
                </li>
                {PROJECT_CONFIG_KEYS.map(key => (
                    <li key={key}>
                        <h3>{t(`gui:project.${key}`)}:</h3>
                        <span>{data.config[key] ? t('gui:enabled') : t('gui:disabled')}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
