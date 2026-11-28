import { t } from 'astratch-i18n';
import type { ICreateProjectData } from '.';
import styles from './index.module.scss';
import type { ChangeEventHandler } from 'react';
import { PROJECT_CONFIG_KEYS } from 'astratch-vm';

const Li = ({
    text,
    description,
    value,
    onchange,
}: {
    text: string;
    description: string;
    value: boolean;
    onchange: ChangeEventHandler<HTMLInputElement, HTMLInputElement>;
}) => {
    return (
        <li>
            <input type='checkbox' checked={value} onChange={onchange} />
            <div>
                <h3>{text}</h3>
                <p className={styles.p}>{description}</p>
            </div>
        </li>
    );
};

export const Settings = ({
    data,
    setData,
}: {
    data: ICreateProjectData;
    setData: (data: ICreateProjectData, canNext: boolean) => void;
}) => {
    return (
        <div className={styles.settings}>
            <h2>{t('gui:tab.createProject.settings.title')}</h2>
            <ul>
                {PROJECT_CONFIG_KEYS.map(key => (
                    <Li
                        text={t(`gui:project.${key}`)}
                        description={t(`gui:project.${key}.description`)}
                        value={data.config[key]}
                        onchange={target => {
                            setData(
                                {
                                    ...data,
                                    config: {
                                        ...data.config,
                                        [key]: target.currentTarget.checked,
                                    },
                                },
                                true,
                            );
                        }}
                        key={key}
                    />
                ))}
            </ul>
        </div>
    );
};
