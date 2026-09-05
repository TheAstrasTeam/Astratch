/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useModalInstance } from '@reactleaf/modal';
import { Modal } from '../Modal/modalWindow';
import { t } from 'i18next';
import styles from './index.module.scss';
import lightLogo from '../../assets/lightLogo.svg';
import darkLogo from '../../assets/darkLogo.svg';
import { useSettings } from '../../settings/SettingsRegistry';
import { guiThemes } from '../../types/gui';

const VERSION = '0.0.0';

export const AboutModal = () => {
    const { closeSelf } = useModalInstance();
    const themeMode = useSettings(state => state.guiThemeMode);

    return (
        <Modal
            windowID='about'
            fullScreen={false}
            close={closeSelf}
            title={t('gui:menu.about')}
            description={t('gui:about.description')}
            minWidth={475}
            minHeight={300}
        >
            <div className={styles.content}>
                <img
                    src={themeMode === guiThemes.dark ? lightLogo : darkLogo}
                    alt='Astratch Logo'
                    className={styles.logo}
                />
                <div className={styles.name}>Astratch</div>
                <div className={styles.version}>
                    {t('gui:about.version')} {VERSION}
                </div>
                <div className={styles.slogan}>{t('gui:about.slogan')}</div>
                <div className={styles.divider} />
                <div className={styles.copyright}>{t('gui:about.copyright')}</div>
            </div>
        </Modal>
    );
};
