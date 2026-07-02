import { useState } from 'react';
import type { IVM } from '../../types/vm';
import styles from './index.module.scss';

import ashIcon from '../../assets/projectScheme/ASH.svg';
import scratchIcon from '../../assets/projectScheme/ScratchSb3.svg';
import turboWarpIcon from '../../assets/projectScheme/TurboWarpSb3.svg';
import folderIcon from '../../assets/folder.svg';
import flashIcon from '../../assets/flash.svg';
import moreBlockIcon from '../../assets/moreBlocks.svg';
import doneAllIcon from '../../assets/doneAll.svg';
import compatibleExtension from '../../assets/compatibleExtension.svg';

import { t } from 'i18next';
import Title from '../../components/title';
import SubTitle from '../../components/subTitle';
import { toID } from '../../utils/ashString';

const tabs = {
    SCHEME: 'scheme',
    CONFIG: 'config',
} as const;
type TcreateProjectTabs = (typeof tabs)[keyof typeof tabs];
const targets = {
    ASH: 'ash',
    SCRATCH: 'scratch',
    TURBOWARP: 'turbowarp',
};
type TallTarget = (typeof targets)[keyof typeof targets];

const Target = ({
    onClick,
    id,
    icon,
    tags = [],
    select = false,
}: {
    onClick: () => void;
    id: string;
    icon: string;
    tags?: string[];
    select?: boolean;
}): React.ReactNode => (
    <div
        className={select ? styles.schemeBoxSelect : styles.schemeBox}
        onClick={onClick}
        tabIndex={select ? 0 : -1}
        role='option'
        aria-selected={select}
        data-target={id}
        onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
            }
        }}
    >
        <img className={styles.schemeIcon} src={icon} />
        <div className={styles.schemeContent}>
            <span className={styles.schemeTitle}>{t(`gui:scheme.${id}.title`)}</span>
            <span className={styles.schemeIntroduce}>{t(`gui:scheme.${id}.introduce`)}</span>
            <div className={styles.schemeTags}>
                {tags.map((tag, index) => (
                    <div
                        key={tag}
                        className={index == 0 ? styles.schemeTagImportant : styles.schemeTag}
                    >
                        {t(`gui:scheme.${tag}`)}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const CompareContentSelectTip = ({
    img,
    titleContent,
    introduce,
}: {
    img: string;
    titleContent: string;
    introduce: string;
}): React.ReactNode => (
    <div className={styles.compareContentSelect}>
        <img src={img} className={styles.compareContentSelectIcon} />
        <SubTitle row={true} titleContent={titleContent} introduce={introduce} />
    </div>
);

const CreateProject = ({ vm }: { vm: IVM }): React.ReactNode => {
    const [nowTab, setTab] = useState<TcreateProjectTabs>(tabs.SCHEME);
    const [selectedTarget, setSelectTarget] = useState<TallTarget>(targets.ASH);

    const [projectName, setProjectName] = useState<string>('');
    const [projectIdAuto, setProjectIdAuto] = useState<string>('');
    const [projectId, setProjectId] = useState<string>('');

    const [projectFolderName, setProjectFolderName] = useState<string>('');

    const handleSelectFolder = async () => {
        await vm.projectManager.selectFolder();
        setProjectFolderName(vm.projectManager.folderHandle?.name ?? '');
    };

    const handleNextClick = () => {
        if (nowTab === tabs.SCHEME) {
            setTab(tabs.CONFIG);
        } else {
            // todo 完成配置
        }
    };
    const handleBackClick = () => {
        if (nowTab === tabs.CONFIG) {
            setTab(tabs.SCHEME);
        }
    };
    return (
        <div className={styles.main}>
            <div className={styles.nextBar}>
                {/* 这里的顺序是倒的 */}
                <button className={styles.nextButton} onClick={handleNextClick}>
                    {t('gui:next')}
                </button>
                {nowTab === tabs.CONFIG && (
                    <button className={styles.backButton} onClick={handleBackClick}>
                        {t('gui:back')}
                    </button>
                )}
            </div>
            {nowTab === tabs.SCHEME && (
                <div className={styles.schemes}>
                    <div className={styles.schemesContent}>
                        <div className={styles.schemesSelect}>
                            <Title
                                titleContent={t('gui:scheme.title')}
                                introduce={t('gui:scheme.introduce')}
                            />
                            <div
                                className={styles.schemesSelectBox}
                                role='listbox'
                                aria-label={t('gui:scheme.title')}
                                onKeyDown={e => {
                                    const options: HTMLElement[] = Array.from(
                                        e.currentTarget.querySelectorAll('[role="option"]'),
                                    );
                                    if (options.length === 0) return;
                                    const currentIndex = options.findIndex(
                                        opt => opt === document.activeElement,
                                    );
                                    let nextIndex: number | null = null;
                                    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                                        nextIndex =
                                            currentIndex === -1
                                                ? 0
                                                : (currentIndex + 1) % options.length;
                                    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                                        nextIndex =
                                            currentIndex === -1
                                                ? options.length - 1
                                                : (currentIndex - 1 + options.length) %
                                                  options.length;
                                    } else if (e.key === 'Home') {
                                        nextIndex = 0;
                                    } else if (e.key === 'End') {
                                        nextIndex = options.length - 1;
                                    }
                                    if (nextIndex === null) return;
                                    e.preventDefault();
                                    const next = options[nextIndex];
                                    next.focus();
                                    const targetId = next.getAttribute('data-target');
                                    if (targetId) setSelectTarget(targetId);
                                }}
                            >
                                <Target
                                    onClick={() => {
                                        setSelectTarget(targets.ASH);
                                    }}
                                    id={targets.ASH}
                                    icon={ashIcon}
                                    tags={['recommended']}
                                    select={selectedTarget === targets.ASH}
                                />
                                <Target
                                    onClick={() => {
                                        setSelectTarget(targets.SCRATCH);
                                    }}
                                    id={targets.SCRATCH}
                                    icon={scratchIcon}
                                    select={selectedTarget === targets.SCRATCH}
                                />
                                <Target
                                    onClick={() => {
                                        setSelectTarget(targets.TURBOWARP);
                                    }}
                                    id={targets.TURBOWARP}
                                    icon={turboWarpIcon}
                                    select={selectedTarget === targets.TURBOWARP}
                                />
                            </div>
                        </div>
                        <div className={styles.compare}>
                            {selectedTarget === targets.ASH && (
                                <div className={styles.compareContent}>
                                    <Title
                                        titleContent={t('gui:scheme.ash.title')}
                                        introduce={t('gui:scheme.ash.introduce')}
                                    />
                                    <hr className={styles.compareContentSelectHr} />
                                    <CompareContentSelectTip
                                        img={folderIcon}
                                        titleContent={t('gui:scheme.ash.title.tip1')}
                                        introduce={t('gui:scheme.ash.title.introduce1')}
                                    />
                                    <CompareContentSelectTip
                                        img={flashIcon}
                                        titleContent={t('gui:scheme.ash.title.tip2')}
                                        introduce={t('gui:scheme.ash.title.introduce2')}
                                    />
                                    <CompareContentSelectTip
                                        img={moreBlockIcon}
                                        titleContent={t('gui:scheme.ash.title.tip3')}
                                        introduce={t('gui:scheme.ash.title.introduce3')}
                                    />
                                </div>
                            )}
                            {selectedTarget === targets.SCRATCH && (
                                <div className={styles.compareContent}>
                                    <Title
                                        titleContent={t('gui:scheme.scratch.title')}
                                        introduce={t('gui:scheme.scratch.introduce')}
                                    />
                                    <hr className={styles.compareContentSelectHr} />
                                    <CompareContentSelectTip
                                        img={doneAllIcon}
                                        titleContent={t('gui:scheme.compatible.tip')}
                                        introduce={t('gui:scheme.compatible.introduce')}
                                    />
                                </div>
                            )}
                            {selectedTarget === targets.TURBOWARP && (
                                <div className={styles.compareContent}>
                                    <Title
                                        titleContent={t('gui:scheme.turbowarp.title')}
                                        introduce={t('gui:scheme.turbowarp.introduce')}
                                    />
                                    <hr className={styles.compareContentSelectHr} />
                                    <CompareContentSelectTip
                                        img={doneAllIcon}
                                        titleContent={t('gui:scheme.compatible.tip')}
                                        introduce={t('gui:scheme.compatible.introduce')}
                                    />
                                    <CompareContentSelectTip
                                        img={compatibleExtension}
                                        titleContent={t('gui:scheme.turbowarp.tip1')}
                                        introduce={t('gui:scheme.turbowarp.introduce1')}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {nowTab === tabs.CONFIG && (
                <div className={styles.config}>
                    <Title
                        titleContent={t('gui:config.title')}
                        introduce={t('gui:config.introduce')}
                    />
                    {/* 这里的配置有点复杂所以就不提取重复了 */}
                    <div className={styles.inputBox}>
                        <div className={styles.inputInputBox}>
                            <span className={styles.inputText}>{t('gui:config.name')}</span>
                            <span className={styles.inputTextTip}>{t('gui:config.name.tip')}</span>
                        </div>
                        <input
                            className={styles.inputInput}
                            placeholder={t('gui:config.name.input.tip')}
                            onChange={e => {
                                setProjectName(e.target.value);
                                setProjectIdAuto(toID(e.target.value));
                            }}
                        />
                    </div>
                    <div className={styles.inputBox}>
                        <div className={styles.inputInputBox}>
                            <span className={styles.inputText}>{t('gui:config.id')}</span>
                            <span className={styles.inputTextTip}>{t('gui:config.id.tip')}</span>
                        </div>
                        <input
                            className={styles.inputInput}
                            placeholder={t('gui:config.id.input.tip')}
                            value={projectId || projectIdAuto}
                            onChange={e => {
                                setProjectId(e.target.value);
                            }}
                        />
                    </div>
                    {/* todo: 支持设备不支持FAS的情况 */}
                    <div className={styles.inputBox}>
                        <div className={styles.inputInputBox}>
                            <span className={styles.inputText}>{t('gui:config.path')}</span>
                            <span className={styles.inputTextTip}>{t('gui:config.path.tip')}</span>
                        </div>
                        <div>
                            {projectFolderName && (
                                <code className={styles.inputPathText}>{projectFolderName}</code>
                            )}
                            <button onClick={() => void handleSelectFolder()}>
                                {t('gui:config.path.button')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateProject;
