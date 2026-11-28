import { t } from 'astratch-i18n';
import styles from './index.module.scss';
import { useState } from 'react';
import { Name } from './name';
import { Path } from './path';
import { Validate } from './validate';
import { PROJECT_CONFIG_KEYS, type IProjectMeta } from 'astratch-vm';
import { tabsManager } from '../../../lib/TabsManager';
import { CreateStartPanel } from '../start';
import { Settings } from './settings';

export interface ICreateProjectData {
    name: string;
    path:
        | {
              bySingleFile: false;
              pathHandle: FileSystemDirectoryHandle;
          }
        | {
              bySingleFile: true;
          };
    config: IProjectMeta['config'];
}

export const CreateProjectPanel = ({ id, pos }: { id: string; pos: 'first' | 'second' }) => {
    /** 0: 项目名 1：项目位置 2：项目参数 3：确认 */
    const [progress, setProgress] = useState(0);
    const [canNext, setCanNext] = useState(true);

    const [data, setData] = useState<ICreateProjectData>({
        name: '',
        path: {
            bySingleFile: true,
        },
        config: {
            ...(Object.fromEntries(
                PROJECT_CONFIG_KEYS.map(key => [key, false]),
            ) as IProjectMeta['config']),
            frameSync: true,
        },
    });

    const propSetData = (data: ICreateProjectData, canNext: boolean) => {
        setData(data);
        setCanNext(canNext);
    };

    const renderProgress = () => {
        switch (progress) {
            case 0:
                return <Name data={data} setData={propSetData} />;
            case 1:
                return <Path data={data} setData={propSetData} />;
            case 2:
                return <Settings data={data} setData={propSetData} />;
            case 3:
                return <Validate data={data} />;
        }
    };

    const next = () => {
        setData({
            ...data,
            name: data.name || t('gui:project.defaultName'),
        });
        setProgress(v => v + 1);
    };

    const back = () => {
        if (progress === 0)
            tabsManager.changeElement(id, pos, CreateStartPanel, t('gui:tab.start.name'));
        else setProgress(v => v - 1);
    };

    return (
        <div className={styles.main}>
            <h1>{t('gui:tab.createProject.title')}</h1>
            <div className={styles.createPanel}>
                <div className={styles.left}>
                    <div className={styles.content}>{renderProgress()}</div>
                    <div className={styles.buttonPanel}>
                        <button onClick={back}>
                            {progress === 0 ? t('gui:button.cancel') : t('gui:button.back')}
                        </button>
                        <button disabled={!canNext} onClick={next}>
                            {progress === 3 ? t('gui:button.done') : t('gui:button.next')}
                        </button>
                    </div>
                </div>
                <div className={styles.right}>ICON</div>
            </div>
        </div>
    );
};
