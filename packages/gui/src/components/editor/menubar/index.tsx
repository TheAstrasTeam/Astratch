import { t } from 'astratch-i18n';

import styles from './index.module.scss';

import LogoIcon from '@as/logo/transparent.svg?react';
import { useQuickOpen } from '../../quickOpen/api';
import { Menubar_RendererMenu } from '../../menus';
import { MenubarManagerPositions } from '../../../lib/MenubarManager';

export const Menubar = () => {
    const { openQuickOpen, isOpenQuickOpen } = useQuickOpen(state => state);
    return (
        <div className={styles.main}>
            <div className={styles.left}>
                <LogoIcon className={styles.logoIcon} />
                <div className={styles.menus}>
                    {MenubarManagerPositions.map(pos => (
                        <Menubar_RendererMenu
                            key={pos}
                            Button={
                                <div className={styles.menu}>
                                    <span>{t(`gui:menu_${pos}`)}</span>
                                </div>
                            }
                            pos={pos}
                        />
                    ))}
                </div>
            </div>
            <div className={styles.center}>
                {!isOpenQuickOpen && (
                    <div className={styles.quickOpenInput} onClick={openQuickOpen}>
                        <span>{t('gui:quickOpen_tip')}</span>
                    </div>
                )}
            </div>
            <div className={styles.right}></div>
        </div>
    );
};
