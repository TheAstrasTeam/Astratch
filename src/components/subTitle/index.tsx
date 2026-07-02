import styles from './index.module.scss';

/**
 * 小标题
 * @param titleContent 标题
 * @param introduce 介绍
 * @param row 是否横向排列
 * @returns
 */
const SubTitle = ({
    titleContent,
    introduce = '',
    row = false,
}: {
    titleContent: string;
    introduce?: string;
    row?: boolean;
}) => {
    return (
        <div
            className={styles.subTitleContent}
            style={row ? { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } : {}}
        >
            <span className={styles.subTitle}>
                {titleContent}
            </span>
            {introduce && (
                <span className={styles.introduce}>
                    {introduce}
                </span>
            )}
        </div>
    );
};

export default SubTitle;
