import { t } from 'i18next';
import styles from './index.module.scss';
import { useSplitPane } from '../splitPane/context';
import CollapseIcon from '../../assets/collapse.svg?react';
import { useEffect, useState } from 'react';
import { events, type IScreenSize, type IVM, type TProjectMetaEvent } from '../../types/vm/vm';

/** 屏幕标题栏的高度 */
const SCREEN_TITLE_HEIGHT = 30;

const Screen = ({ vm }: { vm: IVM }) => {
    const { setSecondSize, subscribeMove } = useSplitPane();
    const [isCollapsing, setCollapsing] = useState(true);
    const [screenSize, setScreenSize] = useState<IScreenSize>(
        vm.runtime.settings.projectMeta.projectScreenSize,
    );

    const handleCollapseScreen = () => {
        setSecondSize(SCREEN_TITLE_HEIGHT);
    };

    useEffect(() => {
        const handleUpdateScreenSize = (size: TProjectMetaEvent) => {
            setScreenSize({
                width: size.width,
                height: size.height,
            });
        };
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
            <canvas width={screenSize.width} height={screenSize.height} />
        </div>
    );
};

export { Screen, SCREEN_TITLE_HEIGHT };
