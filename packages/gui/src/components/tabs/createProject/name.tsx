import { t } from 'astratch-i18n';
import type { ICreateProjectData } from '.';
import styles from './index.module.scss';

export const Name = ({
    data,
    setData,
}: {
    data: ICreateProjectData;
    setData: (data: ICreateProjectData, canNext: boolean) => void;
}) => {
    return (
        <div className={styles.name}>
            <h2>{t('gui:tab.createProject.name.title')}</h2>
            <input
                className={styles.input}
                value={data.name}
                placeholder={t('gui:project.defaultName')}
                onChange={e => {
                    setData(
                        {
                            ...data,
                            name: e.target.value,
                        },
                        !!data.name.trim(),
                    );
                }}
            />
            <br />
            <span>
                {t('gui:tab.createProject.name.isThatYouWant', {
                    name: data.name || t('gui:project.defaultName'),
                })}
            </span>
            <p className={styles.p}>{t('gui:tab.createProject.name.introduce')}</p>
        </div>
    );
};
