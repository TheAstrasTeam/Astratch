/**
 * @license
 * Copyright 2026 AstrasTeam
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import styles from './index.module.scss';
import { useSettings } from '../../settings/SettingsRegistry';
import { guiInterface, guiThemes } from '../../types/gui';
import { t } from 'i18next';

import lightLogo from '../../assets/lightLogo.svg';
import darkLogo from '../../assets/darkLogo.svg';
import AddIcon from '../../assets/add.svg?react';
import LoadIcon from '../../assets/load.svg?react';

import DebugIcon from '../../assets/bug.svg?react';

import { useGUIStore } from '../../stores/useGUIStore';
import { debug } from '../../utils/debug';
import { type IVM } from '../../types/vm';
import { selectProjectThenJump } from '../../utils/ash-gui';

// 通过此处获取一个句子😋
import { getWelcomeText } from './welcome_text';

const Start = ({ vm }: { vm: IVM }): React.ReactNode => {
    const themeMode = useSettings(state => state.guiThemeMode);
    const userName = useSettings(state => state.userName);
    const setInterface = useGUIStore(state => state.setInterface);
    const [welcome] = useState(() => getWelcomeText(String(userName)));
    const handleCreateProject = () => {
        // 开始创建项目
        setInterface(guiInterface.CREATE_PROJECT);
    };
    const gotoEditor = () => {
        vm.runtime.createTarget({
            name: 'test',
            mode: 'entity',
        });
        // eslint-disable-next-line react-hooks/immutability
        vm.isEditingProject = true;
        setInterface(guiInterface.EDITOR);
    };
    return (
        <div className={styles.start}>
            <img
                src={themeMode === guiThemes.dark ? lightLogo : darkLogo}
                className={styles.logo}
            />
            <span className={styles.welcome}>{welcome}</span>
            <div style={{ marginTop: '32px' }} />
            <button className={styles.button} onClick={handleCreateProject}>
                <AddIcon />
                {t('gui:start.createProject')}
            </button>
            <button
                className={styles.button}
                onClick={() => void selectProjectThenJump(vm, setInterface)}
            >
                <LoadIcon />
                {t('gui:start.loadProject')}
            </button>

            {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
            {debug && (
                <>
                    <h4>DEBUG TOOLS</h4>
                    <button className={styles.button} onClick={gotoEditor}>
                        <DebugIcon />
                        DEBUG: 跳转到编辑器
                    </button>
                </>
            )}
        </div>
    );
};

export default Start;
