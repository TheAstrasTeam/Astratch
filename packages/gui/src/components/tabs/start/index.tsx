import { t } from 'astratch-i18n';
import { Logo } from '../../logo';
import styles from './index.module.scss';

import CreateProjectIcon from '@as/createProject.svg?react';
import OpenProjectIcon from '@as/openProject.svg?react';
import RecentProjectIcon from '@as/recentProject.svg?react';
import { tabsManager } from '../../../lib/TabsManager';
import { CreateProjectPanel } from '../createProject';
import { Hr } from '../../hr';
import { Box } from '../../box';

export const CreateStartPanel = ({ id, pos }: { id: string; pos: 'first' | 'second' }) => {
    const createProject = () => {
        tabsManager.addAndReplaceGroup(id, {
            ...tabsManager.getGroup(id)!,
            [pos === 'first' ? 'firstElement' : 'secondElement']: {
                Renderer: CreateProjectPanel,
                name: t('gui:tab.start.createProject.name'),
            },
        });
    };
    return (
        <div className={styles.main}>
            <div className={styles.logo}>
                <Logo />
            </div>

            <span className={styles.randomTitle}>准备好把白纸变成绚烂的画了吗？</span>
            <span className={styles.title}>{t('gui:tab.start.fromWhere.name')}</span>

            <Box tipMode='markdown' tip={t('gui:tab.start.createProjectFaster.tip')}>
                <button className={styles.button}>
                    <CreateProjectIcon />
                    {t('gui:tab.start.createProjectFaster.name')}
                </button>
            </Box>
            <Hr />
            <button className={styles.button} onClick={createProject}>
                <CreateProjectIcon />
                {t('gui:tab.start.createProject.name')}
            </button>
            <button className={styles.button}>
                <OpenProjectIcon />
                {t('gui:tab.start.openProject.name')}
            </button>
            <button className={styles.button}>
                <RecentProjectIcon />
                {t('gui:tab.start.recentProject.name')}
            </button>
        </div>
    );
};
