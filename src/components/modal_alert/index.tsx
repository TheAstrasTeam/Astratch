import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import styles from './index.module.scss';

export const AlertModal = ({
    message,
    callback,
}: {
    message: string;
    callback: (() => void) | undefined;
}) => {
    const { closeSelf } = useModalInstance();

    const handleButtonClick = async (result: unknown = null) => {
        if(callback) callback();
        await closeSelf(result);
    }; 

    return (
        <Modal
            fullScreen={false}
            close={handleButtonClick}
            title={t('gui:alert')}
            description={t('gui:alert_description')}
        >
            <div className={styles.content}>
                <div className={styles.text}>{message}</div>
                <button onClick={() => void handleButtonClick()}>{t('gui:ok')}</button>
            </div>
        </Modal>
    );
};
