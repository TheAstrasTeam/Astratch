import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import styles from './index.module.scss';
import { useState } from 'react';

export const PromptModal = ({
    message,
    defaultValue,
    callback,
}: {
    message: string;
    defaultValue: string;
    callback: ((result: string) => void) | undefined;
}) => {
    const { closeSelf } = useModalInstance();
    const [nowValue, setValue] = useState<string>(defaultValue);

    const handleButtonClick = async (result: string, close: unknown = null) => {
        if (callback) callback(result);
        await closeSelf(close);
    };

    return (
        <Modal
            fullScreen={false}
            close={async result => {
                await handleButtonClick(nowValue, result);
            }}
            title={t('gui:prompt')}
            description={t('gui:prompt_description')}
        >
            <div className={styles.content}>
                <div className={styles.state}>
                    <span>{message}</span>
                    <input
                        className={styles.text}
                        value={nowValue}
                        onChange={e => {
                            setValue(e.target.value);
                        }}
                    ></input>
                </div>
                <div className={styles.buttons}>
                    <button
                        onClick={() => {
                            void handleButtonClick(nowValue);
                        }}
                    >
                        {t('gui:done')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
