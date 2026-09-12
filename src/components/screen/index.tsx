import { t } from 'i18next';
import styles from './index.module.scss';
import { useSplitPane } from '../splitPane/context';
import { useEffect, useRef, useState } from 'react';
import { events, type IScreenSize, type IVM, type TProjectMetaEvent } from '../../types/vm/vm';
import classNames from 'classnames';

import CollapseIcon from '../../assets/collapse.svg?react';
import StartIcon from '../../assets/controls/start.svg?react';
import StopIcon from '../../assets/controls/stop.svg?react';
import PauseIcon from '../../assets/controls/pause.svg?react';
import StartLineIcon from '../../assets/controls/start-line.svg?react';
import StopLineIcon from '../../assets/controls/stop-line.svg?react';
import PauseLineIcon from '../../assets/controls/pause-line.svg?react';

import FullModeIcon from '../../assets/fullScreen.svg?react';
import UnFullModeIcon from '../../assets/unFullScreen.svg?react';

/** 屏幕标题栏的高度 */
const SCREEN_TITLE_HEIGHT = 30;

const ControllerButtons = ({ collapse = false }: { collapse?: boolean }) => {
    return (
        <div
            className={classNames(styles.controller, {
                [styles.collapse]: collapse,
            })}
        >
            <button className={classNames(styles.controllerButton, styles.start)}>
                {collapse ? <StartLineIcon /> : <StartIcon />}
            </button>
            <button className={classNames(styles.controllerButton, styles.pause)}>
                {collapse ? <PauseLineIcon /> : <PauseIcon />}
            </button>
            <button className={classNames(styles.controllerButton, styles.stop)}>
                {collapse ? <StopLineIcon /> : <StopIcon />}
            </button>
            {collapse && (
                <button className={classNames(styles.controllerButton, styles.fullScreen)}>
                    <FullScreenButton />
                </button>
            )}
        </div>
    );
};

const FullScreenButton = ({ isFull = false }: { isFull?: boolean }) =>
    isFull ? <UnFullModeIcon /> : <FullModeIcon />;

const Screen = ({ vm }: { vm: IVM }) => {
    const { setSecondSize, subscribeMove } = useSplitPane();
    const [isCollapsing, setCollapsing] = useState(true);
    const [screenSize, setScreenSize] = useState<IScreenSize>(
        vm.runtime.settings.projectMeta.projectScreenSize,
    );

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleCollapseScreen = () => {
        setSecondSize(SCREEN_TITLE_HEIGHT);
    };

    useEffect(() => {
        const selectCanvas = (needInit = false) => {
            if (!canvasRef.current) return;
            vm.runtime.render.setCanvas(canvasRef.current);
            if (needInit) vm.runtime.render.initRenderer();
        };
        const handleUpdateScreenSize = (size: TProjectMetaEvent) => {
            setScreenSize({
                width: size.width,
                height: size.height,
            });
            selectCanvas();
        };
        selectCanvas(true);
        vm.off(events.UPDATE_PROJECT_META, handleUpdateScreenSize);
        vm.on(events.UPDATE_PROJECT_META, handleUpdateScreenSize);
        return () => {
            vm.off(events.UPDATE_PROJECT_META, handleUpdateScreenSize);
        };
    });

    useEffect(
        () =>
            subscribeMove(ratio => {
                if (ratio <= 0.95) setCollapsing(false);
                else setCollapsing(true);
            }),
        [subscribeMove, setCollapsing],
    );

    return (
        <div className={styles.main}>
            <div className={styles.title} style={{ height: `${String(SCREEN_TITLE_HEIGHT)}px` }}>
                <div className={styles.left}>
                    <span>{t('gui:screen.title')}</span>
                </div>
                <div className={styles.right}>
                    {isCollapsing && (
                        <div className={styles.screenController}>
                            <ControllerButtons collapse={true} />
                        </div>
                    )}

                    {!isCollapsing && (
                        <button
                            title={t('gui:screen.collapse.title')}
                            // 焦点切换会让浏览器跳过同帧的 CSS 过渡，导致折叠动画失效
                            // 太几把奇怪了，铸币浏览器
                            onMouseDown={e => {
                                e.preventDefault();
                            }}
                            onClick={handleCollapseScreen}
                        >
                            <CollapseIcon />
                        </button>
                    )}
                </div>
            </div>
            {!isCollapsing && (
                <>
                    <div className={styles.screenController}>
                        <div className={styles.left}>
                            <ControllerButtons />
                        </div>
                        <div className={styles.right}>
                            <button
                                className={classNames(styles.controllerButton, styles.fullScreen)}
                            >
                                <FullScreenButton />
                            </button>
                        </div>
                    </div>
                    <div className={styles.screenDiv}>
                        <canvas
                            className={styles.screen}
                            ref={canvasRef}
                            width={screenSize.width}
                            height={screenSize.height}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export { Screen, SCREEN_TITLE_HEIGHT };
