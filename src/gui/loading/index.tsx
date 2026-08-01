import { t } from 'i18next';
import LoadingLogo from '../../components/loadingLogo';
import styles from './index.module.scss';
import Title from '../../components/title';

const Loading = (): React.ReactNode => {
    return (
        <div className={styles.loading}>
            <div className={styles.loader}>
                <LoadingLogo />
            </div>

            <div
                style={{
                    textAlign: 'right',
                }}
                className={styles.loaderText}
            >
                <Title titleContent={t('gui:loading.title')} />
            </div>
        </div>
    );
};

export default Loading;
