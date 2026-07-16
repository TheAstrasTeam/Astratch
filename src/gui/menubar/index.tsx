import type { IVM } from '../../types/vm';
import styles from './index.module.scss';
import Logo from '../../assets/ashIconTransparent.svg?react';
import { t } from 'i18next';
import { MenuItem, MenuDivider } from '@szhsin/react-menu';
import { useContextMenu } from '../contextMenu';
import { AllContextMenu, guiInterface } from '../../types/gui';
import { useGUIStore } from '../../stores/useGUIStore';
import { selectProjectThenJump } from '../../utils/ash-gui';

const MenuBar = ({ vm }: { vm: IVM }): React.ReactNode => {
    const setInterface = useGUIStore(state => state.setInterface);
    const { openMenu: openFileMenu } = useContextMenu(AllContextMenu.MENUBAR_FILE, close => (
        <>
            <MenuItem
                onClick={() => {
                    setInterface(guiInterface.CREATE_PROJECT);
                }}
            >
                {t('gui:menu.new')}
            </MenuItem>
            <MenuItem onClick={() => void selectProjectThenJump(vm, setInterface)}>
                {t('gui:menu.open')}
            </MenuItem>
            <MenuDivider />
            <MenuItem onClick={close}>{t('gui:menu.save')}</MenuItem>
            <MenuItem onClick={close}>{t('gui:menu.saveAs')}</MenuItem>
            <MenuDivider />
            <MenuItem onClick={close}>{t('gui:menu.exit')}</MenuItem>
        </>
    ));

    const handleMenuClick = (openFn: (point: { x: number; y: number }) => void) => {
        return (e: React.MouseEvent<HTMLElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            openFn({ x: rect.left, y: rect.bottom });
        };
    };

    return (
        <div className={styles.menubarContents}>
            <div className={styles.menubarContentsLeft}>
                <Logo className={styles.menubarContentLogo} />
                <div className={styles.leftUl}>
                    <button onClick={handleMenuClick(openFileMenu)}>{t('gui:menu.file')}</button>
                    <button>{t('gui:menu.edit')}</button>
                    <button>{t('gui:menu.run')}</button>
                    <button>{t('gui:menu.help')}</button>
                </div>
            </div>
            <div className={styles.menubarContentsCenter}>
                <input className={styles.search} placeholder={t('gui:searchTip')}></input>
            </div>
            <div className={styles.menubarContentsRight}>Right</div>
        </div>
    );
};

export default MenuBar;
