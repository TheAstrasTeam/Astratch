import styles from './index.module.scss';

export const EditingWorkspace = ({ width }: { width: string }) => {
    return (
        <div
            className={styles.workspace}
            style={{
                width,
            }}
        ></div>
    );
};
