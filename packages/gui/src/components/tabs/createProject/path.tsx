import { t } from 'astratch-i18n';
import type { ICreateProjectData } from '.';
import styles from './index.module.scss';

import ByFolderIcon from '@as/saveMethod/byFolder.svg?react';
import ByFileIcon from '@as/saveMethod/byFile.svg?react';
import { Hr } from '../../hr';
import classNames from 'classnames';
import { useState } from 'react';
import { Box } from '../../box';

export const Path = ({
    data,
    setData,
}: {
    data: ICreateProjectData;
    setData: (data: ICreateProjectData, canNext: boolean) => void;
}) => {
    // 给UI使用
    const [bySingleFile, setBySingleFile] = useState(data.path.bySingleFile);
    const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | undefined>(
        data.path.bySingleFile ? undefined : data.path.pathHandle,
    );
    const onUseFolder = (existingFolderHandle = folderHandle) => {
        setBySingleFile(false);
        if (existingFolderHandle) {
            setData(
                {
                    ...data,
                    path: {
                        bySingleFile: false,
                        pathHandle: existingFolderHandle,
                    },
                },
                true,
            );
        } else {
            setData(data, false);
        }
    };
    const selectFolder = () => {
        void (async () => {
            try {
                const handle = await window.showDirectoryPicker!();
                if (!handle) return;
                setFolderHandle(handle);
                onUseFolder(handle);
                return;
            } catch {
                // 忽略
            }
            onUseFolder();
        })();
    };
    return (
        <div className={styles.path}>
            <h2>{t('gui:tab.createProject.path.title')}</h2>
            <h3>{t('gui:tab.createProject.path.chooseSaveMethod')}</h3>
            <Box
                tip={
                    !window.showDirectoryPicker
                        ? t('gui:tab.createProject.path.useFolder.unavailable')
                        : ''
                }
                style={{
                    width: '100%',
                }}
            >
                <button
                    className={classNames(styles.saveMethodButton, {
                        [styles.selected]: !bySingleFile,
                    })}
                    onClick={() => {
                        onUseFolder();
                    }}
                    disabled={!window.showDirectoryPicker}
                >
                    <ByFolderIcon />
                    <div className={styles.introduce}>
                        <h2>{t('gui:tab.createProject.path.useFolder')}</h2>
                        <p className={styles.p}>
                            {t('gui:tab.createProject.path.useFolder.introduce')}
                        </p>
                    </div>
                </button>
            </Box>
            <button
                className={classNames(styles.saveMethodButton, {
                    [styles.selected]: bySingleFile,
                })}
                onClick={() => {
                    setData(
                        {
                            ...data,
                            path: {
                                bySingleFile: true,
                            },
                        },
                        true,
                    );
                    setBySingleFile(true);
                }}
            >
                <ByFileIcon />
                <div className={styles.introduce}>
                    <h2>{t('gui:tab.createProject.path.useFile')}</h2>
                    <p className={styles.p}>{t('gui:tab.createProject.path.useFile.introduce')}</p>
                </div>
            </button>
            <Hr />
            <h2>
                {bySingleFile
                    ? t('gui:tab.createProject.path.useFile')
                    : t('gui:tab.createProject.path.useFolder')}
            </h2>
            {!bySingleFile && (
                <div className={styles.saveConfig}>
                    <button onClick={selectFolder}>
                        {t('gui:tab.createProject.path.selectFolder')}
                    </button>
                    <span>{folderHandle?.name}</span>
                </div>
            )}
        </div>
    );
};
