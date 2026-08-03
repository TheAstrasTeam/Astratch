import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import styles from './index.module.scss';

export const ConfirmModal = ({
    message,
    callback,
}: {
    message: string;
    callback: ((result: boolean) => void) | undefined;
}) => {
    const { closeSelf } = useModalInstance();

    const handleButtonClick = async (result: boolean, close: unknown = null) => {
        if (callback) callback(result);
        await closeSelf(close);
    };

    return (
        <Modal
            fullScreen={false}
            close={async result => {
                await handleButtonClick(false, result);
            }}
            title={t('gui:confirm.title')}
            description={t('gui:confirm.description')}
        >
            <div className={styles.content}>
                <div className={styles.text}>{message}</div>
                <div className={styles.buttons}>
                    <button
                        onClick={() => {
                            void handleButtonClick(true);
                        }}
                    >
                        {t('gui:button.ok')}
                    </button>
                    <button
                        onClick={() => {
                            void handleButtonClick(false);
                        }}
                    >
                        {t('gui:button.no')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
