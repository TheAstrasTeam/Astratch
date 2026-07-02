import styles from './index.module.scss';

/**
 * 大标题
 * @param titleContent 标题
 * @param introduce 介绍
 * @returns 
 */
const Title = ({ titleContent, introduce = '' }: { titleContent: string; introduce?: string }) => {
    return (
        <div className={styles.titleContent}>
            <span className={styles.title}>{titleContent}</span>
            {introduce && <span className={styles.introduce}>{introduce}</span>}
        </div>
    );
};

export default Title;
