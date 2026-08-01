import styles from './index.module.scss';

/**
 * LOGO加载动画
 */
const LoadingLogo = () => {
    const circle1Id = styles.circle_1 || styles.circle1 || 'circle_1';
    const circle2Id = styles.circle_2 || styles.circle2 || 'circle_2';
    const circle3Id = styles.circle_3 || styles.circle3 || 'circle_3';
    return (
        <div className={styles.container}>
            <div className={styles.logo}>
                <div className={styles.circle} id={circle1Id}></div>
                <div className={styles.circle} id={circle2Id}></div>
                <div className={styles.circle} id={circle3Id}></div>
            </div>
        </div>
    );
};

export default LoadingLogo;
